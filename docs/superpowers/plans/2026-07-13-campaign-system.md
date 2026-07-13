# Campaign System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-managed "2 al 2 bedava" campaign system with server-side discounted checkout totals and homepage banner display.

**Architecture:** Add a focused Prisma `Campaign` model, a reusable promotion calculation service, admin/public API routes, and small Next.js admin/homepage UI surfaces. Cart/order/payment totals rely on API-calculated campaign totals, not frontend-only math.

**Tech Stack:** Prisma/MySQL, Express, Zod, Vitest/Supertest, Next.js App Router, React/TypeScript, CSS modules.

---

### Task 1: Data Model And Promotion Engine

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260713000000_add_campaigns/migration.sql`
- Create: `apps/api/src/services/campaigns.ts`
- Test: `apps/api/src/tests/campaigns.unit.test.ts`

- [ ] Write failing unit tests for `calculateBuyTwoGetTwo` with four items, six items, and quantity-expanded cart lines.
- [ ] Run `pnpm --filter @niltellioglu/api run test -- src/tests/campaigns.unit.test.ts` and verify it fails because the module does not exist.
- [ ] Add `CampaignType`, `Campaign`, and `OrderItem` discount fields to Prisma schema and migration SQL.
- [ ] Implement `calculateBuyTwoGetTwo`, `getActiveBuyTwoGetTwoCampaign`, and `calculateCartPromotion`.
- [ ] Re-run the unit test and verify it passes.

### Task 2: API Routes

**Files:**
- Create: `apps/api/src/routes/campaigns.ts`
- Create: `apps/api/src/routes/admin/campaigns.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/src/tests/api.test.ts`

- [ ] Write failing Supertest coverage for public active banner and admin create/list/update flow.
- [ ] Run the targeted API test and verify it fails because routes do not exist.
- [ ] Add public and admin campaign routers with Zod validation.
- [ ] Mount routes in `app.ts`.
- [ ] Re-run the targeted API test and verify it passes.

### Task 3: Order Totals

**Files:**
- Modify: `apps/api/src/routes/orders.ts`
- Test: `apps/api/src/tests/api.test.ts`

- [ ] Write failing order creation coverage for a four-item cart where the two cheapest units are free.
- [ ] Run the targeted API test and verify it fails with the old full-price total.
- [ ] Use `calculateCartPromotion` inside order creation and store per-item gift/discount snapshots.
- [ ] Re-run the targeted API test and verify it passes.

### Task 4: Admin And Homepage UI

**Files:**
- Modify: `apps/web/src/app/admin/layout.tsx`
- Modify: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/kampanyalar/page.tsx`
- Create: `apps/web/src/app/admin/kampanyalar/AdminCampaignsClient.tsx`
- Create: `apps/web/src/app/admin/kampanyalar/page.module.css`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/page.module.css`

- [ ] Add a Turkish admin campaign page with create/edit/toggle controls.
- [ ] Add `Kampanyalar` to the sidebar and dashboard cards.
- [ ] Fetch and render the public active banner on the homepage.
- [ ] Keep styling compact and consistent with the current admin/public CSS.

### Task 5: Verification

**Files:**
- Modify: `PROJECT_PLAN.md`
- Modify: `TASKS.md`

- [ ] Update project tracking docs with the campaign work.
- [ ] Run `pnpm --filter @niltellioglu/api run test -- src/tests/campaigns.unit.test.ts`.
- [ ] Run `pnpm --filter @niltellioglu/api run test -- src/tests/api.test.ts`.
- [ ] Run `pnpm --filter @niltellioglu/api run typecheck`.
- [ ] Run `pnpm --filter @niltellioglu/web run typecheck`.
- [ ] Run `pnpm --filter @niltellioglu/web run build`.
