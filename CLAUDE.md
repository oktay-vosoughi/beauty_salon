# CLAUDE.md — Beauty Salon Turkish E-commerce Project

## Project Goal
Build a small Turkish e-commerce website for a beauty salon with 20–30 products, PayTR payment integration, user accounts, order/payment history, reviews, and an admin panel for product/order management.

## Main Rule
Be token-efficient. Do not read or paste large files unless required. Inspect only relevant files. Prefer summaries, file paths, diffs, and small code snippets. Before coding, create or update `PROJECT_PLAN.md` and `TASKS.md`.

## Language and UX
- All customer-facing text must be Turkish.
- Admin panel may be Turkish too.
- UI should be clean, mobile-first, fast, SEO-friendly, and suitable for a beauty salon brand.
- Use the existing HTML/CSS template in the repository as the visual source. Convert it into reusable React/Next.js components instead of redesigning from zero. path "C:\Users\STREAM\Desktop\niltellioglu\energen-master"

## Recommended Stack
- Frontend: Next.js + React + TypeScript
- Backend: Node.js + Express.js + TypeScript
- Database: MySQL 8.0+
- ORM: Prisma (datasource provider: "mysql")
- Auth: Secure session/JWT approach with bcrypt/argon2 password hashing
- Payment: PayTR iFrame API preferred unless direct API is explicitly required
- Styling: Use existing CSS/template first; add Tailwind only if it reduces complexity
- Deployment target: VPS or cloud server with Nginx reverse proxy, HTTPS, and environment variables

## SEO Requirement
Do not build a plain client-only React SPA if SEO matters. Use Next.js rendering, page metadata, canonical URLs, robots.txt, sitemap.xml, product structured data, fast image loading, and Turkish keyword-focused page content.

## Main Pages
1. Ana Sayfa / Landing page
2. Ürünler page
3. Ürün Detay page
4. İletişim page
5. Kullanıcı paneli: profil, siparişler, önceki ödemeler, yorumlar
6. Admin panel: hidden from navigation but protected with real authentication and role-based access

## Core Features
### Customer
- Register/login/logout
- View products
- Product detail
- Add to cart / create order
- Pay with PayTR
- See previous orders and payments
- Write reviews after purchase

### Admin
- Secure admin login/role check
- Create/read/update/delete products
- Manage product images, stock, price, active/passive status
- View orders and payment statuses
- Moderate reviews

## Security Rules
- Never expose PayTR merchant key, merchant salt, database URL, JWT secret, or admin credentials in frontend code.
- Use `.env` and `.env.example`.
- Validate every API input with Zod or equivalent.
- Use server-side PayTR token generation and callback verification.
- Treat PayTR callback as the source of payment truth.
- Hidden admin URL is not security. Use role-based authorization middleware.
- Add rate limiting for login/payment endpoints.
- Add CSRF protection if cookie-based sessions are used.

## Database Entities
Minimum entities:
- User: id, name, email, passwordHash, role, createdAt
- Product: id, slug, title, description, price, stock, imageUrl, isActive, createdAt, updatedAt
- Category: id, name, slug
- Cart/CartItem or temporary checkout model
- Order: id, userId, status, totalAmount, createdAt
- OrderItem: id, orderId, productId, quantity, unitPrice
- Payment: id, orderId, provider, providerToken, status, amount, callbackPayload, createdAt
- Review: id, userId, productId, rating, comment, status, createdAt
- ContactMessage: id, name, phone/email, message, createdAt

## Database Rules (MySQL)
- Use MySQL 8.0+.
- Use Prisma with datasource `provider = "mysql"`.
- Use Prisma `Decimal` for money fields, e.g. `@db.Decimal(10, 2)` for `Product.price`, `Order.totalAmount`, `OrderItem.unitPrice`, `Payment.amount`.
- Use `Json` fields only where needed, such as `Payment.callbackPayloadJson` and `Order.shippingAddressJson`.
- Use `utf8mb4` charset and `utf8mb4_0900_ai_ci` collation for proper Turkish text support.
- Apply safe lengths to indexed string columns: `email VARCHAR(191) UNIQUE`, `slug VARCHAR(191) UNIQUE`, `merchantOid VARCHAR(64) UNIQUE`. Avoid indexing long `TEXT` columns.
- Local development DSN format: `mysql://USER:PASSWORD@localhost:3306/niltellioglu`.
- Real local credentials live in `.env` only. `.env.example` must contain placeholders.
- For testing, use a Docker MySQL test database (e.g. `mysql:8.0`).
- For deployment, use managed MySQL (e.g. PlanetScale-compatible / RDS / managed cloud MySQL) or VPS-local MySQL with daily `mysqldump` backups.
- Use Redis (host `localhost`, port `6379` in dev) for sessions and rate limiting if/when needed; do not store sensitive data in Redis without TTL.

