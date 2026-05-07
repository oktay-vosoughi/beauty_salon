import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../db/prisma";
import { requireUser } from "../middleware/auth";
import { paymentLimiter } from "../middleware/rateLimit";
import { getPayTRToken, verifyPayTRCallback } from "../services/paytr";
import type { AuthSession } from "../middleware/auth";

const router = Router();

const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID ?? "";
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY ?? "";
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT ?? "";
const TEST_MODE = process.env.PAYTR_TEST_MODE ?? "1";
const WEB_BASE_URL = process.env.WEB_BASE_URL ?? "http://localhost:3000";

router.post("/paytr/token", requireUser, paymentLimiter, async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const orderId = Number(req.body.orderId);
    if (!orderId || isNaN(orderId)) {
      res.status(400).json({ error: "Geçersiz sipariş ID" });
      return;
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: "PENDING" },
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!order) {
      res.status(404).json({ error: "Sipariş bulunamadı" });
      return;
    }

    // Idempotency: reuse existing payment token if already fetched
    let payment = await prisma.payment.findUnique({ where: { orderId } });

    let merchantOid: string;
    if (payment && payment.status === "INIT" && payment.providerToken) {
      res.json({ token: payment.providerToken });
      return;
    }

    merchantOid = payment?.merchantOid ?? uuidv4().replace(/-/g, "").slice(0, 64);

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId,
          merchantOid,
          amount: order.totalAmount,
          status: "INIT",
        },
      });
    }

    const userIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "127.0.0.1";

    const paymentAmountKurus = Math.round(Number(order.totalAmount) * 100);

    const userBasket: Array<[string, string, number]> = order.items.map((item) => [
      item.titleSnapshot,
      (Number(item.unitPrice) * 100).toFixed(0),
      item.quantity,
    ]);

    const shippingAddr = order.shippingAddressJson as Record<string, string>;
    const userAddress = `${shippingAddr.line1}, ${shippingAddr.district}, ${shippingAddr.city} ${shippingAddr.postalCode}`;

    const token = await getPayTRToken({
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      merchantOid,
      email: order.user.email,
      paymentAmount: paymentAmountKurus,
      currency: "TL",
      noInstallment: 0,
      maxInstallment: 0,
      userName: order.user.name,
      userAddress,
      userPhone: order.user.phone ?? shippingAddr.phone ?? "",
      userBasket,
      userIp,
      testMode: TEST_MODE,
      debugOn: process.env.NODE_ENV === "development" ? "1" : "0",
      okUrl: `${WEB_BASE_URL}/odeme/sonuc?status=success&orderId=${orderId}`,
      failUrl: `${WEB_BASE_URL}/odeme/sonuc?status=fail&orderId=${orderId}`,
      timeoutLimit: "30",
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerToken: token, status: "INIT" },
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// PayTR S2S callback — no auth, hash verified
router.post("/paytr/callback", async (req, res, next) => {
  try {
    const params = req.body as Record<string, string>;

    if (!verifyPayTRCallback(params, MERCHANT_KEY, MERCHANT_SALT)) {
      console.error("PayTR callback hash verification failed", params);
      res.status(400).send("HASH_ERROR");
      return;
    }

    const { merchant_oid, status, total_amount } = params;

    const payment = await prisma.payment.findUnique({ where: { merchantOid: merchant_oid } });
    if (!payment) {
      // PayTR requires 200 OK always or it retries indefinitely
      console.error("PayTR callback: unknown merchant_oid", merchant_oid);
      res.send("OK");
      return;
    }

    // Idempotent: already processed
    if (payment.status === "SUCCESS" || payment.status === "FAILED") {
      res.send("OK");
      return;
    }

    // Verify amount matches what we recorded to prevent amount manipulation
    const expectedKurus = Math.round(Number(payment.amount) * 100);
    if (Number(total_amount) !== expectedKurus) {
      console.error("PayTR callback amount mismatch", { expected: expectedKurus, got: total_amount, merchant_oid });
      res.send("OK");
      return;
    }

    if (status === "success") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            amount: Number(total_amount) / 100,
            callbackPayloadJson: params,
          },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "PAID" },
        });
        // Stock was already decremented at order creation — no action needed
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", callbackPayloadJson: params },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELLED" },
        });
        // Restore stock reserved at order creation
        const items = await tx.orderItem.findMany({ where: { orderId: payment.orderId } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    }

    res.send("OK");
  } catch (err) {
    next(err);
  }
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const payments = await prisma.payment.findMany({
      where: { order: { userId } },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { id: true, totalAmount: true, status: true } } },
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

export default router;
