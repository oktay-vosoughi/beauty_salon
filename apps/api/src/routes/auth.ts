import { Router } from "express";
import argon2 from "argon2";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from "../middleware/rateLimit";
import { sendPasswordResetEmail } from "../lib/email";
import { requireUser } from "../middleware/auth";
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

    if (!user.passwordHash) {
      res.status(401).json({ error: "Bu hesap Google ile oluşturulmuştur. Google ile giriş yapınız." });
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

    const dbUser = await prisma.user.findUnique({
      where: { id: sess.userId },
      select: { id: true, name: true, email: true, role: true, phone: true, passwordHash: true },
    });

    if (!dbUser) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Kullanıcı bulunamadı" });
      return;
    }

    const { passwordHash, ...rest } = dbUser;
    res.json({ user: { ...rest, hasPassword: !!passwordHash } });
  } catch (err) {
    next(err);
  }
});

// --- Update Profile (name + phone) ---
const profileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(20).optional().or(z.literal("")),
});

router.patch("/profile", requireUser, async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz bilgi" });
      return;
    }
    const phone = parsed.data.phone ? parsed.data.phone : null;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name, phone },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// --- Change Password ---
const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128),
});

router.post("/change-password", requireUser, loginLimiter, async (req, res, next) => {
  try {
    const userId = (req.session as AuthSession).userId!;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Yeni şifre en az 8 karakter olmalıdır." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: "Kullanıcı bulunamadı" });
      return;
    }

    // Accounts that already have a password must verify the current one.
    // Google accounts (no password yet) may set one for the first time
    // without a current password — they are already authenticated by session.
    if (user.passwordHash) {
      if (!parsed.data.currentPassword) {
        res.status(400).json({ error: "Mevcut şifrenizi girin." });
        return;
      }
      const valid = await argon2.verify(user.passwordHash, parsed.data.currentPassword);
      if (!valid) {
        res.status(400).json({ error: "Mevcut şifreniz hatalı." });
        return;
      }
    }

    const passwordHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id });
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- Forgot Password ---

router.post("/forgot-password", forgotPasswordLimiter, async (req, res, next) => {
  try {
    const email = z.string().email().toLowerCase().safeParse(req.body?.email);
    if (!email.success) {
      res.status(400).json({ error: "Geçerli bir e-posta adresi girin." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.data } });
    let devResetUrl: string | undefined;

    if (user?.passwordHash) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: tokenHash, resetPasswordExpires: expires },
      });

      const webBase = process.env.WEB_BASE_URL ?? "http://localhost:3000";
      const resetUrl = `${webBase}/sifre-sifirla/${rawToken}`;

      try {
        const delivery = await sendPasswordResetEmail(user.email, user.name, resetUrl);
        if (delivery.status === "development" && process.env.NODE_ENV !== "production") {
          devResetUrl = delivery.resetUrl;
        }
      } catch (err) {
        console.error("Password reset email failed:", err);
      }
    }

    // Always respond OK to avoid user enumeration.
    if (devResetUrl) {
      res.json({
        ok: true,
        message: "SMTP yapılandırılmadı. Geliştirme ortamı için sıfırlama bağlantısı oluşturuldu.",
        devResetUrl,
      });
      return;
    }

    res.json({ ok: true, message: "E-posta gönderildi. Lütfen gelen kutunuzu kontrol edin." });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const schema = z.object({
      token: z.string().min(1),
      password: z.string().min(8).max(128),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz istek." });
      return;
    }

    const { token, password } = parsed.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: "Sıfırlama bağlantısı geçersiz veya süresi dolmuş." });
      return;
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetPasswordToken: null, resetPasswordExpires: null },
    });

    // Invalidate all existing sessions for this user
    await prisma.session.deleteMany({ where: { userId: user.id } });

    res.json({ ok: true, message: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz." });
  } catch (err) {
    next(err);
  }
});

// --- Google OAuth 2.0 ---

router.get("/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: "Google ile giriş şu an kullanılabilir değil." });
    return;
  }

  const webBase = process.env.WEB_BASE_URL ?? "http://localhost:3000";
  const callbackUrl = `${webBase}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const webBase = process.env.WEB_BASE_URL ?? "http://localhost:3000";

    if (!code) {
      res.redirect(`${webBase}/giris?error=google_cancelled`);
      return;
    }

    const callbackUrl = `${webBase}/api/auth/google/callback`;

    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData.error);
      res.redirect(`${webBase}/giris?error=google_failed`);
      return;
    }

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as { id?: string; email?: string; name?: string };

    if (!profile.id || !profile.email) {
      res.redirect(`${webBase}/giris?error=google_failed`);
      return;
    }

    const googleId = profile.id;
    const email = profile.email.toLowerCase();
    const name = profile.name ?? email.split("@")[0];

    // Find existing user by googleId or email, then link/create
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { googleId, email, name },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        const sess = req.session as AuthSession;
        sess.userId = user!.id;
        sess.userRole = user!.role;
        resolve();
      });
    });

    res.redirect(`${webBase}/hesabim`);
  } catch (err) {
    next(err);
  }
});

export default router;
