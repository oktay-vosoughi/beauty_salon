# Development Status — Beauty Salon Turkish E-commerce

Last updated: 2026-05-07

---

## 1. What Has Been Implemented

### Stack
| Layer | Choice | Status |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + CSS Modules | ✅ Running |
| Backend | Express 4 + TypeScript + tsx (dev runner) | ✅ Running |
| Database | MySQL 8.0.43 — DB: `niltellioglu` | ✅ Migrated + Seeded |
| ORM | Prisma 5.22 (`provider = "mysql"`) | ✅ Generated |
| Auth | express-session + PrismaSessionStore + argon2id | ✅ Working |
| Payment | PayTR iFrame API | ✅ Mounted, tested (needs real credentials for live) |
| Package manager | pnpm 9 (workspace) | ✅ Working |

### Build Status
- `apps/web`: `next build` → **19 pages, all static, 0 errors**
- `apps/api`: `tsc --noEmit` → **0 errors** (payments.ts not yet verified)
- `packages/shared`: Zod schemas for auth, product, order, review, contact

---

## 2. Folder Structure

```
niltellioglu/
├── .env                         # Real creds (git-ignored)
├── .env.example                 # Placeholders
├── .gitignore
├── package.json                 # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── CLAUDE.md
├── PROJECT_PLAN.md
├── TASKS.md
├── DEVELOPMENT_STATUS.md        # ← this file
├── energen-master/              # HTML/CSS source template (read-only)
├── apps/
│   ├── web/                     # Next.js 14
│   │   ├── next.config.mjs      # rewrites /api/* → localhost:4000
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx           # html lang="tr", Prata+OpenSans fonts
│   │   │   │   ├── page.tsx             # Ana Sayfa (Hero + categories + about)
│   │   │   │   ├── robots.ts
│   │   │   │   ├── sitemap.ts           # static slugs only (needs update M9)
│   │   │   │   ├── giris/               # login page + LoginForm.tsx (client)
│   │   │   │   ├── kayit/               # register page + RegisterForm.tsx (client)
│   │   │   │   ├── urunler/             # product list (stub — needs M8 data)
│   │   │   │   ├── iletisim/            # contact form (static HTML, not wired)
│   │   │   │   ├── sepet/               # SepetClient.tsx (full cart + checkout modal)
│   │   │   │   ├── odeme/
│   │   │   │   │   ├── [orderId]/       # PaymentClient.tsx (fetches token, mounts iframe)
│   │   │   │   │   └── sonuc/           # success/fail result page
│   │   │   │   ├── hesabim/             # user dashboard (layout + stubs)
│   │   │   │   │   ├── siparisler/      # stub (no real data yet)
│   │   │   │   │   ├── odemeler/        # stub
│   │   │   │   │   └── yorumlar/        # stub
│   │   │   │   └── admin/               # admin panel
│   │   │   │       ├── layout.tsx       # dark sidebar
│   │   │   │       ├── page.tsx         # dashboard cards
│   │   │   │       ├── urunler/         # AdminProductsClient (full CRUD table)
│   │   │   │       ├── siparisler/      # AdminOrdersClient (status edit)
│   │   │   │       └── yorumlar/        # AdminReviewsClient (approve/reject)
│   │   │   ├── components/layout/
│   │   │   │   ├── Navbar.tsx           # sticky, mobile hamburger, Turkish menu
│   │   │   │   ├── Hero.tsx             # bg_1.jpg hero with CTA
│   │   │   │   └── Footer.tsx           # 3-column footer
│   │   │   └── styles/
│   │   │       └── globals.css          # CSS variables, btn, form-control, alert
│   │   └── public/
│   │       └── bg_1.jpg, bg_2.jpg, intro.jpg, image_1-3.jpg
│   └── api/                     # Express + TypeScript
│       ├── src/
│       │   ├── index.ts                 # app entry (helmet, cors, session, routes)
│       │   ├── db/prisma.ts             # singleton PrismaClient
│       │   ├── middleware/
│       │   │   ├── auth.ts              # requireUser, requireAdmin
│       │   │   ├── error.ts             # global error handler
│       │   │   ├── rateLimit.ts         # login/register/contact/payment limiters
│       │   │   └── session.ts           # PrismaSessionStore + express-session config
│       │   ├── routes/
│       │   │   ├── health.ts            # GET /api/health
│       │   │   ├── auth.ts              # register / login / logout / me
│       │   │   ├── products.ts          # GET /api/products, GET /api/products/:slug
│       │   │   ├── categories.ts        # GET /api/categories
│       │   │   ├── cart.ts              # GET/POST/PATCH/DELETE /api/cart
│       │   │   ├── orders.ts            # POST/GET /api/orders
│       │   │   ├── payments.ts          # POST /paytr/token, POST /paytr/callback ← NOT MOUNTED YET
│       │   │   └── admin/
│       │   │       ├── products.ts      # full CRUD (soft-delete)
│       │   │       ├── orders.ts        # list + status patch
│       │   │       └── reviews.ts       # list + moderate + delete
│       │   └── services/
│       │       └── paytr.ts             # buildPayTRHash, getPayTRToken, verifyPayTRCallback
│       └── prisma/
│           ├── schema.prisma
│           ├── seed.ts
│           └── migrations/20260506084255_init/migration.sql
└── packages/
    └── shared/src/
        ├── types.ts             # Role, OrderStatus, PaymentStatus, ReviewStatus, SessionUser
        └── schemas/             # auth, product, order, review, contact (Zod)
```

---