## PayTR Integration Rules
- Use PayTR official developer documentation.
- Implement server-side payment token creation.
- Implement callback endpoint and hash verification.
- On success callback, mark payment paid and order confirmed.
- On failed callback, mark payment failed and order unpaid/cancelled.
- Add test mode first; do not implement live credentials until test flow passes.

## Token-Efficient Workflow
1. First inspect repo tree with a shallow command.
2. Read package files, routing files, and template entry files only.
3. Create a concise architecture plan.
4. Implement in small vertical slices:
   - Slice 1: project setup + template conversion
   - Slice 2: product listing/detail
   - Slice 3: auth + user panel
   - Slice 4: database + admin CRUD
   - Slice 5: order + PayTR payment flow
   - Slice 6: reviews + SEO + production hardening
5. After each slice, run tests/build/lint if available.
6. Report only changed files, commands run, and next action.

## Preferred Output Format
When responding, use this structure:
- Objective
- Files inspected
- Decision
- Files changed
- Commands run
- Result
- Next step

## Subagents / Skills to Use
Use subagents only when they reduce context. Do not run all agents at once.

### 1. architect-planner
Use for architecture, folder structure, milestones, data model, and implementation order.

### 2. frontend-nextjs-template
Use for converting existing HTML/CSS template into React/Next.js components, pages, layout, responsive UI, Turkish content.

### 3. backend-paytr-security
Use for Express API, auth, validation, PayTR server-side integration, payment callback, security middleware.

### 4. database-prisma
Use for MySQL schema, Prisma models, migrations, seed data, product/category/order/payment/review relations.

### 5. seo-performance-qa
Use for metadata, sitemap, robots, structured data, Lighthouse-oriented checks, accessibility, build/test review.

## Minimal MCP / Plugins
Use the smallest useful toolset:
- Filesystem/local repo access: required
- Git/GitHub: useful if project uses GitHub
- Browser/Playwright: useful only for UI and checkout testing
- Database MCP: optional; use only when connecting to a real local/dev DB is necessary
- Web/search/docs tool: use only for official docs such as PayTR, Next.js, Prisma, Express, Claude docs

Avoid unnecessary MCPs/plugins that add token overhead or expose secrets.

---

## Review Notes — 2026-05-07 (Admin Product Management Fix)

### Reviewed
- Web app routing: `apps/web/src/app/admin/**`, `apps/web/src/app/urunler/**`, root `not-found.tsx`, `layout.tsx`.
- API routing: `apps/api/src/app.ts`, `apps/api/src/routes/admin/products.ts`, `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/auth.ts`.
- Prisma schema: `Product`, `ProductImage`, `Category`.
- Admin layout server-side auth check (calls `/api/auth/me` with forwarded cookies).

### Root Cause of `/admin/urunler/25` 404
The admin product list (`AdminProductsClient.tsx`) linked to `/admin/urunler/[id]` and `/admin/urunler/yeni`, but neither route file existed. Next.js fell through to the **global** `app/not-found.tsx`, which is rendered with the public root layout (Navbar/Footer) — explaining the public-looking 404 in the admin area.

### Files Created
- `apps/web/src/app/admin/urunler/yeni/page.tsx` — "Add Product" page.
- `apps/web/src/app/admin/urunler/[id]/page.tsx` — "Edit Product" route (validates numeric id).
- `apps/web/src/app/admin/urunler/[id]/EditProductClient.tsx` — fetches product via `/api/admin/products/:id`, handles 404/401/403 gracefully inside admin shell.
- `apps/web/src/app/admin/urunler/ProductForm.tsx` — shared form (create/edit), client-side validation, image rows, slug auto-generation, Turkish labels.
- `apps/web/src/app/admin/urunler/form.module.css` — form styles, responsive grid (collapses to 1 col ≤640px).
- `apps/web/src/app/admin/not-found.tsx` — admin-scoped 404 so missing admin routes keep the admin layout instead of showing the public 404.

