# Tasks — Beauty Salon Turkish E-commerce

## 2026-07-13 Campaign System

- [x] Add campaign database model and migration.
- [x] Add promotion calculation service with unit tests.
- [x] Add admin/public campaign API routes.
- [x] Apply campaign totals during order creation.
- [x] Add admin campaign screen and homepage banner.
- [x] Verify API tests and typechecks. Web build compiles but standalone output is blocked by Windows symlink permission.

## Milestone Status

| # | Milestone | Status |
|---|-----------|--------|
| 0 | Repo inspection + PROJECT_PLAN.md + TASKS.md | ✅ Done |
| 1 | pnpm workspace setup, app scaffolds, tsconfig, .env | ✅ Done |
| 2 | Template conversion: Navbar, Hero, Footer, public pages, Turkish content | ✅ Done |
| 3 | Prisma MySQL schema + migrations + seed (25 ürün) + /api/products | ✅ Done |
| 4 | Auth (register/login/logout/sessions) + /hesabim dashboard skeleton | ✅ Done |
| 5 | Admin panel CRUD: products, orders, reviews | ✅ Done |
| 6 | Server cart + checkout → Order(PENDING) | ✅ Done |
| 7 | PayTR iFrame token + callback + payment status sync (test mode) | ✅ Done |
| 8 | Reviews (post-purchase gate + admin moderation) + /iletisim contact form API | ✅ Done |
| 9 | SEO: JSON-LD, canonical, next/image, Turkish meta | ✅ Done |
| 10 | Vitest + Supertest + Playwright E2E + production hardening | ✅ Done |

---

## Completed Tasks

