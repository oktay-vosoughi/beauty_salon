import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireUser } from "../middleware/auth";
import type { AuthSession } from "../middleware/auth";

const router = Router();
router.use(requireUser);

const shippingSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  line1: z.string().min(1).max(255),
  district: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(5).max(10),
});

const createOrderSchema = z.object({
  shippingAddress: shippingSchema,
});

router.post("/", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { select: { id: true, title: true, price: true, stock: true, isActive: true } } },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: "Sepetiniz boş" });
      return;
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (!item.product.isActive) {
        res.status(400).json({ error: `"${item.product.title}" artık satışta değil` });
        return;
      }
      if (item.product.stock < item.quantity) {
        res.status(400).json({ error: `"${item.product.title}" için yeterli stok yok` });
        return;
      }
    }

    const SHIPPING_THRESHOLD = 300;
    const SHIPPING_COST = 29.90;
    const itemsTotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const shippingCost = itemsTotal < SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
    const totalAmount = itemsTotal + shippingCost;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddressJson: parsed.data.shippingAddress,
          items: {
            createMany: {
              data: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.product.price,
                titleSnapshot: item.product.title,
              })),
            },
          },
        },
        include: { items: true },
      });

      // Stock is NOT decremented here. It is decremented only when payment
      // succeeds (see PayTR success callback in routes/payments.ts). This avoids
      // leaking stock on abandoned/unpaid orders. The availability check above
      // gives the customer an early "out of stock" message; the authoritative
      // decrement happens atomically at payment confirmation.

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { title: true, slug: true } } } },
        payment: { select: { status: true, amount: true } },
        shipment: {
          select: {
            trackingNumber: true,
            status: true,
            syncedAt: true,
            cargoCompanyName: true,
          },
        },
      },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), userId },
      include: {
        items: { include: { product: { select: { title: true, slug: true, images: { take: 1 } } } } },
        payment: true,
        shipment: {
          select: {
            trackingNumber: true,
            status: true,
            syncedAt: true,
            cargoCompanyName: true,
          },
        },
      },
    });
    if (!order) { res.status(404).json({ error: "Sipariş bulunamadı" }); return; }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
