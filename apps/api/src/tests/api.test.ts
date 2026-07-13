import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import argon2 from "argon2";
import crypto from "crypto";
import app from "../app";
import { prisma } from "../db/prisma";

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_RESET_EMAIL = `reset-${Date.now()}@example.com`;
const TEST_ADMIN_EMAIL = `admin-${Date.now()}@example.com`;
const TEST_ORDER_EMAIL = `order-${Date.now()}@example.com`;
const TEST_CAMPAIGN_SLUG = `test-kampanya-${Date.now()}`;
const TEST_ORDER_CAMPAIGN_SLUG = `test-order-kampanya-${Date.now()}`;
const TEST_PERCENT_CAMPAIGN_SLUG = `test-percent-kampanya-${Date.now()}`;
const TEST_BUY_X_PAY_Y_CAMPAIGN_SLUG = `test-buyxpayy-kampanya-${Date.now()}`;
const TEST_ORDER_CATEGORY_SLUG = `test-order-category-${Date.now()}`;
const TEST_ORDER_PRODUCT_PREFIX = `test-order-product-${Date.now()}`;
const TEST_PASSWORD = "Test1234!";
const TEST_RESET_PASSWORD = "Reset1234!";

// Persistent agent keeps session cookies between requests
const agent = request.agent(app);
const adminAgent = request.agent(app);

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, TEST_RESET_EMAIL, TEST_ADMIN_EMAIL, TEST_ORDER_EMAIL] } } });
});

afterAll(async () => {
  const orderUser = await prisma.user.findUnique({ where: { email: TEST_ORDER_EMAIL }, select: { id: true } });
  if (orderUser) {
    await prisma.payment.deleteMany({ where: { order: { userId: orderUser.id } } });
    await prisma.orderItem.deleteMany({ where: { order: { userId: orderUser.id } } });
    await prisma.order.deleteMany({ where: { userId: orderUser.id } });
    await prisma.cartItem.deleteMany({ where: { cart: { userId: orderUser.id } } });
    await prisma.cart.deleteMany({ where: { userId: orderUser.id } });
  }
  await prisma.campaign.deleteMany({ where: { slug: { in: [TEST_CAMPAIGN_SLUG, TEST_ORDER_CAMPAIGN_SLUG, TEST_PERCENT_CAMPAIGN_SLUG, TEST_BUY_X_PAY_Y_CAMPAIGN_SLUG] } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: TEST_ORDER_PRODUCT_PREFIX } } });
  await prisma.category.deleteMany({ where: { slug: TEST_ORDER_CATEGORY_SLUG } });
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, TEST_RESET_EMAIL, TEST_ADMIN_EMAIL, TEST_ORDER_EMAIL] } } });
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

