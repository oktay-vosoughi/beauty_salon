import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";

const router = Router();

const statusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const where = status
      ? { status: status as "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" }
      : {};

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          payment: { select: { status: true, amount: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { title: true, slug: true } } } },
        payment: true,
        shipment: true,
      },
    });
    if (!order) { res.status(404).json({ error: "Sipariş bulunamadı" }); return; }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz sipariş durumu" });
      return;
    }
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: parsed.data.status },
    });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
