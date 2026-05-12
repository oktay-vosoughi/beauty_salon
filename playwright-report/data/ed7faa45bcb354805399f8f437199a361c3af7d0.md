# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke — auth pages >> Giriş page has login form
- Location: e2e\smoke.spec.ts:47:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/giris", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Smoke — public pages", () => {
  4  |   test("Ana Sayfa loads", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/Niltellioglu/);
  7  |     await expect(page.locator("h1")).toBeVisible();
  8  |   });
  9  | 
  10 |   test("Ürünler page lists products", async ({ page }) => {
  11 |     await page.goto("/urunler");
  12 |     await expect(page).toHaveTitle(/Ürünler/);
  13 |     // wait for product grid or empty state
  14 |     await expect(page.locator("main")).toBeVisible();
  15 |   });
  16 | 
  17 |   test("İletişim page has contact form", async ({ page }) => {
  18 |     await page.goto("/iletisim");
  19 |     await expect(page).toHaveTitle(/İletişim/);
  20 |     await expect(page.locator("form")).toBeVisible();
  21 |     await expect(page.locator("main").getByText("E-posta: info@niltellioglu.com")).toBeVisible();
  22 |   });
  23 | 
  24 |   test("404 page shows Turkish message", async ({ page }) => {
  25 |     await page.goto("/bu-sayfa-yok");
  26 |     await expect(page.locator("text=404")).toBeVisible();
  27 |     await expect(page.locator("text=Sayfa Bulunamadı")).toBeVisible();
  28 |   });
  29 | });
  30 | 
  31 | test.describe("Migration pages", () => {
  32 |   test("KVKK legal page renders migrated company content", async ({ page }) => {
  33 |     await page.goto("/yasal/kvkk");
  34 |     await expect(page).toHaveTitle(/KVKK/);
  35 |     await expect(page.locator("h1")).toContainText("KVKK");
  36 |     await expect(page.locator("main").getByText("info@niltellioglu.com").first()).toBeVisible();
  37 |   });
  38 | 
  39 |   test("Category page renders migrated catalog products", async ({ page }) => {
  40 |     await page.goto("/kategori/cilt-bakim");
  41 |     await expect(page).toHaveTitle(/Cilt Bakım/);
  42 |     await expect(page.locator("text=S.O.S KREM")).toBeVisible();
  43 |   });
  44 | });
  45 | 
  46 | test.describe("Smoke — auth pages", () => {
  47 |   test("Giriş page has login form", async ({ page }) => {
> 48 |     await page.goto("/giris");
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  49 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  50 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  51 |   });
  52 | 
  53 |   test("Kayıt page has register form", async ({ page }) => {
  54 |     await page.goto("/kayit");
  55 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  56 |   });
  57 | });
  58 | 
  59 | test.describe("Product detail flow", () => {
  60 |   test("Clicking a product card opens detail page", async ({ page }) => {
  61 |     await page.goto("/urunler");
  62 |     const firstCard = page.locator("a[href^='/urunler/']").first();
  63 |     await firstCard.waitFor({ timeout: 5000 });
  64 |     const href = await firstCard.getAttribute("href");
  65 |     if (!href) return; // no products seeded
  66 |     await firstCard.click();
  67 |     await page.waitForURL(href, { timeout: 15000 });
  68 |     await expect(page.locator("h1")).toBeVisible();
  69 |     await expect(page.locator("button", { hasText: /Sepete Ekle|Stok Tükendi/ })).toBeVisible();
  70 |   });
  71 | });
  72 | 
  73 | test.describe("Cart flow (unauthenticated)", () => {
  74 |   test("Add to cart redirects to /giris when not logged in", async ({ page }) => {
  75 |     await page.goto("/urunler");
  76 |     const firstCard = page.locator("a[href^='/urunler/']").first();
  77 |     await firstCard.waitFor({ timeout: 5000 });
  78 |     if (!(await firstCard.isVisible())) return;
  79 |     await firstCard.click();
  80 |     const addBtn = page.locator("button", { hasText: "Sepete Ekle" });
  81 |     if (await addBtn.isVisible()) {
  82 |       await addBtn.click();
  83 |       await expect(page).toHaveURL(/\/giris/);
  84 |     }
  85 |   });
  86 | });
  87 | 
```