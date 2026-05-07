import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";

const router = Router();

const productSchema = z.object({
  slug: z.string().min(1).max(191).regex(/^[a-z0-9-]+$/, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  categoryId: z.number().int().positive(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string(), sortOrder: z.number().int() })).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const [total, items] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" } },
          _count: { select: { orderItems: true } },
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
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) { res.status(404).json({ error: "Ürün bulunamadı" }); return; }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz veri" });
      return;
    }
    const { images, ...data } = parsed.data;
    const product = await prisma.product.create({
      data: {
        ...data,
        price: data.price,
        images: images ? { createMany: { data: images } } : undefined,
      },
      include: { images: true },
    });
    res.status(201).json(product);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      res.status(409).json({ error: "Bu slug zaten kullanılıyor" });
      return;
    }
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz veri" });
      return;
    }
    const { images, ...data } = parsed.data;
    const productId = Number(req.params.id);
    const product = await prisma.$transaction(async (tx) => {
      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId } });
      }
      return tx.product.update({
        where: { id: productId },
        data: {
          ...data,
          ...(images !== undefined && {
            images: { createMany: { data: images } },
          }),
        },
        include: { images: true },
      });
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // Soft delete: deactivate instead of hard delete to preserve order history
    await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
