import { test, expect } from "@playwright/test";

test.describe("Navbar account and basket state", () => {
  test("shows login link when there is no active session", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Oturum yok" }),
      })
    );
    await page.route("**/api/cart", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Giriş yapmanız gerekiyor" }),
      })
    );

    await page.goto("/");

    const nav = page.locator("nav");
    await expect(nav.getByRole("link", { name: "Giriş Yap" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Hesabım" })).toHaveCount(0);
  });

  test("shows account link and basket quantity for a signed-in user", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, name: "Test Kullanıcı", email: "test@example.com", role: "USER" },
        }),
      })
    );
    await page.route("**/api/cart", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          items: [
            { id: 10, quantity: 2 },
            { id: 11, quantity: 1 },
          ],
        }),
      })
    );

    await page.goto("/");

    const nav = page.locator("nav");
    await expect(nav.getByRole("link", { name: "Hesabım" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Giriş Yap" })).toHaveCount(0);
    await expect(nav.getByLabel("Sepette 3 ürün")).toBeVisible();
  });

  test("updates account link after login without a manual refresh", async ({ page }) => {
    let loggedIn = false;
    await page.route("**/api/auth/me", (route) => {
      if (!loggedIn) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Oturum yok" }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, name: "Test Kullanıcı", email: "test@example.com", role: "USER" },
        }),
      });
    });
    await page.route("**/api/auth/login", (route) => {
      loggedIn = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "set-cookie": "connect.sid=test-session; Path=/; HttpOnly; SameSite=Lax" },
        body: JSON.stringify({
          user: { id: 1, name: "Test Kullanıcı", email: "test@example.com", role: "USER" },
        }),
      });
    });
    await page.route("**/api/cart", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, items: [] }),
      })
    );

    await page.goto("/giris");
    await expect(page.locator("nav").getByRole("link", { name: "Giriş Yap" })).toBeVisible();

    await page.getByLabel("E-posta Adresi").fill("test@example.com");
    await page.getByLabel("Şifre").fill("password123");
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    const nav = page.locator("nav");
    await expect(page).toHaveURL(/\/hesabim$/);
    await expect(nav.getByRole("link", { name: "Hesabım" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Giriş Yap" })).toHaveCount(0);
  });

  test("logs out from account page and redirects protected account routes", async ({ page }) => {
    let loggedIn = true;
    await page.context().addCookies([
      {
        name: "connect.sid",
        value: "test-session",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.route("**/api/auth/me", (route) => {
      if (!loggedIn) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Oturum yok" }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, name: "Test Kullanıcı", email: "test@example.com", role: "USER" },
        }),
      });
    });
    await page.route("**/api/auth/logout", (route) => {
      loggedIn = false;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "set-cookie": "connect.sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax" },
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.route("**/api/cart", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, items: [{ id: 10, quantity: 2 }] }),
      })
    );

    await page.goto("/hesabim");
    await expect(page.locator("nav").getByRole("link", { name: "Hesabım" })).toBeVisible();

    await page.getByRole("button", { name: "Çıkış Yap" }).click();

    const nav = page.locator("nav");
    await expect(page).toHaveURL(/\/giris$/);
    await expect(nav.getByRole("link", { name: "Giriş Yap" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Hesabım" })).toHaveCount(0);

    await page.goto("/hesabim/siparisler");
    await expect(page).toHaveURL(/\/giris/);
  });

  test("updates the basket badge when products are added", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, name: "Test Kullanıcı", email: "test@example.com", role: "USER" },
        }),
      })
    );
    await page.route("**/api/cart", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, items: [] }),
      })
    );
    await page.route("**/api/cart/items", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, items: [{ id: 10, quantity: 1 }] }),
      })
    );

    await page.goto("/urunler/sos-krem");
    const nav = page.locator("nav");
    await expect(nav.getByLabel("Sepette 1 ürün")).toHaveCount(0);

    await page.getByRole("button", { name: "Sepete Ekle" }).click();

    await expect(nav.getByLabel("Sepette 1 ürün")).toBeVisible();
  });

  test("updates the basket badge after cart quantity changes and item removal", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "connect.sid",
        value: "test-session",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, name: "Test Kullanıcı", email: "test@example.com", role: "USER" },
        }),
      })
    );

    let cart = {
      id: 1,
      items: [
        {
          id: 10,
          quantity: 2,
          product: {
            id: 1,
            title: "Test Ürün A",
            slug: "test-urun-a",
            price: "100",
            stock: 10,
            images: [],
          },
        },
        {
          id: 11,
          quantity: 3,
          product: {
            id: 2,
            title: "Test Ürün B",
            slug: "test-urun-b",
            price: "200",
            stock: 10,
            images: [],
          },
        },
      ],
    };

    await page.route("**/api/cart", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cart),
      })
    );
    await page.route("**/api/cart/items/10", (route) => {
      if (route.request().method() === "PATCH") {
        cart = { ...cart, items: cart.items.map((item) => (item.id === 10 ? { ...item, quantity: 3 } : item)) };
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cart),
      });
    });
    await page.route("**/api/cart/items/11", (route) => {
      if (route.request().method() === "DELETE") {
        cart = { ...cart, items: cart.items.filter((item) => item.id !== 11) };
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cart),
      });
    });

    await page.goto("/sepet");
    const nav = page.locator("nav");
    await expect(nav.getByLabel("Sepette 5 ürün")).toBeVisible();

    await page.getByRole("button", { name: "+" }).first().click();
    await expect(nav.getByLabel("Sepette 6 ürün")).toBeVisible();

    await page.getByRole("button", { name: "✕" }).nth(1).click();
    await expect(nav.getByLabel("Sepette 3 ürün")).toBeVisible();
  });
});
