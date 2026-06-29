import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireUser } from "../middleware/auth";
import type { AuthSession } from "../middleware/auth";

const router = Router();
router.use(requireUser);

const addressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  line1: z.string().min(1).max(255),
  district: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(5).max(10),
});

router.get("/", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz adres" });
      return;
    }
    const address = await prisma.address.create({
      data: { ...parsed.data, userId },
    });
    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Geçersiz adres ID" });
      return;
    }
    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz adres" });
      return;
    }
    // Ownership check
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Adres bulunamadı" });
      return;
    }
    const address = await prisma.address.update({
      where: { id },
      data: parsed.data,
    });
    res.json(address);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Geçersiz adres ID" });
      return;
    }
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Adres bulunamadı" });
      return;
    }
    await prisma.address.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
