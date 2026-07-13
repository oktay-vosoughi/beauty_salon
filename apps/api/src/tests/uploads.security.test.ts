import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import app from "../app";
import { prisma } from "../db/prisma";
import { PRODUCT_DIR } from "../routes/admin/uploads";

const ADMIN_EMAIL = `upload-admin-${Date.now()}@example.com`;
const ADMIN_PASSWORD = "Admin1234!";

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

async function createLargeJpegOver5Mb(): Promise<Buffer> {
  const width = 2400;
  const height = 2400;
  const channels = 3;
  return sharp(randomBytes(width * height * channels), {
    raw: { width, height, channels },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
}

async function removeUploaded(filename?: string) {
  if (!filename) return;
  sharp.cache(false);
  const filePath = path.join(PRODUCT_DIR, filename);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await fs.rm(filePath, { force: true });
      return;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EBUSY" || attempt === 19) throw err;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

describe("Admin uploads security", () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
    const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });
    await prisma.user.create({
      data: {
        name: "Upload Admin",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "ADMIN",
      },
    });

    const login = await agent
      .post("/api/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(login.status).toBe(200);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
    await prisma.$disconnect();
  });

  it("rejects non-image bytes even when the client labels them as an image", async () => {
    const res = await agent
      .post("/api/admin/uploads")
      .attach("file", Buffer.from("<script>alert(1)</script>"), {
        filename: "payload.png",
        contentType: "image/png",
      });

    try {
      expect(res.status).toBe(415);
      expect(res.body.error).toContain("geçerli bir görsel");
      expect(res.body.filename).toBeUndefined();
    } finally {
      await removeUploaded(res.body.filename);
    }
  });

  it("accepts a valid PNG upload", async () => {
    const res = await agent
      .post("/api/admin/uploads")
      .attach("file", png1x1, {
        filename: "valid.png",
        contentType: "image/png",
      });

    try {
      expect(res.status).toBe(201);
      expect(res.body.url).toMatch(/^\/uploads\/products\/.+\.webp$/);
      expect(res.body.mimetype).toBe("image/webp");
      expect(res.body.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    } finally {
      await removeUploaded(res.body.filename);
    }
  });

  it("accepts and optimizes valid images larger than 5 MB", async () => {
    const largeJpeg = await createLargeJpegOver5Mb();
    expect(largeJpeg.byteLength).toBeGreaterThan(5 * 1024 * 1024);

    const res = await agent
      .post("/api/admin/uploads")
      .attach("file", largeJpeg, {
        filename: "large-product.jpg",
        contentType: "image/jpeg",
      });

    try {
      expect(res.status).toBe(201);
      expect(res.body.url).toMatch(/^\/uploads\/products\/.+\.webp$/);
      expect(res.body.mimetype).toBe("image/webp");
      expect(res.body.size).toBeLessThanOrEqual(5 * 1024 * 1024);
      const stats = await fs.stat(path.join(PRODUCT_DIR, res.body.filename));
      expect(stats.size).toBeLessThanOrEqual(5 * 1024 * 1024);
    } finally {
      await removeUploaded(res.body.filename);
    }
  });
});
