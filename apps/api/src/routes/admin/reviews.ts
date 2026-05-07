import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";

const router = Router();

const moderateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const where = status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {};

    const [total, items] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, title: true, slug: true } },
        },
      }),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = moderateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz yorum durumu" });
      return;
    }
    const review = await prisma.review.update({
      where: { id: Number(req.params.id) },
      data: { status: parsed.data.status },
    });
    res.json(review);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.review.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
