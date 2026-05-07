import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { loginLimiter, registerLimiter } from "../middleware/rateLimit";
import type { AuthSession } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(191).toLowerCase(),
  password: z.string().min(8).max(128),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz veri" });
      return;
    }

    const { name, email, password, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Bu e-posta adresi zaten kullanılıyor" });
      return;
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone },
      select: { id: true, name: true, email: true, role: true },
    });

    req.session.regenerate((regenerateErr) => {
      if (regenerateErr) return next(regenerateErr);
      const sess = req.session as AuthSession;
      sess.userId = user.id;
      sess.userRole = user.role;
      res.status(201).json({ user });
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "E-posta veya şifre hatalı" });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "E-posta veya şifre hatalı" });
      return;
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      res.status(401).json({ error: "E-posta veya şifre hatalı" });
      return;
    }

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    req.session.regenerate((regenerateErr) => {
      if (regenerateErr) return next(regenerateErr);
      const sess = req.session as AuthSession;
      sess.userId = userData.id;
      sess.userRole = userData.role;
      res.json({ user: userData });
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.json({ ok: true });
  });
});

router.get("/me", async (req, res, next) => {
  try {
    const sess = req.session as AuthSession;
    if (!sess.userId) {
      res.status(401).json({ error: "Oturum yok" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: sess.userId },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Kullanıcı bulunamadı" });
      return;
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
