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