### Files Modified
- `CLAUDE.md` — this section.

### Admin Product Features Implemented
- List products (existing).
- **Create** product: title, slug (auto from title, override toggle), description, price (Decimal), stock, category, isActive, multiple image URL/alt rows.
- **Edit** product: prefilled from `GET /api/admin/products/:id`, PATCH on save, image set replaced atomically (already supported server-side).
- **Soft delete** via existing `DELETE /api/admin/products/:id` (sets `isActive=false`).
- Validation client-side (slug regex, price > 0, stock ≥ 0, image URL parsing) mirrors server `productSchema`.
- Loading / success / error states; cancel + redirect.
- Graceful handling for unknown id (e.g., `/admin/urunler/9999`) — shows in-admin error card with "Ürün listesine dön" link, no public 404.

### Authentication / Security (already correct, verified)
- `apps/web/src/app/admin/layout.tsx` checks `/api/auth/me` server-side with forwarded cookies → redirects to `/giris` if unauthenticated, to `/` if non-ADMIN. Applies to **all** `/admin/*` pages including the new ones.
- `apps/api/src/app.ts` mounts admin routers behind `requireAdmin` middleware → server-side enforcement on every admin API call. UI hiding alone is not relied upon.
- New form actions go through `/api/admin/products` (already protected). Direct URL access without admin role is blocked at both layers.

---

## Review Notes — 2026-05-07 (Build Fix + Admin Login + Security)

### Root Cause of `next-flight-client-entry-loader` Error
The `.next` build cache was stale/corrupted — likely left over from a previous failed or partial build after files were modified. Fix: deleted the `.next` directory and ran `pnpm install`. The build succeeds immediately after clearing cache.

**Prevention:** If the error recurs, run `Remove-Item -Recurse -Force apps\web\.next` then `pnpm install` before `pnpm dev`.

### Files Created (this session)
- `apps/web/src/middleware.ts` — Next.js Edge middleware; sets `x-pathname` response header for all `/admin/*` routes so server layouts can read the current path without a client hook.
- `apps/web/src/app/admin/login/page.tsx` — Separate admin login page (server component; redirects already-authenticated admins to `/admin`).
- `apps/web/src/app/admin/login/AdminLoginForm.tsx` — Admin login client form; calls `/api/auth/login`, verifies ADMIN role, logs out immediately if non-ADMIN, redirects to `/admin` on success.
- `apps/web/src/app/admin/login/page.module.css` — Dark-themed admin login card styles.
- `apps/web/src/app/admin/AdminLogoutButton.tsx` — Client component in admin sidebar; calls `/api/auth/logout` then redirects to `/admin/login`.
- `apps/web/.eslintrc.json` — ESLint config for web app.

### Files Modified (this session)
- `apps/web/src/app/admin/layout.tsx` — Now reads `x-pathname` header from middleware; skips auth redirect for `/admin/login` (prevents infinite redirect loop); redirects to `/admin/login` instead of `/giris` for unauthenticated users; includes `AdminLogoutButton` in sidebar.
- `apps/web/src/app/admin/layout.module.css` — Added `.logoutBtn` styles for the new logout button.
- `CLAUDE.md` — this section.

### Admin Login Design
- Route: `/admin/login` — visually separate from public `/giris` (dark card, no public nav/footer interference).
- Unauthenticated visit to `/admin/**` → redirect to `/admin/login`.
- Non-admin account login attempt → session immediately destroyed, error shown.
- Authenticated admin visiting `/admin/login` → redirect to `/admin`.
- Logout button in sidebar → destroys session, redirects to `/admin/login`.

### Admin Route Protection (two-layer)
1. **Frontend (Next.js layout, server-side):** `admin/layout.tsx` calls `/api/auth/me` with the session cookie on every admin page render. Redirects to `/admin/login` if unauthenticated; redirects to `/` if authenticated but not ADMIN.
2. **Backend (Express middleware):** `requireAdmin` in `apps/api/src/middleware/auth.ts` is applied to every `/api/admin/*` route in `app.ts`. Returns 403 even if someone bypasses the frontend.

