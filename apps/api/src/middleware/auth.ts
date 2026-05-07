import type { RequestHandler } from "express";
import type { SessionData } from "express-session";

export interface AuthSession extends SessionData {
  userId?: number;
  userRole?: string;
}

export const requireUser: RequestHandler = (req, res, next) => {
  const sess = req.session as AuthSession;
  if (!sess.userId) {
    res.status(401).json({ error: "Giriş yapmanız gerekiyor" });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const sess = req.session as AuthSession;
  if (!sess.userId || sess.userRole !== "ADMIN") {
    res.status(403).json({ error: "Yetkiniz yok" });
    return;
  }
  next();
};
