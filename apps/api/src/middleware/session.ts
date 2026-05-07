import session from "express-session";
import { Store, SessionData } from "express-session";
import { prisma } from "../db/prisma";
import { v4 as uuidv4 } from "uuid";

class PrismaSessionStore extends Store {
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    super();
    // Cleanup expired sessions every 15 minutes
    this.cleanupInterval = setInterval(
      () => this.cleanExpired(),
      15 * 60 * 1000
    );
    this.cleanupInterval.unref();
  }

  async get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void
  ) {
    try {
      const record = await prisma.session.findUnique({ where: { id: sid } });
      if (!record || record.expiresAt < new Date()) {
        return callback(null, null);
      }
      callback(null, record.data as unknown as SessionData);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: SessionData, callback?: (err?: unknown) => void) {
    try {
      const ttl = (session.cookie?.maxAge ?? 86400000) + Date.now();
      const expiresAt = new Date(ttl);
      const userId = (session as SessionData & { userId?: number }).userId;

      if (!userId) {
        callback?.();
        return;
      }

      await prisma.session.upsert({
        where: { id: sid },
        update: { data: session as object, expiresAt },
        create: { id: sid, userId, data: session as object, expiresAt },
      });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: unknown) => void) {
    try {
      await prisma.session.deleteMany({ where: { id: sid } });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  private async cleanExpired() {
    try {
      await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    } catch {
      // ignore cleanup errors
    }
  }
}

const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret-change-me";

export const sessionMiddleware = session({
  genid: () => uuidv4(),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
