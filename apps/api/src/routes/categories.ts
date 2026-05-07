import { Router } from "express";
import { prisma } from "../db/prisma";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