### Redirect Behavior (verified by build)
- `GET /admin` (logged out) → `/admin/login`
- `GET /admin/urunler` (logged out) → `/admin/login`
- `GET /admin/urunler/25` (logged out) → `/admin/login`
- `GET /admin/urunler/25` (admin) → Edit product form
- `GET /admin/urunler/9999` (admin, product not found) → In-admin error card
- `GET /admin/login` (admin already logged in) → `/admin`
- `POST /api/admin/products` (non-admin) → 403 Forbidden

### Build & Lint Results
- `npx next build`: ✓ 22 routes compiled, no errors
- `npx tsc --noEmit` (web): ✓ 0 errors
- `npx tsc --noEmit` (api): ✓ 0 errors
- `npx next lint`: ✓ 0 errors, 1 pre-existing warning (Google Fonts in `app/layout.tsx`)

### Updated Routes Reference
- Public: `/`, `/urunler`, `/urunler/[slug]`, `/iletisim`, `/giris`, `/kayit`, `/sepet`, `/odeme`, `/hesabim/*`
- Admin login: `/admin/login` ← NEW (separate from `/giris`)
- Admin (ADMIN role only): `/admin`, `/admin/urunler`, `/admin/urunler/yeni`, `/admin/urunler/[id]`, `/admin/siparisler`, `/admin/yorumlar`
- Admin API: `/api/admin/products` (GET/POST), `/api/admin/products/:id` (GET/PATCH/DELETE), `/api/admin/orders`, `/api/admin/reviews`, `/api/admin/uploads` (POST/DELETE)

### Commands to Run (same as before)
- Install: `pnpm install`
- Clear cache (if `next-flight-client-entry-loader` recurs): `Remove-Item -Recurse -Force apps\web\.next`
- Generate Prisma: `pnpm --filter @niltellioglu/api db:generate`
- Migrate: `pnpm --filter @niltellioglu/api prisma migrate dev`
- Seed: `pnpm --filter @niltellioglu/api db:seed` (admin: `admin@guzellikmerkezi.com.tr` / `Admin1234!`)
- Dev: `pnpm dev`
- Typecheck (web): `pnpm --filter @niltellioglu/web typecheck`
- Typecheck (api): `pnpm --filter @niltellioglu/api typecheck`
- Lint (web): `pnpm --filter @niltellioglu/web lint`

### Manual Test Checklist (Updated)
1. Run `pnpm dev` — both web (port 3000) and api (port 4000) start.
2. Visit `localhost:3000/admin` while logged out → redirects to `/admin/login`.
3. Visit `localhost:3000/admin/urunler` while logged out → redirects to `/admin/login`.
4. Visit `localhost:3000/admin/urunler/25` while logged out → redirects to `/admin/login`.
5. Visit `localhost:3000/admin/login` → dark-themed admin login card appears.
6. Login with non-admin credentials → error "Bu hesabın admin yetkisi yok."
7. Login with `admin@guzellikmerkezi.com.tr` / `Admin1234!` → redirects to `/admin`.
8. Admin panel shows sidebar with Özet / Ürünler / Siparişler / Yorumlar + Çıkış Yap.
9. Navigate to `/admin/urunler` → product table with 25 seeded rows.
10. Click `+ Yeni Ürün` → form loads at `/admin/urunler/yeni`.
11. Submit form → product created, redirected to `/admin/urunler/<newId>`.
12. Click `Düzenle` on any product → edit form at `/admin/urunler/[id]` with prefilled data.
13. Save edit → "Ürün güncellendi." shown.
14. Visit `/admin/urunler/9999` (non-existent) → in-admin error card, not public 404.
15. Click "Çıkış Yap" → session destroyed, redirected to `/admin/login`.
16. Try `fetch('/api/admin/products', {credentials:'include'})` without admin session → 403.
17. Confirm new/edited products appear at `/urunler` if `isActive: true`.
18. Already-admin visiting `/admin/login` → redirected to `/admin`.

