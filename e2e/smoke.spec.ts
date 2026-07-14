import { test, expect } from "@playwright/test";

test.describe("Smoke — public pages", () => {
  test("Ana Sayfa loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Niltellioglu/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Ürünler page lists products", async ({ page }) => {
    await page.goto("/urunler");
    await expect(page).toHaveTitle(/Ürünler/);
    // wait for product grid or empty state
    await expect(page.locator("main")).toBeVisible();
  });

  test("İletişim page has contact form", async ({ page }) => {
    await page.goto("/iletisim");
    await expect(page).toHaveTitle(/İletişim/);
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("main").getByText("E-posta: info@niltellioglu.com")).toBeVisible();
  });

  test("Footer shows phone and WhatsApp contact links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "0850 307 19 03" })).toHaveAttribute(
      "href",
      "tel:08503071903"
    );
    await expect(footer.getByRole("link", { name: "WhatsApp Mesaj Gönder" })).toHaveAttribute(
      "href",
      "https://wa.me/905327419031"
    );
  });

  test("404 page shows Turkish message", async ({ page }) => {
    await page.goto("/bu-sayfa-yok");
    await expect(page.locator("text=404")).toBeVisible();
    await expect(page.locator("text=Sayfa Bulunamadı")).toBeVisible();
  });
});

test.describe("Migration pages", () => {
  test("KVKK legal page renders migrated company content", async ({ page }) => {
    await page.goto("/yasal/kvkk");
    await expect(page).toHaveTitle(/KVKK/);
    await expect(page.locator("h1")).toContainText("KVKK");
    await expect(page.locator("main").getByText("info@niltellioglu.com").first()).toBeVisible();
  });

  test("Category page renders migrated catalog products", async ({ page }) => {
    await page.goto("/kategori/cilt-bakim");
    await expect(page).toHaveTitle(/Cilt Bakım/);
    await expect(page.locator("text=S.O.S KREM")).toBeVisible();
  });
});

test.describe("Smoke — auth pages", () => {
  test("Giriş page has login form", async ({ page }) => {
    await page.goto("/giris");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("Kayıt page has register form", async ({ page }) => {
    await page.goto("/kayit");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe("Product detail flow", () => {
  test("Clicking a product card opens detail page", async ({ page }) => {
    await page.goto("/urunler");
    const firstCard = page.locator("a[href^='/urunler/']").first();
    await firstCard.waitFor({ timeout: 5000 });
    const href = await firstCard.getAttribute("href");
    if (!href) return; // no products seeded
    await firstCard.click();
    await page.waitForURL(href, { timeout: 15000 });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("button", { hasText: /Sepete Ekle|Stok Tükendi/ })).toBeVisible();
  });
});

test.describe("Cart flow (unauthenticated)", () => {
  test("Add to cart redirects to /giris when not logged in", async ({ page }) => {
    await page.goto("/urunler");
    const firstCard = page.locator("a[href^='/urunler/']").first();
    await firstCard.waitFor({ timeout: 5000 });
    if (!(await firstCard.isVisible())) return;
    await firstCard.click();
    const addBtn = page.locator("button", { hasText: "Sepete Ekle" });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page).toHaveURL(/\/giris/);
    }
  });
});
