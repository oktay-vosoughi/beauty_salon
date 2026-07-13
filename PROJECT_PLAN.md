# Project Implementation Plan — Beauty Salon Turkish E-commerce

## 2026-07-13 Campaign System Update

- Add admin-managed campaign records for "2 al 2 bedava".
- Calculate campaign discounts server-side for cart/order/payment correctness.
- Show the active campaign as a homepage banner when enabled.
- Preserve gift/discount snapshots on order items.

## 1. Stack Decision

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) + React + TypeScript |
| Backend | Express.js + TypeScript |
| Database | MySQL 8.0+ |
| ORM | Prisma (datasource provider: "mysql") |
| Auth | httpOnly cookie sessions + argon2id |
| Payment | PayTR iFrame API |
| Styling | energen-master template CSS → CSS Modules per component |
| Testing | Vitest (unit) + Supertest (API) + Playwright (E2E) |
| Process mgr | PM2 or systemd (production) |

Rejected: plain React SPA (no SSR/SEO), JWT in localStorage (revocation risk), Tailwind from scratch (wastes template), MongoDB (relational data fits MySQL).

---

## 2. Repository Inspection Strategy

1. `energen-master/index.html` — first ~80 lines (CSS/JS includes) only.
2. `treatments.html`, `contact.html`, `pricing.html` — skim for section blocks.
3. `css/style.css` — first ~150 lines (variables, palette).
4. `images/` — names only (reusable vs replace).
5. Never re-read vendor CSS/jQuery libs or full HTML files.

---

## 3. Architecture

- **Monorepo (pnpm workspaces):** `apps/web`, `apps/api`, `packages/shared`.
- Browser → Next.js SSR pages → `apps/web` proxies `/api/*` to `apps/api` (Express :4000).
- Express → MySQL via Prisma.
- PayTR → `POST /api/payments/paytr/callback` (server-to-server, hash-verified).
- Session cookie: httpOnly + Secure + SameSite=Lax; session stored in MySQL or Redis.

---

## 4. Folder Structure

```
niltellioglu/
├─ CLAUDE.md / PROJECT_PLAN.md / TASKS.md
├─ .env / .env.example / .gitignore
├─ package.json                 # pnpm workspace root
├─ pnpm-workspace.yaml
├─ energen-master/              # source template — read-only
├─ apps/
│  ├─ web/                      # Next.js
│  │  └─ src/app/
│  │     ├─ (public)/           # Ana Sayfa, urunler, iletisim, giris, kayit, sepet
│  │     ├─ hesabim/            # user dashboard
│  │     ├─ odeme/[orderId]/    # PayTR iframe host
│  │     ├─ odeme/sonuc/
│  │     ├─ admin/              # role-gated
│  │     ├─ sitemap.ts / robots.ts
│  │     └─ layout.tsx
│  └─ api/                      # Express
│     └─ src/
│        ├─ routes/             # auth, products, categories, cart, orders, payments, reviews, contact, admin
│        ├─ middleware/         # auth, role, rateLimit, error, validate
│        ├─ services/           # paytr.ts, mailer.ts
│        ├─ db/prisma.ts
│        └─ utils/
└─ packages/shared/src/         # shared TS types + Zod schemas
```

---

## 5. Frontend Pages

| Path | Render | Description |
|---|---|---|
| `/` | SSG/ISR | Ana Sayfa: hero, featured products, about teaser |
| `/urunler` | ISR | Product grid + category/price filter |
| `/urunler/[slug]` | ISR | Product detail, reviews, sepete ekle |
| `/iletisim` | SSG | Contact form + address |
| `/giris`, `/kayit` | CSR | Auth forms |
| `/sepet` | CSR | Cart, quantity edit, checkout |
| `/odeme/[orderId]` | CSR | PayTR iframe |
| `/odeme/sonuc` | CSR | Success/fail message |
| `/hesabim/*` | CSR + auth gate | Profile, siparişler, ödemeler, yorumlarım |
| `/admin/*` | CSR + admin gate | CRUD: products, orders, payments, reviews |

Template components to extract: Navbar, Hero, Footer, ServiceCard, PriceTag, ContactForm.

---

## 6. Backend API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | – | Register |
| POST | `/auth/login` | – | Login, set cookie |
| POST | `/auth/logout` | user | Logout |
| GET | `/auth/me` | user | Session check |
| GET | `/products` | – | List (filter, paginate) |
| GET | `/products/:slug` | – | Detail |
| GET | `/categories` | – | Category list |
| GET/POST/PATCH/DELETE | `/cart/items` | user | Cart CRUD |
| POST | `/orders` | user | Cart → Order (PENDING) |
| GET | `/orders` | user | Own orders |
| GET | `/orders/:id` | user | Order detail |
| POST | `/payments/paytr/token` | user | Generate iframe token |
| POST | `/payments/paytr/callback` | – (hash) | PayTR S2S callback |
| GET | `/payments` | user | Payment history |
| GET | `/reviews?productId=` | – | Approved reviews |
| POST | `/reviews` | user (purchased) | Submit review |
| POST | `/contact` | – | Contact form |
| `/admin/*` | admin | Full CRUD for products, orders, payments, reviews |

