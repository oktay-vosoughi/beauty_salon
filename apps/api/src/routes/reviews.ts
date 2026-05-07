import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireUser } from "../middleware/auth";
import type { AuthSession } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(2000).trim(),
});

// GET /api/reviews?productId=X — approved reviews, public
router.get("/", async (req, res, next) => {
  try {
    const productId = Number(req.query.productId);
    if (!productId || isNaN(productId)) {
      res.status(400).json({ error: "productId zorunludur" });
      return;
    }
    const reviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews — authenticated, post-purchase gate
router.post("/", requireUser, async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz yorum verisi", details: parsed.error.flatten() });
      return;
    }
    const { productId, rating, comment } = parsed.data;

    // Duplicate check
    const existing = await prisma.review.findUnique({ where: { userId_productId: { userId, productId } } });
    if (existing) {
      res.status(409).json({ error: "Bu ürün için zaten yorum yazdınız" });
      return;
    }

    // Purchase gate: user must have a PAID order containing this product
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: "PAID" },
      },
    });
    if (!purchased) {
      res.status(403).json({ error: "Yorum yazabilmek için bu ürünü satın almış olmalısınız" });
      return;
    }

    const review = await prisma.review.create({
      data: { userId, productId, rating, comment },
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/mine — authenticated user's own reviews
router.get("/mine", requireUser, async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { title: true, slug: true, images: { take: 1 } } },
      },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

export default router;
