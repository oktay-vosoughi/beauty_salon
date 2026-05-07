import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireUser } from "../middleware/auth";
import type { AuthSession } from "../middleware/auth";

const router = Router();

router.use(requireUser);

const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
});

async function getOrCreateCart(userId: number) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, title: true, slug: true, price: true, stock: true, isActive: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });
}

router.get("/", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const cart = await getOrCreateCart(userId);
    res.json(cart);
  } catch (err) { next(err); }
});

router.post("/items", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const parsed = cartItemSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0]?.message }); return; }
    const { productId, quantity } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
    if (!product) { res.status(404).json({ error: "Ürün bulunamadı" }); return; }
    if (product.stock < quantity) { res.status(400).json({ error: "Stok yetersiz" }); return; }

    const cart = await getOrCreateCart(userId);
    const existing = cart.items.find((i) => i.productId === productId);

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
    }

    const updatedCart = await getOrCreateCart(userId);
    res.status(201).json(updatedCart);
  } catch (err) { next(err); }
});

router.patch("/items/:itemId", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const quantity = z.number().int().min(1).max(99).safeParse(req.body.quantity);
    if (!quantity.success) { res.status(400).json({ error: "Geçersiz miktar" }); return; }

    const item = await prisma.cartItem.findFirst({
      where: { id: Number(req.params.itemId), cart: { userId } },
      include: { product: { select: { stock: true } } },
    });
    if (!item) { res.status(404).json({ error: "Ürün bulunamadı" }); return; }
    if (item.product.stock < quantity.data) { res.status(400).json({ error: "Stok yetersiz" }); return; }

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: quantity.data } });
    const updatedCart = await getOrCreateCart(userId);
    res.json(updatedCart);
  } catch (err) { next(err); }
});

router.delete("/items/:itemId", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const item = await prisma.cartItem.findFirst({
      where: { id: Number(req.params.itemId), cart: { userId } },
    });
    if (!item) { res.status(404).json({ error: "Ürün bulunamadı" }); return; }
    await prisma.cartItem.delete({ where: { id: item.id } });
    const updatedCart = await getOrCreateCart(userId);
    res.json(updatedCart);
  } catch (err) { next(err); }
});

export default router;