---

## 7. Database / Prisma Schema

Prisma datasource: `provider = "mysql"`. All text columns use `utf8mb4` charset/collation in MySQL config.

| Entity | Key fields | Notes |
|---|---|---|
| User | id, name, email VARCHAR(191) UNIQUE, passwordHash, role (USER/ADMIN), phone?, createdAt | – |
| Address | id, userId, fullName, phone, line1, district, city, postalCode | – |
| Category | id, name, slug VARCHAR(191) UNIQUE | – |
| Product | id, slug VARCHAR(191) UNIQUE, title, description, price Decimal @db.Decimal(10,2), stock, isActive, categoryId | – |
| ProductImage | id, productId, url, alt, sortOrder | – |
| Cart | id, userId UNIQUE | – |
| CartItem | id, cartId, productId, quantity | – |
| Order | id, userId, status (PENDING/PAID/CANCELLED/REFUNDED), totalAmount Decimal @db.Decimal(10,2), shippingAddressJson Json, createdAt | shippingAddressJson: Json type |
| OrderItem | id, orderId, productId, quantity, unitPrice Decimal @db.Decimal(10,2), titleSnapshot | – |
| Payment | id, orderId UNIQUE, provider, merchantOid VARCHAR(64) UNIQUE, providerToken, status (INIT/PENDING/SUCCESS/FAILED), amount Decimal @db.Decimal(10,2), callbackPayloadJson Json?, createdAt, updatedAt | callbackPayloadJson: Json? |
| Review | id, userId, productId, rating Int, comment, status (PENDING/APPROVED/REJECTED), createdAt | unique [userId, productId] |
| ContactMessage | id, name, email, phone?, message, createdAt | – |

MySQL-specific rules:
- Money: `Decimal @db.Decimal(10, 2)` — never `Float`.
- JSON: only `callbackPayloadJson` and `shippingAddressJson`.
- Indexed strings: max `VARCHAR(191)` to avoid key-length limits.
- `utf8mb4_0900_ai_ci` collation for Turkish character support.

---

## 8. Auth and Security Plan

- **Password hashing:** argon2id.
- **Sessions:** server-side session ID in httpOnly + Secure + SameSite=Lax cookie; session record in MySQL `Session` table or Redis.
- **CSRF:** double-submit cookie token for all state-changing requests.
- **Role middleware:** `requireUser`, `requireAdmin` on all `/admin/*` routes and mutations.
- **Validation:** Zod on every request body/query in Express; shared schemas in `packages/shared`.
- **Rate limiting (`express-rate-limit`):**
  - `/auth/login`: 5 req/min/IP, 20 req/hour/IP
  - `/auth/register`: 3 req/min/IP
  - `/contact`: 3 req/min/IP
  - `/payments/paytr/token`: 10 req/min/user
- **Helmet** for security headers. CORS locked to production domain.
- **Secrets:** `.env` only. Never in `NEXT_PUBLIC_*` or frontend bundles.

---

## 9. PayTR Integration Plan

1. User clicks "Ödemeye Geç" → `POST /api/orders` creates `Order(PENDING)` + `Payment(INIT, merchantOid=<uuid>)`.
2. `POST /api/payments/paytr/token` → server builds hash: HMAC-SHA256 of concatenated fields with `merchant_key` / `merchant_salt`, base64-encoded (exactly per PayTR docs).
3. POST to PayTR `/odeme/api/get-token` → receive `token`.
4. Frontend mounts iframe `https://www.paytr.com/odeme/guvenli/<token>`.
5. PayTR S2S → `POST /api/payments/paytr/callback`:
   - Verify hash. If invalid → log and return 400.
   - `status=success` → `Payment=SUCCESS`, `Order=PAID`, decrement stock, respond `OK`.
   - `status=fail` → `Payment=FAILED`, `Order=CANCELLED`, restore stock, respond `OK`.
   - Idempotent: if already SUCCESS, respond `OK` without re-processing.
6. Browser shows `/odeme/sonuc`; page re-fetches order status from server.

**Rules:** test_mode=1 first; live only after all callback paths pass. Source of truth = callback, not browser.

---

## 10. SEO Plan

