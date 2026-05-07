import { Router } from "express";
import { prisma } from "../db/prisma";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const where = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      }),
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: "Ürün bulunamadı" });
      return;
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
