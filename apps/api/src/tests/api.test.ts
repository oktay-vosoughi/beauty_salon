import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import argon2 from "argon2";
import crypto from "crypto";
import app from "../app";
import { prisma } from "../db/prisma";

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_RESET_EMAIL = `reset-${Date.now()}@example.com`;
const TEST_PASSWORD = "Test1234!";
const TEST_RESET_PASSWORD = "Reset1234!";

// Persistent agent keeps session cookies between requests
const agent = request.agent(app);

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, TEST_RESET_EMAIL] } } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, TEST_RESET_EMAIL] } } });
  await prisma.$disconnect();
});

describe("GET /api/health", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});

describe("Auth flow", () => {
  it("POST /api/auth/register — creates user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test Kullanıcı", email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("POST /api/auth/register — duplicate email → 409", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(409);
  });

  it("POST /api/auth/login — wrong password → 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: "WrongPass999" });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login — success (agent)", async () => {
    const res = await agent
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("GET /api/auth/me — returns user when authenticated (agent)", async () => {
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it("GET /api/auth/me — 401 without session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/forgot-password — stores reset token before responding", async () => {
    const passwordHash = await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });
    await prisma.user.create({
      data: {
        name: "Forgot Kullanıcı",
        email: TEST_RESET_EMAIL,
        passwordHash,
      },
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_RESET_EMAIL });

    expect(res.status).toBe(200);

    const updated = await prisma.user.findUniqueOrThrow({ where: { email: TEST_RESET_EMAIL } });
    expect(updated.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/);
    expect(updated.resetPasswordExpires?.getTime()).toBeGreaterThan(Date.now());
  });

  it("POST /api/auth/forgot-password — returns dev reset link when SMTP is not configured", async () => {
    const previousEnv = {
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      NODE_ENV: process.env.NODE_ENV,
    };
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    process.env.NODE_ENV = "test";

    await prisma.user.deleteMany({ where: { email: TEST_RESET_EMAIL } });
    const passwordHash = await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });
    await prisma.user.create({
      data: {
        name: "Dev Reset Kullanıcı",
        email: TEST_RESET_EMAIL,
        passwordHash,
      },
    });

    try {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: TEST_RESET_EMAIL });

      expect(res.status).toBe(200);
      expect(res.body.devResetUrl).toMatch(/^http:\/\/localhost:3000\/sifre-sifirla\/[a-f0-9]{64}$/);
      expect(res.body.message).toContain("SMTP yapılandırılmadı");
    } finally {
      if (previousEnv.SMTP_USER === undefined) delete process.env.SMTP_USER;
      else process.env.SMTP_USER = previousEnv.SMTP_USER;
      if (previousEnv.SMTP_PASS === undefined) delete process.env.SMTP_PASS;
      else process.env.SMTP_PASS = previousEnv.SMTP_PASS;
      if (previousEnv.NODE_ENV === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnv.NODE_ENV;
    }
  });

  it("POST /api/auth/reset-password — updates password and clears reset token", async () => {
    await prisma.user.deleteMany({ where: { email: TEST_RESET_EMAIL } });
    const rawToken = "reset-token-for-test";
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const oldPasswordHash = await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });

    const user = await prisma.user.create({
      data: {
        name: "Reset Kullanıcı",
        email: TEST_RESET_EMAIL,
        passwordHash: oldPasswordHash,
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, password: TEST_RESET_PASSWORD });

    expect(res.status).toBe(200);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.resetPasswordToken).toBeNull();
    expect(updated.resetPasswordExpires).toBeNull();
    expect(updated.passwordHash).toBeTruthy();
    await expect(argon2.verify(updated.passwordHash!, TEST_RESET_PASSWORD)).resolves.toBe(true);
  });
});

describe("Products API", () => {
  it("GET /api/products — returns paginated list", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("pages");
  });

  it("GET /api/products?limit=3 — honours limit", async () => {
    const res = await request(app).get("/api/products?limit=3");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(3);
  });

  it("GET /api/products — exposes migrated Ntbeauty public catalog", async () => {
    const res = await request(app).get("/api/products?limit=50");
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(27);
    const titles = res.body.items.map((item: { title: string }) => item.title);
    expect(titles).toContain("S.O.S KREM");
    expect(titles).toContain("SOMON DNA SERUM");
    expect(titles).toContain("GÜNEŞ KREMİ 50SPF");
    expect(titles).toContain("BODY GLOW OIL");
  });

  it("GET /api/products/:slug — 404 for unknown slug", async () => {
    const res = await request(app).get("/api/products/does-not-exist-xyz");
    expect(res.status).toBe(404);
  });

  it("GET /api/products/:slug — returns product for valid slug", async () => {
    const list = await request(app).get("/api/products?limit=1");
    if (list.body.items.length === 0) return;
    const slug = list.body.items[0].slug;
    const res = await request(app).get(`/api/products/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(slug);
  });
});

describe("Categories API", () => {
  it("GET /api/categories — returns only categories with active products", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    const slugs = res.body.map((item: { slug: string }) => item.slug);
    expect(slugs).toContain("cilt-bakim");
    expect(slugs).toContain("gunes-urunleri");
    expect(slugs).not.toContain("cilt-bakimi");
    for (const category of res.body as { _count: { products: number } }[]) {
      expect(category._count.products).toBeGreaterThan(0);
    }
  });
});

describe("Cart API (authenticated via agent)", () => {
  it("GET /api/cart — 401 without auth", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("GET /api/cart — 200 when authenticated", async () => {
    const res = await agent.get("/api/cart");
    expect(res.status).toBe(200);
  });
});

describe("PayTR callback endpoint", () => {
  it("POST /api/payments/paytr/callback — rejects invalid hash", async () => {
    const res = await request(app)
      .post("/api/payments/paytr/callback")
      .send({
        merchant_oid: "fake-oid",
        status: "success",
        total_amount: "9990",
        hash: "BADHASH",
      });
    expect(res.status).toBe(400);
    expect(res.text).toBe("HASH_ERROR");
  });
});