- `generateMetadata()` per page: Turkish title/description, OG tags, `<html lang="tr">`.
- Product pages: JSON-LD `Product` + `Offer` (price in TRY, availability). `AggregateRating` once reviews exist.
- `app/sitemap.ts`: `/`, `/urunler`, `/iletisim`, all active product slugs.
- `app/robots.ts`: allow public, disallow `/admin`, `/hesabim`, `/odeme`.
- Canonical: lowercase, no trailing slash, `alternates.canonical` per page.
- Images: `next/image` with AVIF/WebP, Turkish `alt` text, LCP image priority.
- Performance targets: LCP < 2.5s, CLS < 0.1, INP < 200ms, initial JS < 200KB.

---

## 11. Testing Plan

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | PayTR hash builder, price calc, cart merge, slug helpers |
| API | Supertest + Vitest | All routes; auth; admin RBAC; rate limit |
| Payment callback | Vitest | Hash verify (valid/invalid/replay), success/fail/idempotency |
| DB | Prisma + Docker mysql:8.0 | Migrations apply, seed, FK integrity |
| E2E | Playwright | User flows below |

**Playwright flows:**
1. Product browse → sepete ekle → checkout (PayTR test mode) → success page.
2. Guest cart → kayıt → giriş → cart merges.
3. PayTR fail → order shows CANCELLED.
4. Post-purchase review submit → not visible before admin approval.
5. Admin login → product CRUD → inactive product hidden from listing.
6. `/admin` blocked for non-admin user → redirect.
7. Contact form submit → rate limit triggers.

---

## 12. Deployment Plan

- **Build:** `pnpm -w build` (Next.js standalone + Express tsc).
- **Process:** PM2 — `web` (Next :3000), `api` (Express :4000).
- **DB:** Managed MySQL or VPS-local MySQL; daily `mysqldump` backup cron.
- **Reverse proxy:** Nginx → `/` → :3000, `/api/*` → :4000. HTTP → HTTPS redirect.
- **HTTPS:** Let's Encrypt + certbot auto-renew.
- **PayTR callback URL:** `https://domain.com.tr/api/payments/paytr/callback` (whitelist in PayTR panel).
- **Production checklist:**
  - [ ] `PAYTR_TEST_MODE=0` only after live test
  - [ ] All secrets server-only
  - [ ] DB backups restore-tested
  - [ ] Rate limits + Helmet + CORS + CSRF active
  - [ ] sitemap.xml + robots.txt reachable
  - [ ] Turkish 404/500 pages
  - [ ] Admin password rotated
  - [ ] Lighthouse mobile ≥ 90

---

## 13. Implementation Milestones

| # | Milestone |
|---|---|
| 0 | Repo inspection + `PROJECT_PLAN.md` + `TASKS.md` |
| 1 | pnpm workspace + app scaffolds + tsconfig + lint + `.env` |
| 2 | Template conversion: Navbar, Hero, Footer, public pages, Turkish content |
| 3 | Prisma schema (MySQL) + migrations + seed 25 ürün + `/urunler` list/detail via API |
| 4 | Auth (register/login/logout/session) + `/hesabim` dashboard skeleton |
| 5 | Admin panel CRUD: products, images, stock/price, order status |
| 6 | Server cart + checkout → `Order(PENDING)` |
| 7 | PayTR iFrame token + callback + payment status sync (test mode) |
| 8 | Reviews (post-purchase gate + moderation) + `/iletisim` contact form |
| 9 | SEO: metadata, sitemap, robots, JSON-LD, image optimization |
| 10 | Tests (Vitest + Supertest + Playwright) + production hardening + deploy dry-run |

---

## 14. Risks to Avoid

| Category | Risk |
|---|---|
| PayTR | Trusting client payment success; missing hash verify; non-idempotent callback; reusing merchantOid; kuruş vs TRY confusion; stock decrement before SUCCESS |
| Security | Admin role in client code; secrets in NEXT_PUBLIC_*; missing CSRF; no rate limit; unvalidated image uploads |
| MySQL | Float for money (use Decimal); indexing long TEXT; skipping utf8mb4; VARCHAR(255) on indexed key exceeds InnoDB limit |
| SEO | Client-only product rendering; duplicate URLs; English keywords; blocking Googlebot in prod robots.txt |
| Token waste | Re-reading full template HTML; pasting full migrations; spawning agents for single-file edits |

---

## 15. Tool Usage

| Tool | When |
|---|---|
| Read / Edit / Write / Glob / Grep | Primary — all file work |
| Bash / PowerShell | Build, migrate, test commands |
| Git | Commit per milestone or vertical slice |
| Playwright MCP | Milestone 10 only — after UI exists |
| WebFetch | Only for official docs (PayTR, Prisma, Next.js) when stuck |
| Subagents | `Explore` for unknown codebase areas only; avoid for small tasks |