describe("Campaigns API", () => {
  it("GET /api/campaigns/active-banner — returns 200 with nullable campaign", async () => {
    const res = await request(app).get("/api/campaigns/active-banner");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("campaign");
  });

  it("Admin campaigns — creates, lists, and updates a buy 2 get 2 campaign", async () => {
    const passwordHash = await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });
    await prisma.user.create({
      data: {
        name: "Admin Kampanya",
        email: TEST_ADMIN_EMAIL,
        passwordHash,
        role: "ADMIN",
      },
    });

    const login = await adminAgent
      .post("/api/auth/login")
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_PASSWORD });
    expect(login.status).toBe(200);

    const create = await adminAgent
      .post("/api/admin/campaigns")
      .send({
        slug: TEST_CAMPAIGN_SLUG,
        title: "2 Al 2 Bedava",
        description: "Sepette dört üründe ucuz iki ürün hediye.",
        type: "BUY_2_GET_2",
        isActive: true,
        showOnHomepage: true,
        bannerTitle: "2 Al 2 Bedava",
        bannerText: "Sepete 4 ürün ekleyin, en ucuz 2 ürün bizden.",
        bannerButtonText: "Alışverişe Başla",
        bannerButtonHref: "/urunler",
      });
    expect(create.status).toBe(201);
    expect(create.body.slug).toBe(TEST_CAMPAIGN_SLUG);
    expect(create.body.buyQuantity).toBe(4);
    expect(create.body.payQuantity).toBe(2);

    const percentCreate = await adminAgent
      .post("/api/admin/campaigns")
      .send({
        slug: TEST_PERCENT_CAMPAIGN_SLUG,
        title: "%20 İndirim",
        description: "Tüm sepette yüzde 20 indirim.",
        type: "PERCENT_DISCOUNT",
        discountPercent: 20,
        isActive: false,
        showOnHomepage: false,
      });
    expect(percentCreate.status).toBe(201);
    expect(percentCreate.body.discountPercent).toBe("20");

    const buyXPayYCreate = await adminAgent
      .post("/api/admin/campaigns")
      .send({
        slug: TEST_BUY_X_PAY_Y_CAMPAIGN_SLUG,
        title: "3 Al 1 Öde",
        description: "Sepette 3 üründen en pahalısını öde.",
        type: "BUY_X_PAY_Y",
        buyQuantity: 3,
        payQuantity: 1,
        isActive: false,
        showOnHomepage: false,
      });
    expect(buyXPayYCreate.status).toBe(201);
    expect(buyXPayYCreate.body.buyQuantity).toBe(3);
    expect(buyXPayYCreate.body.payQuantity).toBe(1);

    const list = await adminAgent.get("/api/admin/campaigns");
    expect(list.status).toBe(200);
    expect(list.body.items.some((item: { slug: string }) => item.slug === TEST_CAMPAIGN_SLUG)).toBe(true);

    const update = await adminAgent
      .patch(`/api/admin/campaigns/${create.body.id}`)
      .send({ showOnHomepage: false });
    expect(update.status).toBe(200);
    expect(update.body.showOnHomepage).toBe(false);

    const remove = await adminAgent.delete(`/api/admin/campaigns/${create.body.id}`);
    expect(remove.status).toBe(200);

    const listAfterDelete = await adminAgent.get("/api/admin/campaigns");
    expect(listAfterDelete.status).toBe(200);
    expect(listAfterDelete.body.items.some((item: { slug: string }) => item.slug === TEST_CAMPAIGN_SLUG)).toBe(false);
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

describe("Orders API campaign totals", () => {
  it("POST /api/orders — charges only the two most expensive products when buy 2 get 2 is active", async () => {
    const orderAgent = request.agent(app);
    const passwordHash = await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });
    const user = await prisma.user.create({
      data: {
        name: "Sipariş Kullanıcı",
        email: TEST_ORDER_EMAIL,
        passwordHash,
      },
    });
    const category = await prisma.category.create({
      data: { name: "Test Kampanya Kategorisi", slug: TEST_ORDER_CATEGORY_SLUG },
    });
    const products = await Promise.all(
      [100, 90, 50, 30].map((price, index) =>
        prisma.product.create({
          data: {
            slug: `${TEST_ORDER_PRODUCT_PREFIX}-${index}`,
            title: `Test Kampanya Ürünü ${index + 1}`,
            description: "Kampanya test ürünü",
            price,
            stock: 10,
            isActive: true,
            categoryId: category.id,
          },
        })
      )
    );
    await prisma.campaign.create({
      data: {
        slug: TEST_ORDER_CAMPAIGN_SLUG,
        title: "2 Al 2 Bedava Sipariş Testi",
        type: "BUY_2_GET_2",
        isActive: true,
        showOnHomepage: false,
      },
    });

    const login = await orderAgent
      .post("/api/auth/login")
      .send({ email: user.email, password: TEST_PASSWORD });
    expect(login.status).toBe(200);

    for (const product of products) {
      const add = await orderAgent
        .post("/api/cart/items")
        .send({ productId: product.id, quantity: 1 });
      expect(add.status).toBe(201);
    }

    const cart = await orderAgent.get("/api/cart");
    expect(cart.status).toBe(200);
    expect(Number(cart.body.promotion.total)).toBe(190);
    expect(Number(cart.body.promotion.discountTotal)).toBe(80);

    const res = await orderAgent.post("/api/orders").send({
      shippingAddress: {
        fullName: "Test Kullanıcı",
        phone: "05555555555",
        line1: "Test adres",
        district: "Çekmeköy",
        city: "İstanbul",
        postalCode: "34782",
      },
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.totalAmount)).toBe(190);
    const giftItems = res.body.items.filter((item: { isGift: boolean }) => item.isGift);
    expect(giftItems).toHaveLength(2);
    const giftDiscounts: number[] = giftItems.map((item: { discountAmount: string }) => Number(item.discountAmount));
    expect(giftDiscounts.sort((a: number, b: number) => a - b)).toEqual([30, 50]);
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
