import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { contactLimiter } from "../middleware/rateLimit";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(191).trim(),
  phone: z.string().max(30).trim().optional(),
  message: z.string().min(10).max(3000).trim(),
});

// POST /api/contact
router.post("/", contactLimiter, async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz form verisi", details: parsed.error.flatten() });
      return;
    }
    const { name, email, phone, message } = parsed.data;
    await prisma.contactMessage.create({ data: { name, email, phone, message } });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