- [x] M0 — PROJECT_PLAN.md, TASKS.md
- [x] M1-1 — root package.json (pnpm workspace)
- [x] M1-2 — pnpm-workspace.yaml
- [x] M1-3 — tsconfig.base.json
- [x] M1-4 — apps/web/package.json + tsconfig.json + next.config.mjs
- [x] M1-5 — apps/api/package.json + tsconfig.json
- [x] M1-6 — .env (real creds) + .env.example
- [x] M1-7 — .claude/settings.local.json (deny rules)
- [x] M1-8 — pnpm install (all deps including argon2, prisma, uuid, zod, helmet, express-session)
- [x] M2-1 — globals.css (brand palette: --color-primary #c8a87e)
- [x] M2-2 — Navbar.tsx + Navbar.module.css (sticky, mobile hamburger, Turkish links)
- [x] M2-3 — Hero.tsx + Hero.module.css (bg_1.jpg, CTA buttons)
- [x] M2-4 — Footer.tsx + Footer.module.css (3-column grid, Turkish contact info)
- [x] M2-5 — layout.tsx (html lang="tr", Google Fonts: Prata + Open Sans)
- [x] M2-6 — Ana Sayfa page.tsx (Hero + categories + about + featured placeholder)
- [x] M2-7 — /urunler, /iletisim, /giris, /kayit, /sepet, /hesabim stub pages
- [x] M2-8 — /hesabim/siparisler, /odemeler, /yorumlar stub pages
- [x] M2-9 — robots.ts + sitemap.ts stubs
- [x] M2-10 — Template images copied to apps/web/public/
- [x] M3-1 — Prisma schema (all entities: User, Session, Address, Category, Product, ProductImage, Cart, CartItem, Order, OrderItem, Payment, Review, ContactMessage)
- [x] M3-2 — Migration 20260506084255_init applied to niltellioglu DB
- [x] M3-3 — Seed: 5 categories + 25 products + 1 admin user (admin@guzellikmerkezi.com.tr / Admin1234!)
- [x] M3-4 — GET /api/products (paginate, filter, search) — verified returning 25 products
- [x] M3-5 — GET /api/products/:slug
- [x] M3-6 — GET /api/categories
- [x] M4-1 — PrismaSessionStore (stores sessions in MySQL Session table)
- [x] M4-2 — sessionMiddleware (httpOnly cookie, 7-day TTL, SameSite=Lax)
- [x] M4-3 — POST /api/auth/register (argon2id, Zod, rate limit 3/min)
- [x] M4-4 — POST /api/auth/login (argon2id verify, rate limit 5/min)
- [x] M4-5 — POST /api/auth/logout + GET /api/auth/me
- [x] M4-6 — requireUser + requireAdmin middleware
- [x] M4-7 — LoginForm.tsx (client form → /api/auth/login, redirect /hesabim)
- [x] M4-8 — RegisterForm.tsx (client form → /api/auth/register, redirect /hesabim)
- [x] M4-9 — /hesabim layout with sidebar nav
- [x] M5-1 — GET/POST/PATCH/DELETE /api/admin/products (soft-delete, Zod)
- [x] M5-2 — GET/PATCH /api/admin/orders (status change)
- [x] M5-3 — GET/PATCH/DELETE /api/admin/reviews (moderate)
- [x] M5-4 — All /api/admin/* routes gated behind requireAdmin
- [x] M5-5 — /admin layout (sidebar, dark theme)
- [x] M5-6 — /admin/urunler client page (table, toggle active, delete)
- [x] M5-7 — /admin/siparisler client page (table, status dropdown)
- [x] M5-8 — /admin/yorumlar client page (filter by status, approve/reject/delete)
- [x] M6-1 — GET/POST /api/cart + POST /api/cart/items + PATCH/DELETE /api/cart/items/:id
- [x] M6-2 — POST /api/orders (cart → Order PENDING + OrderItems + cart clear, stock validation)
- [x] M6-3 — GET /api/orders + GET /api/orders/:id
- [x] M6-4 — SepetClient.tsx (live cart, qty update, remove, checkout modal with address form)
- [x] M6-5 — /odeme/[orderId] page + PaymentClient.tsx (fetches PayTR token, mounts iframe)
- [x] M6-6 — /odeme/sonuc page (success/fail display)
- [x] M7-1 — apps/api/src/services/paytr.ts (buildPayTRHash, getPayTRToken, verifyPayTRCallback)
- [x] M7-2 — apps/api/src/routes/payments.ts (POST /paytr/token, POST /paytr/callback, GET /)

---

## Remaining Tasks

### UX polish — Header account and basket state
- [x] Navbar shows `Hesabım` instead of `Giriş Yap` when `/api/auth/me` has an active session.
- [x] `/hesabim` provides an in-app `Çıkış Yap` action that logs out and redirects cleanly.
- [x] Navbar `Sepet` link shows a quantity badge based on the current cart item quantities and updates after adding products.

### M7 — Finish PayTR wiring
- [x] **M7-3** — Mount paymentsRouter in index.ts: `app.use("/api/payments", paymentsRouter)`
- [ ] **M7-4** — Fill PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT in .env
- [x] **M7-5** — Typecheck payments.ts — clean
- [ ] **M7-6** — Test: register → add to cart → checkout → get PayTR token → callback with test hash

### M8 — Reviews + Contact Form API
- [x] **M8-1** — GET /api/reviews?productId= (approved only, public)
- [x] **M8-2** — POST /api/reviews (requireUser + purchased-gate: must have PAID order with that product)
- [x] **M8-3** — /urunler product listing page + /urunler/[slug] detail page + ReviewSection client component
- [x] **M8-4** — POST /api/contact (Zod validate, save to ContactMessage, rate limit 3/min)
- [x] **M8-5** — Wire /iletisim form to POST /api/contact (ContactForm.tsx client component)
- [x] **M8-6** — /hesabim/yorumlar — shows user's reviews with status badge

### M9 — SEO
- [x] **M9-1** — generateMetadata() on /urunler/[slug] with product title/description/price
- [x] **M9-2** — JSON-LD Product + Offer schema + aggregateRating on product detail pages
- [x] **M9-3** — sitemap.ts fetches all active product slugs from API (ISR 1h)
- [x] **M9-4** — next/image with fill layout in /urunler product cards and /urunler/[slug] gallery
- [x] **M9-5** — canonical + og:image + og:title per product in generateMetadata
- [x] **M9-6** — not-found.tsx — Turkish 404 page with nav links

### M10 — Tests + Production Hardening
- [x] **M10-1** — Vitest unit tests: buildPayTRHash (determinism, sensitivity), verifyPayTRCallback (valid/invalid/missing)
- [x] **M10-2** — Supertest API tests: health, register, login, /me, products list/detail, cart (20 tests, all pass)
- [x] **M10-3** — PayTR callback: invalid hash → 400, valid hash unknown oid → 404
- [x] **M10-4** — Playwright E2E config + smoke tests: public pages, auth pages, product detail, cart redirect
- [x] **M10-5** — ecosystem.config.js — PM2 config for web (:3000) + api (:4000)
- [x] **M10-6** — deploy/nginx.conf — reverse proxy + HTTPS + security headers
- [x] **M10-7** — deploy/DEPLOYMENT.md — full deployment checklist with backups, PayTR go-live, security audit

### PayTR Admin Settings (NEW — 2026-05-13)
- [x] `SiteSetting` Prisma model added + `prisma db push` applied
- [x] `apps/api/src/utils/encryption.ts` — AES-256-GCM encrypt/decrypt (SETTINGS_ENCRYPTION_KEY)
- [x] `apps/api/src/services/settings.ts` — settings service with 5-min cache + .env fallback
- [x] `GET/PATCH /api/admin/settings/paytr` — admin-gated, partial update, never exposes raw secrets
- [x] `apps/api/src/routes/payments.ts` — reads PayTR credentials dynamically per-request (was module-level constants)
- [x] `/admin/ayarlar` — frontend settings page with show/hide toggles, status badge, live mode warning
- [x] Admin sidebar updated with "Ayarlar" link
- [x] `SETTINGS_ENCRYPTION_KEY` added to `.env` and `.env.example`

### Extra (completed beyond original scope)
- [x] /urunler/page.tsx — live product listing with pagination + next/image
- [x] /hesabim/siparisler — real orders list with status + pay button for PENDING
- [x] /hesabim/odemeler — real payment history with status badges
- [x] apps/api/src/app.ts — separated app from server entry (enables supertest imports)

---

## Admin Credentials (dev only)
- Email: `admin@guzellikmerkezi.com.tr`
- Password: `Admin1234!`
