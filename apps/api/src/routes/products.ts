import { Router } from "express";
import { prisma } from "../db/prisma";
import { cacheGet, cacheSet } from "../lib/cache";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const cacheKey = `products:list:${page}:${limit}:${categoryId ?? ""}:${search ?? ""}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.json(JSON.parse(cached));
      return;
    }

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

    const result = { items, total, page, limit, pages: Math.ceil(total / limit) };
    await cacheSet(cacheKey, JSON.stringify(result), 60);

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const cacheKey = `products:detail:${req.params.slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.json(JSON.parse(cached));
      return;
    }

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

    await cacheSet(cacheKey, JSON.stringify(product), 60);

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