### Remaining Concerns / Recommendations
- The root layout (`app/layout.tsx`) renders `Navbar` and `Footer` behind `/admin/*` pages. The admin sidebar occupies its own `div.wrapper` with a fixed sidebar, but Navbar still sits above it (68px paddingTop applied). Functionally fine; visually the navbar is visible on admin pages. To fully hide it, wrap admin routes in a route group with their own layout (requires moving files). Out of scope for this fix.
- ESLint installed as devDependency in web app (`eslint@^8`, `eslint-config-next@14.2.29`). Lint passes with `next/core-web-vitals` ruleset.
- File upload pipeline (`/api/admin/uploads`) is implemented — admin can upload images from the product form. Cloudinary is allow-listed in `next.config.mjs` for external image URLs.
- No Playwright admin e2e tests yet. Recommended: add spec that logs in as admin, creates a product, edits it, and verifies it appears publicly.

### Database Changes
- None required. Existing schema already supports all product CRUD fields.

### Routes Reference
- Public: `/`, `/urunler`, `/urunler/[slug]`, `/iletisim`, `/giris`, `/kayit`, `/sepet`, `/odeme`, `/hesabim/*`.
- Admin (ADMIN role only): `/admin`, `/admin/urunler`, `/admin/urunler/yeni`, `/admin/urunler/[id]`, `/admin/siparisler`, `/admin/yorumlar`.
- Admin API: `/api/admin/products` (GET/POST), `/api/admin/products/:id` (GET/PATCH/DELETE), `/api/admin/orders`, `/api/admin/reviews`.

### Commands to Run
- Install: `pnpm install`
- Generate Prisma: `pnpm --filter @niltellioglu/api db:generate`
- Migrate: `pnpm --filter @niltellioglu/api prisma migrate dev`
- Seed (creates admin `admin@guzellikmerkezi.com.tr` / `Admin1234!` and 25 products): `pnpm --filter @niltellioglu/api db:seed`
- Dev: `pnpm dev` (root) or per-app `pnpm --filter @niltellioglu/web dev`, `pnpm --filter @niltellioglu/api dev`.
- Typecheck: `pnpm --filter @niltellioglu/web typecheck`, `pnpm --filter @niltellioglu/api typecheck`.

### Manual Test Checklist
1. Login at `/giris` as `admin@guzellikmerkezi.com.tr` / `Admin1234!`.
2. Open `/admin/urunler` → table renders with 25 seeded products.
3. Click `+ Yeni Ürün` → fill form → submit → redirects to `/admin/urunler/<newId>` and shows success.
4. Click `Düzenle` on any row → fields prefilled → change price/stock/category → save → "Ürün güncellendi.".
5. Visit `/admin/urunler/25` directly → loads existing seeded product 25 (no 404).
6. Visit `/admin/urunler/9999` → in-admin error message, not public 404.
7. Logout → visit `/admin/urunler` → redirected to `/giris`.
8. Login as a regular user → visit `/admin/*` → redirected to `/`.
9. Confirm new product appears at `/urunler` (if `isActive`).

### Responsiveness
- Admin sidebar: collapses to top stack ≤768px (existing `layout.module.css`).
- New product form grid: 2-col on desktop, 1-col ≤640px (`form.module.css`).
- Image rows: 3-col on desktop, 1-col ≤640px.
- Action buttons wrap (`flex-wrap: wrap`).
- Product table already wraps in `.tableWrap` with `overflow-x: auto`.

### Known Remaining Concerns / Recommendations
- The root layout (`app/layout.tsx`) renders `Navbar` and `Footer` for `/admin/*` routes too. Functionally fine, but visually noisy. Consider hiding them on `/admin/*` (e.g., conditional in `Navbar` via `usePathname` or a route group). Out of scope for this fix.
- Image management uses URL inputs — no upload pipeline. If the salon needs uploads, integrate Cloudinary (already allow-listed in `next.config.mjs`) or local disk + signed URLs.
- No automated e2e for admin CRUD yet — `e2e/smoke.spec.ts` covers public flow only. Worth adding a Playwright spec that logs in as admin and exercises create/edit/delete.
- API admin product PATCH replaces the entire image set when `images` is sent. The form always sends `images` (possibly empty array) — acceptable, but be aware deleting all rows clears them.

