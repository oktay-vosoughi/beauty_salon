# Tasks — Beauty Salon Turkish E-commerce

## Milestones

- [ ] **Milestone 0** — Repo inspection + PROJECT_PLAN.md + TASKS.md
- [ ] **Milestone 1** — pnpm workspace setup, app scaffolds, tsconfig, lint/format, .env
- [ ] **Milestone 2** — Template conversion: Navbar, Hero, Footer, public pages, Turkish content
- [ ] **Milestone 3** — Prisma MySQL schema + migrations + seed (~25 ürün) + /urunler list/detail
- [ ] **Milestone 4** — Auth (register/login/logout/sessions) + /hesabim dashboard skeleton
- [ ] **Milestone 5** — Admin panel CRUD: products, images, stock/price + order status management
- [ ] **Milestone 6** — Server cart + checkout → Order(PENDING)
- [ ] **Milestone 7** — PayTR iFrame token + callback + payment status sync (test mode first)
- [ ] **Milestone 8** — Reviews (post-purchase gate + admin moderation) + /iletisim contact form
- [ ] **Milestone 9** — SEO: metadata, sitemap, robots.txt, JSON-LD, next/image optimization
- [ ] **Milestone 10** — Vitest + Supertest + Playwright E2E tests + production hardening + deploy dry-run

---

## First 10 Implementation Tasks

- [ ] **Task 1** — Create `PROJECT_PLAN.md` and `TASKS.md` in project root
- [ ] **Task 2** — `git init`, create `.gitignore` (node_modules, .env, .next, dist, coverage)
- [ ] **Task 3** — Init pnpm workspace: root `package.json`, `pnpm-workspace.yaml`, declare `apps/*` and `packages/*`
- [ ] **Task 4** — Scaffold `apps/web` with `create-next-app` (TypeScript, App Router, no Tailwind, src dir, ESLint)
- [ ] **Task 5** — Scaffold `apps/api`: Express + TypeScript + tsx dev runner + Prisma init with `provider = "mysql"`
- [ ] **Task 6** — Add root `tsconfig.base.json`, ESLint (shared config), Prettier, EditorConfig
- [ ] **Task 7** — Write `.env` (real local creds) and `.env.example` (placeholders); verify `.env` is git-ignored
- [ ] **Task 8** — Skim `energen-master/index.html` (nav + hero + footer blocks only) → copy required images/fonts to `apps/web/public/`, paste template CSS into `apps/web/src/styles/template.css`
- [ ] **Task 9** — Build `Navbar` + `Footer` + `layout.tsx` with Turkish menu; verify `/` renders with template styling
- [ ] **Task 10** — Define Prisma schema (User, Category, Product, ProductImage with MySQL-specific types) + first migration + seed 5 dummy products → `GET /api/products` returns them; `/urunler` lists via Server Component