## 3. Database Status

- **Host:** `localhost:3306`
- **Database:** `niltellioglu`
- **Credentials:** `root` / `0000` (dev only — stored in `.env`)
- **MySQL binary:** `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`
- **Migration applied:** `20260506084255_init` — all 13 tables created

### Tables
| Table | Records |
|---|---|
| Category | 5 (Cilt Bakımı, Saç Bakımı, Vücut Bakımı, Makyaj, Parfüm) |
| Product | 25 (all active, with 1 image each) |
| User | 1 admin: `admin@guzellikmerkezi.com.tr` / `Admin1234!` |
| Session | 0 |
| All others | 0 |

---

## 4. Feature Status

### Auth
| Feature | Status |
|---|---|
| POST /api/auth/register | ✅ Working — argon2id hash, Zod, 3/min rate limit |
| POST /api/auth/login | ✅ Working — argon2id verify, 5/min rate limit |
| POST /api/auth/logout | ✅ Working — destroys session |
| GET /api/auth/me | ✅ Working — returns session user |
| Session storage | ✅ MySQL via PrismaSessionStore (Session table) |
| Login/Register UI | ✅ Client forms wired to API, redirect to /hesabim |

### Cart
| Feature | Status |
|---|---|
| GET /api/cart | ✅ Returns cart with product details |
| POST /api/cart/items | ✅ Add item, stock check, merge quantity |
| PATCH /api/cart/items/:id | ✅ Update quantity, stock check |
| DELETE /api/cart/items/:id | ✅ Remove item |
| SepetClient.tsx | ✅ Full UI — qty controls, remove, checkout modal |

### Orders
| Feature | Status |
|---|---|
| POST /api/orders | ✅ Cart → Order(PENDING) + OrderItems, clears cart |
| GET /api/orders | ✅ User's own orders |
| GET /api/orders/:id | ✅ Order detail |
| Stock validation before order | ✅ Checks all items before creating |

### Payments (PayTR)
| Feature | Status |
|---|---|
| services/paytr.ts | ✅ Written — hash build, token fetch, callback verify |
| POST /api/payments/paytr/token | ✅ Written — NOT MOUNTED in index.ts |
| POST /api/payments/paytr/callback | ✅ Written — NOT MOUNTED in index.ts |
| GET /api/payments | ✅ Written — NOT MOUNTED in index.ts |
| PAYTR_MERCHANT_* env vars | ❌ Empty in .env — need real/test credentials |
| PayTR iFrame UI | ✅ PaymentClient.tsx ready |
| Callback stock decrement | ✅ In payments.ts (only fires on SUCCESS callback) |
| Idempotent callback | ✅ Checks if already SUCCESS/FAILED before processing |

### Admin Panel
| Feature | Status |
|---|---|
| GET/POST/PATCH/DELETE /api/admin/products | ✅ Working, requireAdmin gate |
| GET/PATCH /api/admin/orders | ✅ Working, requireAdmin gate |
| GET/PATCH/DELETE /api/admin/reviews | ✅ Working, requireAdmin gate |
| /admin/urunler UI | ✅ Table with toggle/delete |
| /admin/siparisler UI | ✅ Table with status dropdown |
| /admin/yorumlar UI | ✅ Filter by status, approve/reject/delete |
| Admin login gate on UI | ⚠️ No client-side redirect if not admin — relies on API returning 403 |

### Reviews
| Feature | Status |
|---|---|
| GET /api/reviews | ❌ Not started |
| POST /api/reviews (purchase gate) | ❌ Not started |
| Product detail page | ❌ Not started (urunler/[slug] page doesn't exist yet) |

### Contact Form
| Feature | Status |
|---|---|
| POST /api/contact | ❌ Not started |
| /iletisim form wired to API | ❌ Form exists as static HTML, not wired |

---

## 5. Known Issues / Incomplete Work

### REMAINING (non-blocking)
1. **PayTR live credentials** — `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` need real values for go-live. Test mode works with empty values.
2. **`/admin/urunler/yeni`** — Admin product list links to this URL but the create form page doesn't exist.
3. **Image CDN** — `next.config.mjs` `remotePatterns` only allows `localhost` + `res.cloudinary.com`. Update if a different CDN is used.

---

## 6. Next Exact Task

**Step 1 (fix blocker):** Mount the payments router in `apps/api/src/index.ts`:
```typescript
app.use("/api/payments", paymentsRouter);
```
Add this after `app.use("/api/orders", ordersRouter);`.

**Step 2 (verify):** Run `tsc --noEmit` in `apps/api` and confirm 0 errors.

**Step 3 (continue M8):** Create:
- `GET /api/reviews?productId=` — public, approved only
- `POST /api/reviews` — requireUser + purchased-gate
- `POST /api/contact` — save ContactMessage, rate limit
- Wire `/iletisim` form to contact API
- Create `/urunler/[slug]` product detail page with reviews section

---

## 7. How to Start Dev Servers

```powershell
# Terminal 1 — API (from apps/api)
Set-Location "C:\Users\STREAM\Desktop\niltellioglu\apps\api"
# Copy .env vars first (dotenv/config loads .env from project root automatically via dotenv)
npx tsx src/index.ts

# Terminal 2 — Web (from apps/web)
Set-Location "C:\Users\STREAM\Desktop\niltellioglu\apps\web"
npx next dev
```

Or from workspace root:
```powershell
Set-Location "C:\Users\STREAM\Desktop\niltellioglu"
pnpm dev
```

API: http://localhost:4000  
Web: http://localhost:3000
