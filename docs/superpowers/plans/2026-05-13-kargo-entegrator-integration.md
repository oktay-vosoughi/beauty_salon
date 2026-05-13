# Kargo Entegratör Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Kargo Entegratör API so shipments are auto-created when PayTR payment succeeds, admins can manage them from a new order-detail page, and customers see tracking status in their order history.

**Architecture:** New `Shipment` model (1:1 with `Order`) stores KE data. A pure TypeScript service (`kargoEntegrator.ts`) wraps all KE HTTP calls. Shipment is auto-created in the PayTR success callback (non-blocking — payment never fails due to KE errors). Admin manages shipments at `/admin/siparisler/[id]`. `OrderStatus` enum gains `SHIPPED` and `DELIVERED`.

**Tech Stack:** Prisma (MySQL), Express + TypeScript, Next.js 14 App Router, Vitest + Supertest, native `fetch` (Node 18+ / ES2022)

---

## File Map

| Action | File |
|--------|------|
| MODIFY | `apps/api/prisma/schema.prisma` |
| CREATE | `apps/api/prisma/migrations/…/migration.sql` (auto by prisma) |
| CREATE | `apps/api/src/services/kargoEntegrator.ts` |
| CREATE | `apps/api/src/routes/admin/shipments.ts` |
| MODIFY | `apps/api/src/app.ts` |
| MODIFY | `apps/api/src/routes/admin/orders.ts` |
| MODIFY | `apps/api/src/routes/payments.ts` |
| MODIFY | `apps/api/src/routes/orders.ts` |
| CREATE | `apps/api/src/tests/kargoEntegrator.unit.test.ts` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/page.tsx` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/AdminOrderDetailClient.tsx` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/ShipmentPanel.tsx` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/detail.module.css` |
| MODIFY | `apps/web/src/app/admin/siparisler/AdminOrdersClient.tsx` |
| MODIFY | `apps/web/src/app/hesabim/siparisler/page.tsx` |
| MODIFY | `.env.example` |
| MODIFY | `CLAUDE.md` |
| CREATE | `docs/DEPLOYMENT.md` |

---

## Task 1: Prisma Schema — Add Shipment model + extend OrderStatus

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1.1: Update schema.prisma**

Replace the `OrderStatus` enum and `Order` model relation, and add the `Shipment` model.

In `apps/api/prisma/schema.prisma`, replace lines 15-20 (the OrderStatus enum):

```prisma
enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

After the `Payment` model (after line 192), add:

```prisma
model Shipment {
  id                 Int       @id @default(autoincrement())
  orderId            Int       @unique
  order              Order     @relation(fields: [orderId], references: [id])
  keShipmentId       Int?
  cargoIntegrationId Int?
  cargoCompanyName   String?
  trackingNumber     String?
  status             String    @default("NEW")
  note               String?   @db.Text
  rawResponseJson    Json?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  syncedAt           DateTime?

  @@index([orderId])
}
```

In the `Order` model (around line 158), add the relation field after `payment Payment?`:

```prisma
  shipment  Shipment?
```

- [ ] **Step 1.2: Run migration**

```bash
pnpm --filter @niltellioglu/api db:migrate
```

When prompted for a migration name, enter: `add_shipment_extend_order_status`

Expected output: `✔ Your database schema is now in sync with your migration.`

- [ ] **Step 1.3: Regenerate Prisma client**

```bash
pnpm --filter @niltellioglu/api db:generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 1.4: Verify TypeScript compiles**

```bash
pnpm --filter @niltellioglu/api typecheck
```

Expected: 0 errors.

- [ ] **Step 1.5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(db): add Shipment model, extend OrderStatus with SHIPPED/DELIVERED"
```

---

## Task 2: Kargo Entegratör Service

**Files:**
- Create: `apps/api/src/services/kargoEntegrator.ts`

- [ ] **Step 2.1: Create the service file**

Create `apps/api/src/services/kargoEntegrator.ts` with the full content:

```typescript
// Kargo Entegratör REST API client
// Base URL: https://app.kargoentegrator.com
// Auth: Bearer token from KARGO_ENTEGRATOR_API_KEY env var

export class KargoEntegratorError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "KargoEntegratorError";
  }
}

function cfg() {
  const apiKey = process.env.KARGO_ENTEGRATOR_API_KEY ?? "";
  const baseUrl =
    process.env.KARGO_ENTEGRATOR_BASE_URL ?? "https://app.kargoentegrator.com";
  const warehouseId = parseInt(
    process.env.KARGO_ENTEGRATOR_WAREHOUSE_ID ?? "0",
    10
  );
  const cargoIntegrationId = parseInt(
    process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID ?? "0",
    10
  );
  const defaultDesi = parseInt(
    process.env.KARGO_ENTEGRATOR_DEFAULT_DESI ?? "3",
    10
  );
  return { apiKey, baseUrl, warehouseId, cargoIntegrationId, defaultDesi };
}

function headers() {
  return {
    Authorization: `Bearer ${cfg().apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function keRequest<T = unknown>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const { baseUrl } = cfg();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new KargoEntegratorError(
      res.status,
      `KE ${res.status} on ${method} ${path}: ${text.slice(0, 300)}`
    );
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export function splitFullName(fullName: string): {
  name: string;
  surname: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: parts[0] };
  const surname = parts[parts.length - 1];
  const name = parts.slice(0, -1).join(" ");
  return { name, surname };
}

export interface OrderForShipment {
  id: number;
  totalAmount: string | number;
  shippingAddressJson: {
    fullName: string;
    phone: string;
    line1: string;
    district: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    quantity: number;
    titleSnapshot: string;
  }>;
  user: {
    email: string;
  };
}

export interface KeShipmentResponse {
  id: number;
  barcode?: string | null;
  tracking_number?: string | null;
  status?: string;
  [key: string]: unknown;
}

export async function createShipment(
  order: OrderForShipment,
  note?: string
): Promise<KeShipmentResponse> {
  const { warehouseId, cargoIntegrationId, defaultDesi } = cfg();
  const addr = order.shippingAddressJson;
  const { name, surname } = splitFullName(addr.fullName);

  const body = {
    cargo_integration_id: cargoIntegrationId,
    warehouse_id: warehouseId,
    customer: {
      name,
      surname,
      phone: addr.phone,
      email: order.user.email,
      country: "TÜRKIYE",
      postcode: addr.postalCode,
      city: addr.city,
      district: addr.district,
      address: addr.line1,
    },
    payment_type: "credit_card",
    package_type: "box",
    payor_type: "sender",
    is_pay_at_door: false,
    total: Number(order.totalAmount),
    currency: "TRY",
    desi: defaultDesi,
    platform_d_id: order.id,
    note: note ?? "",
    lines: order.items.map((item) => ({
      quantity: item.quantity,
      sku: item.titleSnapshot,
    })),
  };

  return keRequest<KeShipmentResponse>("POST", "/api/shipments", body);
}

export async function getShipment(
  keShipmentId: number
): Promise<KeShipmentResponse> {
  return keRequest<KeShipmentResponse>("GET", `/api/shipments/${keShipmentId}`);
}

export async function deleteShipment(keShipmentId: number): Promise<void> {
  await keRequest("DELETE", `/api/shipments/${keShipmentId}`);
}

export async function printLabel(keShipmentId: number): Promise<Buffer> {
  const { baseUrl } = cfg();
  const res = await fetch(
    `${baseUrl}/api/print-pdf?shipments[]=${keShipmentId}`,
    { headers: headers() }
  );
  if (!res.ok) {
    throw new KargoEntegratorError(res.status, "Label download failed");
  }
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

export async function checkConnection(): Promise<boolean> {
  try {
    await keRequest("GET", "/api/helpers/check-connection");
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2.2: Typecheck**

```bash
pnpm --filter @niltellioglu/api typecheck
```

Expected: 0 errors.

- [ ] **Step 2.3: Commit**

```bash
git add apps/api/src/services/kargoEntegrator.ts
git commit -m "feat(api): add Kargo Entegratör service client"
```

---

## Task 3: Admin Shipment Routes

**Files:**
- Create: `apps/api/src/routes/admin/shipments.ts`

- [ ] **Step 3.1: Create routes file**

Create `apps/api/src/routes/admin/shipments.ts`:

```typescript
import { Router } from "express";
import { prisma } from "../../db/prisma";
import * as ke from "../../services/kargoEntegrator";

// mergeParams lets us read :orderId from the parent mount path
const router = Router({ mergeParams: true });

function getOrderId(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  return parseInt((req.params as Record<string, string>).orderId, 10);
}

// GET /api/admin/orders/:orderId/shipment
router.get("/", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/orders/:orderId/shipment
router.post("/", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);

    const existing = await prisma.shipment.findUnique({ where: { orderId } });
    if (existing) {
      res
        .status(400)
        .json({ error: "Bu sipariş için zaten kargo oluşturulmuş." });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) {
      res.status(404).json({ error: "Sipariş bulunamadı." });
      return;
    }
    if (order.status !== "PAID" && order.status !== "SHIPPED") {
      res
        .status(400)
        .json({ error: "Ödeme alınmadan kargo oluşturulamaz." });
      return;
    }

    const keResponse = await ke.createShipment(
      order as ke.OrderForShipment,
      req.body?.note
    );

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        keShipmentId: keResponse.id ?? null,
        trackingNumber:
          keResponse.barcode ?? keResponse.tracking_number ?? null,
        status: keResponse.status ?? "NEW",
        cargoIntegrationId: parseInt(
          process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID ?? "0",
          10
        ),
        rawResponseJson: keResponse as object,
        syncedAt: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    });

    res.status(201).json(shipment);
  } catch (err) {
    if (err instanceof ke.KargoEntegratorError) {
      res
        .status(502)
        .json({ error: `Kargo oluşturulamadı: ${err.message}` });
      return;
    }
    next(err);
  }
});

// POST /api/admin/orders/:orderId/shipment/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment?.keShipmentId) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }

    const keResponse = await ke.getShipment(shipment.keShipmentId);

    const updated = await prisma.shipment.update({
      where: { orderId },
      data: {
        status: keResponse.status ?? shipment.status,
        trackingNumber:
          keResponse.barcode ??
          keResponse.tracking_number ??
          shipment.trackingNumber,
        rawResponseJson: keResponse as object,
        syncedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof ke.KargoEntegratorError) {
      res.status(502).json({ error: `Durum alınamadı: ${err.message}` });
      return;
    }
    next(err);
  }
});

// DELETE /api/admin/orders/:orderId/shipment
router.delete("/", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }

    if (shipment.keShipmentId) {
      try {
        await ke.deleteShipment(shipment.keShipmentId);
      } catch (err) {
        // If KE returns 404, the shipment was already gone — still clean up locally
        if (
          !(err instanceof ke.KargoEntegratorError && err.statusCode === 404)
        ) {
          if (err instanceof ke.KargoEntegratorError) {
            res
              .status(502)
              .json({ error: `Kargo iptal edilemedi: ${err.message}` });
            return;
          }
          throw err;
        }
      }
    }

    await prisma.shipment.delete({ where: { orderId } });
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:orderId/shipment/label
router.get("/label", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment?.keShipmentId) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }

    const pdfBuffer = await ke.printLabel(shipment.keShipmentId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="kargo-${orderId}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    if (err instanceof ke.KargoEntegratorError) {
      res
        .status(502)
        .json({ error: "Etiket alınamadı, lütfen tekrar deneyin." });
      return;
    }
    next(err);
  }
});

export default router;
```

- [ ] **Step 3.2: Typecheck**

```bash
pnpm --filter @niltellioglu/api typecheck
```

Expected: 0 errors.

- [ ] **Step 3.3: Commit**

```bash
git add apps/api/src/routes/admin/shipments.ts
git commit -m "feat(api): add admin shipment routes (create/refresh/cancel/label)"
```

---

## Task 4: Mount Routes + Update Admin Orders Routes

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/routes/admin/orders.ts`

- [ ] **Step 4.1: Mount shipment router in app.ts**

In `apps/api/src/app.ts`, add the import after the other admin imports (around line 19):

```typescript
import adminShipmentsRouter from "./routes/admin/shipments";
```

Then add the mount after the existing admin mounts (after line 73):

```typescript
app.use("/api/admin/orders/:orderId/shipment", requireAdmin, adminShipmentsRouter);
```

The full admin block in `app.ts` should now read:

```typescript
// Admin routes — all require ADMIN role
app.use("/api/admin/products", requireAdmin, adminProductsRouter);
app.use("/api/admin/orders", requireAdmin, adminOrdersRouter);
app.use("/api/admin/orders/:orderId/shipment", requireAdmin, adminShipmentsRouter);
app.use("/api/admin/reviews", requireAdmin, adminReviewsRouter);
app.use("/api/admin/uploads", requireAdmin, adminUploadsRouter);
```

- [ ] **Step 4.2: Update admin orders routes**

In `apps/api/src/routes/admin/orders.ts`, update the status enum to include new values, and include shipment in the detail GET.

Replace the `statusSchema` (line 7):

```typescript
const statusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});
```

Replace the `where` type cast in `GET /` (line 17):

```typescript
const where = status
  ? { status: status as "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" }
  : {};
```

In `GET /:id`, add `shipment: true` to the `include`:

```typescript
const order = await prisma.order.findUnique({
  where: { id: Number(req.params.id) },
  include: {
    user: { select: { id: true, name: true, email: true, phone: true } },
    items: { include: { product: { select: { title: true, slug: true } } } },
    payment: true,
    shipment: true,
  },
});
```

- [ ] **Step 4.3: Typecheck**

```bash
pnpm --filter @niltellioglu/api typecheck
```

Expected: 0 errors.

- [ ] **Step 4.4: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/routes/admin/orders.ts
git commit -m "feat(api): mount shipment router, extend admin orders status enum"
```

---

## Task 5: Auto-Shipment Creation on Payment Success

**Files:**
- Modify: `apps/api/src/routes/payments.ts`

- [ ] **Step 5.1: Add KE import to payments.ts**

At the top of `apps/api/src/routes/payments.ts`, add after the existing imports:

```typescript
import * as ke from "../services/kargoEntegrator";
```

- [ ] **Step 5.2: Add auto-shipment block inside the success branch**

In `payments.ts`, locate the `if (status === "success")` block (line 145). After the `$transaction` call that marks Payment as SUCCESS and Order as PAID (the closing `});` around line 159), add:

```typescript
    // Auto-create shipment in Kargo Entegratör — non-blocking.
    // A failure here must never cause the PayTR callback to fail or retry.
    setImmediate(async () => {
      try {
        const fullOrder = await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { items: true, user: true },
        });
        if (!fullOrder) return;

        // Skip if a shipment already exists (e.g. admin created one manually)
        const existing = await prisma.shipment.findUnique({
          where: { orderId: fullOrder.id },
        });
        if (existing) return;

        const keResponse = await ke.createShipment(
          fullOrder as ke.OrderForShipment
        );
        await prisma.shipment.create({
          data: {
            orderId: fullOrder.id,
            keShipmentId: keResponse.id ?? null,
            trackingNumber:
              keResponse.barcode ?? keResponse.tracking_number ?? null,
            status: keResponse.status ?? "NEW",
            cargoIntegrationId: parseInt(
              process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID ?? "0",
              10
            ),
            rawResponseJson: keResponse as object,
            syncedAt: new Date(),
          },
        });
        await prisma.order.update({
          where: { id: fullOrder.id },
          data: { status: "SHIPPED" },
        });
      } catch (err) {
        // Log but do not rethrow — payment is already confirmed
        console.error(
          "[KargoEntegratör] Auto-shipment failed for order",
          payment.orderId,
          err instanceof Error ? err.message : err
        );
      }
    });
```

The success branch should now look like:

```typescript
    if (status === "success") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            amount: Number(total_amount) / 100,
            callbackPayloadJson: params,
          },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "PAID" },
        });
        // Stock was already decremented at order creation — no action needed
      });

      // Auto-create shipment in Kargo Entegratör — non-blocking.
      setImmediate(async () => {
        try {
          const fullOrder = await prisma.order.findUnique({
            where: { id: payment.orderId },
            include: { items: true, user: true },
          });
          if (!fullOrder) return;

          const existing = await prisma.shipment.findUnique({
            where: { orderId: fullOrder.id },
          });
          if (existing) return;

          const keResponse = await ke.createShipment(
            fullOrder as ke.OrderForShipment
          );
          await prisma.shipment.create({
            data: {
              orderId: fullOrder.id,
              keShipmentId: keResponse.id ?? null,
              trackingNumber:
                keResponse.barcode ?? keResponse.tracking_number ?? null,
              status: keResponse.status ?? "NEW",
              cargoIntegrationId: parseInt(
                process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID ?? "0",
                10
              ),
              rawResponseJson: keResponse as object,
              syncedAt: new Date(),
            },
          });
          await prisma.order.update({
            where: { id: fullOrder.id },
            data: { status: "SHIPPED" },
          });
        } catch (err) {
          console.error(
            "[KargoEntegratör] Auto-shipment failed for order",
            payment.orderId,
            err instanceof Error ? err.message : err
          );
        }
      });
    }
```

- [ ] **Step 5.3: Typecheck**

```bash
pnpm --filter @niltellioglu/api typecheck
```

Expected: 0 errors.

- [ ] **Step 5.4: Commit**

```bash
git add apps/api/src/routes/payments.ts
git commit -m "feat(api): auto-create KE shipment after PayTR payment success"
```

---

## Task 6: Include Shipment in Customer Orders API

**Files:**
- Modify: `apps/api/src/routes/orders.ts`

- [ ] **Step 6.1: Add shipment to GET /api/orders**

In `apps/api/src/routes/orders.ts`, update the `GET /` handler's `include` (line 114):

```typescript
const orders = await prisma.order.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
  include: {
    items: { include: { product: { select: { title: true, slug: true } } } },
    payment: { select: { status: true, amount: true } },
    shipment: {
      select: {
        trackingNumber: true,
        status: true,
        syncedAt: true,
        cargoCompanyName: true,
      },
    },
  },
});
```

- [ ] **Step 6.2: Add shipment to GET /api/orders/:id**

In `apps/api/src/routes/orders.ts`, update the `GET /:id` handler's `include` (line 131):

```typescript
const order = await prisma.order.findFirst({
  where: { id: Number(req.params.id), userId },
  include: {
    items: {
      include: { product: { select: { title: true, slug: true, images: { take: 1 } } } },
    },
    payment: true,
    shipment: {
      select: {
        trackingNumber: true,
        status: true,
        syncedAt: true,
        cargoCompanyName: true,
      },
    },
  },
});
```

- [ ] **Step 6.3: Typecheck + commit**

```bash
pnpm --filter @niltellioglu/api typecheck
git add apps/api/src/routes/orders.ts
git commit -m "feat(api): include shipment data in customer orders endpoints"
```

---

## Task 7: Admin Order Detail Page + ShipmentPanel

**Files:**
- Create: `apps/web/src/app/admin/siparisler/[id]/page.tsx`
- Create: `apps/web/src/app/admin/siparisler/[id]/AdminOrderDetailClient.tsx`
- Create: `apps/web/src/app/admin/siparisler/[id]/ShipmentPanel.tsx`
- Create: `apps/web/src/app/admin/siparisler/[id]/detail.module.css`

- [ ] **Step 7.1: Create the server page**

Create `apps/web/src/app/admin/siparisler/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminOrderDetailClient from "./AdminOrderDetailClient";

export const metadata: Metadata = { title: "Admin — Sipariş Detayı" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();
  return <AdminOrderDetailClient id={id} />;
}
```

- [ ] **Step 7.2: Create the CSS module**

Create `apps/web/src/app/admin/siparisler/[id]/detail.module.css`:

```css
.back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-muted);
  text-decoration: none;
  margin-bottom: 1.5rem;
}
.back:hover { color: var(--color-primary); }

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }

.card {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

.cardTitle {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  margin: 0 0 1rem;
}

.row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid #f4f1ee;
}
.row:last-child { border-bottom: none; }
.rowLabel { color: var(--color-muted); }
.rowValue { font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }

.itemsTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
.itemsTable th {
  text-align: left;
  font-weight: 600;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #e8e4e0;
  color: var(--color-muted);
}
.itemsTable td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f4f1ee;
}
.itemsTable tr:last-child td { border-bottom: none; }

.shipmentPanel {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}

.shipmentTitle {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  margin: 0 0 1.25rem;
}

.trackingBox {
  background: #f8f5f2;
  border-radius: 6px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.trackingNumber {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-dark);
  margin: 0 0 0.4rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.noteInput {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  resize: vertical;
  min-height: 60px;
}

.error {
  color: #c0392b;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e8e4e0;
  color: #555;
}
.badgeNew    { background: #e8f0fe; color: #1a56db; }
.badgeShip   { background: #e3f5e9; color: #1a7c42; }
.badgeDone   { background: #27ae60; color: #fff; }
.badgeFail   { background: #fde8e8; color: #c0392b; }
```

- [ ] **Step 7.3: Create ShipmentPanel component**

Create `apps/web/src/app/admin/siparisler/[id]/ShipmentPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import styles from "./detail.module.css";

interface Shipment {
  id: number;
  orderId: number;
  keShipmentId: number | null;
  trackingNumber: string | null;
  status: string;
  cargoCompanyName: string | null;
  note: string | null;
  syncedAt: string | null;
  createdAt: string;
}

const KE_STATUS: Record<string, { label: string; cls: string }> = {
  NEW:              { label: "Oluşturuldu",    cls: styles.badgeNew  },
  PREPARING:        { label: "Hazırlanıyor",   cls: styles.badgeNew  },
  READY_TO_SHIP:    { label: "Kargoya Hazır",  cls: styles.badgeNew  },
  SHIPPED:          { label: "Kargoda",        cls: styles.badgeShip },
  OUT_FOR_DELIVERY: { label: "Dağıtımda",      cls: styles.badgeShip },
  DELIVERED:        { label: "Teslim Edildi",  cls: styles.badgeDone },
  COMPLETED:        { label: "Teslim Edildi",  cls: styles.badgeDone },
  RETURNING:        { label: "İade Sürecinde", cls: styles.badgeFail },
  RETURNED:         { label: "İade Edildi",    cls: styles.badgeFail },
};

export default function ShipmentPanel({ orderId }: { orderId: number }) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState("");

  async function loadShipment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        credentials: "include",
      });
      if (res.status === 404) { setShipment(null); return; }
      if (!res.ok) throw new Error("Yükleme hatası");
      setShipment(await res.json());
    } catch {
      setError("Kargo bilgisi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadShipment(); }, [orderId]);

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Kargo oluşturulamadı."); return; }
      setShipment(data);
      setNote("");
    } catch {
      setError("Kargo oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shipment/refresh`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Durum güncellenemedi."); return; }
      setShipment(data);
    } catch {
      setError("Durum güncellenemedi.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Bu kargoyu iptal etmek istediğinize emin misiniz?")) return;
    setCancelling(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 204) { setShipment(null); return; }
      const data = await res.json();
      setError(data.error ?? "Kargo iptal edilemedi.");
    } catch {
      setError("Kargo iptal edilemedi.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleLabel() {
    setLabelLoading(true);
    setLabelError("");
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/shipment/label`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error ?? "Etiket alınamadı");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kargo-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setLabelError(err instanceof Error ? err.message : "Etiket alınamadı");
    } finally {
      setLabelLoading(false);
    }
  }

  if (loading) return (
    <div className={styles.shipmentPanel}>
      <p className={styles.shipmentTitle}>Kargo</p>
      <p style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>Yükleniyor…</p>
    </div>
  );

  const statusInfo = shipment
    ? KE_STATUS[shipment.status] ?? { label: shipment.status, cls: styles.badge }
    : null;

  return (
    <div className={styles.shipmentPanel}>
      <p className={styles.shipmentTitle}>Kargo Yönetimi</p>

      {shipment ? (
        <>
          <div className={styles.trackingBox}>
            {shipment.trackingNumber && (
              <div className={styles.trackingNumber}>
                Takip No: {shipment.trackingNumber}
              </div>
            )}
            <span className={`${styles.badge} ${statusInfo?.cls ?? ""}`}>
              {statusInfo?.label ?? shipment.status}
            </span>
            {shipment.syncedAt && (
              <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.5rem" }}>
                Son güncelleme:{" "}
                {new Date(shipment.syncedAt).toLocaleString("tr-TR")}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className="btn btn-outline"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ fontSize: "0.8rem" }}
            >
              {refreshing ? "Güncelleniyor…" : "Durumu Yenile"}
            </button>
            <button
              className="btn btn-outline"
              onClick={handleLabel}
              disabled={labelLoading}
              style={{ fontSize: "0.8rem" }}
            >
              {labelLoading ? "İndiriliyor…" : "Etiket İndir (PDF)"}
            </button>
            <button
              className="btn"
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                fontSize: "0.8rem",
                background: "#dc3545",
                color: "#fff",
                borderColor: "#dc3545",
              }}
            >
              {cancelling ? "İptal ediliyor…" : "Kargıyu İptal Et"}
            </button>
          </div>

          {labelError && <p className={styles.error}>{labelError}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </>
      ) : (
        <>
          <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginBottom: "0.75rem" }}>
            Bu sipariş için henüz kargo oluşturulmamış.
          </p>
          <textarea
            className={styles.noteInput}
            placeholder="Not (isteğe bağlı)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={creating}
          />
          <div className={styles.actions}>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={creating}
              style={{ fontSize: "0.875rem" }}
            >
              {creating ? "Oluşturuluyor…" : "Kargo Oluştur"}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7.4: Create AdminOrderDetailClient**

Create `apps/web/src/app/admin/siparisler/[id]/AdminOrderDetailClient.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./detail.module.css";
import ShipmentPanel from "./ShipmentPanel";

interface OrderItem {
  id: number;
  titleSnapshot: string;
  quantity: number;
  unitPrice: string;
}

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  shippingAddressJson: {
    fullName: string;
    phone: string;
    line1: string;
    district: string;
    city: string;
    postalCode: string;
  };
  user: { id: number; name: string; email: string; phone: string | null };
  items: OrderItem[];
  payment: {
    id: number;
    provider: string;
    merchantOid: string;
    status: string;
    amount: string;
    createdAt: string;
  } | null;
}

const ORDER_STATUS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID: "Ödendi",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade",
};

export default function AdminOrderDetailClient({ id }: { id: number }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          credentials: "include",
        });
        if (res.status === 404) {
          if (!cancelled) setError("Sipariş bulunamadı.");
          return;
        }
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setError("Bu sayfaya erişim yetkiniz yok.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Sipariş yüklenemedi.");
          return;
        }
        if (!cancelled) setOrder(await res.json());
      } catch {
        if (!cancelled) setError("Sipariş yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading)
    return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;

  if (error)
    return (
      <div>
        <Link href="/admin/siparisler" className={styles.back}>← Siparişlere dön</Link>
        <p style={{ color: "#c0392b" }}>{error}</p>
      </div>
    );

  if (!order) return null;

  const addr = order.shippingAddressJson;
  const st = ORDER_STATUS[order.status] ?? order.status;

  return (
    <div>
      <Link href="/admin/siparisler" className={styles.back}>← Siparişler</Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: 0 }}>
          Sipariş #{order.id}
        </h1>
        <span className="badge badge-primary" style={{ fontSize: "0.8rem" }}>
          {st}
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
          {new Date(order.createdAt).toLocaleDateString("tr-TR")}
        </span>
      </div>

      {/* Shipment panel at the top for quick access */}
      <ShipmentPanel orderId={id} />

      <div className={styles.grid}>
        {/* Customer */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Müşteri</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Ad Soyad</span>
            <span className={styles.rowValue}>{order.user.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>E-posta</span>
            <span className={styles.rowValue}>{order.user.email}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Telefon</span>
            <span className={styles.rowValue}>{order.user.phone ?? "—"}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Teslimat Adresi</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Alıcı</span>
            <span className={styles.rowValue}>{addr.fullName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Telefon</span>
            <span className={styles.rowValue}>{addr.phone}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Adres</span>
            <span className={styles.rowValue}>{addr.line1}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>İlçe / Şehir</span>
            <span className={styles.rowValue}>{addr.district} / {addr.city}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Posta Kodu</span>
            <span className={styles.rowValue}>{addr.postalCode}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <p className={styles.cardTitle}>Ürünler</p>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Ürün</th>
              <th style={{ textAlign: "right" }}>Adet</th>
              <th style={{ textAlign: "right" }}>Birim Fiyat</th>
              <th style={{ textAlign: "right" }}>Toplam</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.titleSnapshot}</td>
                <td style={{ textAlign: "right" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>
                  {Number(item.unitPrice).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>
                  {(Number(item.unitPrice) * item.quantity).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", paddingTop: "0.75rem", fontWeight: 700 }}>Genel Toplam</td>
              <td style={{ textAlign: "right", paddingTop: "0.75rem", fontWeight: 700 }}>
                {Number(order.totalAmount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment */}
      {order.payment && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Ödeme</p>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Sağlayıcı</span>
            <span className={styles.rowValue}>{order.payment.provider}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Durum</span>
            <span className={styles.rowValue}>{order.payment.status}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Tutar</span>
            <span className={styles.rowValue}>
              {Number(order.payment.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Merchant OID</span>
            <span className={styles.rowValue} style={{ fontSize: "0.75rem" }}>{order.payment.merchantOid}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7.5: Typecheck web app**

```bash
pnpm --filter @niltellioglu/web typecheck
```

Expected: 0 errors.

- [ ] **Step 7.6: Commit**

```bash
git add apps/web/src/app/admin/siparisler/
git commit -m "feat(web): add admin order detail page with shipment management panel"
```

---

## Task 8: Update Admin Orders List

**Files:**
- Modify: `apps/web/src/app/admin/siparisler/AdminOrdersClient.tsx`

- [ ] **Step 8.1: Update AdminOrdersClient.tsx**

Replace the full contents of `apps/web/src/app/admin/siparisler/AdminOrdersClient.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "../urunler/page.module.css";

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  user: { name: string; email: string };
  payment: { status: string } | null;
  _count: { items: number };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Beklemede",
  PAID:      "Ödendi",
  SHIPPED:   "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
  REFUNDED:  "İade",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "#c8a87e",
  PAID:      "#27ae60",
  SHIPPED:   "#2980b9",
  DELIVERED: "#1abc9c",
  CANCELLED: "#e74c3c",
  REFUNDED:  "#f39c12",
};

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=20`, {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) { setError("Yetki yok"); return; }
      const data = await res.json();
      setOrders(data.items);
      setTotal(data.total);
    } catch { setError("Siparişler yüklenemedi"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Siparişler ({total})</h1>
      </div>

      {loading ? (
        <p style={{ color: "var(--color-muted)" }}>Yükleniyor…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Müşteri</th>
                <th>Tutar</th>
                <th>Ürün</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>
                    <div>{o.user.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      {o.user.email}
                    </div>
                  </td>
                  <td>₺{Number(o.totalAmount).toFixed(2)}</td>
                  <td>{o._count.items}</td>
                  <td>
                    <span
                      className="badge badge-primary"
                      style={{ background: STATUS_COLORS[o.status] ?? "#c8a87e" }}
                    >
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/admin/siparisler/${o.id}`}
                        className={styles.actionBtn}
                      >
                        Detay
                      </Link>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="form-control"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", width: "120px" }}
                      >
                        <option value="PENDING">Beklemede</option>
                        <option value="PAID">Ödendi</option>
                        <option value="SHIPPED">Kargoda</option>
                        <option value="DELIVERED">Teslim Edildi</option>
                        <option value="CANCELLED">İptal</option>
                        <option value="REFUNDED">İade</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline"
            style={{ fontSize: "0.8rem" }}
          >
            ← Önceki
          </button>
          <span>Sayfa {page} / {Math.ceil(total / 20)}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="btn btn-outline"
            style={{ fontSize: "0.8rem" }}
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8.2: Typecheck + commit**

```bash
pnpm --filter @niltellioglu/web typecheck
git add apps/web/src/app/admin/siparisler/AdminOrdersClient.tsx
git commit -m "feat(web): add Detail link and SHIPPED/DELIVERED labels to admin orders list"
```

---

## Task 9: Customer Order Tracking UI

**Files:**
- Modify: `apps/web/src/app/hesabim/siparisler/page.tsx`

- [ ] **Step 9.1: Update the customer order list to show tracking**

Replace the full contents of `apps/web/src/app/hesabim/siparisler/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Shipment {
  trackingNumber: string | null;
  status: string;
  syncedAt: string | null;
  cargoCompanyName: string | null;
}

interface OrderItem { id: number; titleSnapshot: string; quantity: number; unitPrice: string }
interface Order {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
  payment: { status: string; amount: string } | null;
  shipment: Shipment | null;
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Bekliyor",          color: "#e67e22" },
  PAID:      { label: "Ödendi",            color: "#27ae60" },
  SHIPPED:   { label: "Kargoya Verildi",   color: "#2980b9" },
  DELIVERED: { label: "Teslim Edildi",     color: "#27ae60" },
  CANCELLED: { label: "İptal Edildi",      color: "#c0392b" },
  REFUNDED:  { label: "İade Edildi",       color: "#e67e22" },
};

const KE_STATUS_TR: Record<string, string> = {
  NEW:              "Hazırlanıyor",
  PREPARING:        "Hazırlanıyor",
  READY_TO_SHIP:    "Kargoya Hazırlanıyor",
  SHIPPED:          "Kargoda",
  OUT_FOR_DELIVERY: "Dağıtımda",
  DELIVERED:        "Teslim Edildi",
  COMPLETED:        "Teslim Edildi",
  RETURNING:        "İade Sürecinde",
  RETURNED:         "İade Edildi",
};

export default function SiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) throw new Error("auth");
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then(setOrders)
      .catch((e) =>
        setError(
          e.message === "auth"
            ? "Giriş yapmanız gerekiyor."
            : "Siparişler yüklenemedi."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>Yükleniyor…</p>;
  if (error)
    return <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>{error}</p>;

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "1.5rem" }}>
        Siparişlerim
      </h2>

      {orders.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
          Henüz siparişiniz bulunmuyor.{" "}
          <Link href="/urunler" style={{ color: "var(--color-primary)" }}>
            Alışverişe başlayın.
          </Link>
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {orders.map((order) => {
            const st =
              ORDER_STATUS[order.status] ?? { label: order.status, color: "#666" };
            const { shipment } = order;
            const keLabel = shipment
              ? (KE_STATUS_TR[shipment.status] ?? "İşlemde")
              : null;

            return (
              <div
                key={order.id}
                style={{
                  background: "var(--color-bg-light,#fafafa)",
                  borderRadius: 8,
                  padding: "1.25rem 1.5rem",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      Sipariş #{order.id}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                        marginLeft: "0.75rem",
                      }}
                    >
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: st.color }}>
                    {st.label}
                  </span>
                </div>

                {/* Items */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 0.75rem",
                    fontSize: "0.85rem",
                    color: "var(--color-muted)",
                  }}
                >
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.titleSnapshot} × {item.quantity}
                    </li>
                  ))}
                </ul>

                {/* Cargo tracking block — only when shipment exists */}
                {shipment && (
                  <div
                    style={{
                      background: "#f0f7ff",
                      borderRadius: 6,
                      padding: "0.65rem 1rem",
                      marginBottom: "0.75rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#2980b9", marginBottom: "0.2rem" }}>
                      Kargo Durumu: {keLabel}
                    </div>
                    {shipment.trackingNumber && (
                      <div style={{ color: "var(--color-muted)" }}>
                        Takip No:{" "}
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          {shipment.trackingNumber}
                        </span>
                      </div>
                    )}
                    {shipment.cargoCompanyName && (
                      <div style={{ color: "var(--color-muted)" }}>
                        {shipment.cargoCompanyName}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    {Number(order.totalAmount).toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </span>
                  {order.status === "PENDING" && (
                    <Link
                      href={`/odeme/${order.id}`}
                      className="btn btn-primary"
                      style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}
                    >
                      Ödemeye Geç
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9.2: Typecheck + commit**

```bash
pnpm --filter @niltellioglu/web typecheck
git add apps/web/src/app/hesabim/siparisler/page.tsx
git commit -m "feat(web): show cargo tracking number and status on customer order list"
```

---

## Task 10: Environment Variables

**Files:**
- Modify: `.env.example`

- [ ] **Step 10.1: Add KE env vars to .env.example**

Append to `.env.example` after the Google OAuth block:

```env

# Kargo Entegratör — https://app.kargoentegrator.com
# 1. Get your API key from: Settings → API
# 2. Get WAREHOUSE_ID from: Settings → Warehouses (GET /api/settings/warehouses)
# 3. Get CARGO_INTEGRATION_ID from: Integrations → Cargo (GET /api/integration/cargos)
KARGO_ENTEGRATOR_API_KEY=""
KARGO_ENTEGRATOR_BASE_URL="https://app.kargoentegrator.com"
KARGO_ENTEGRATOR_WAREHOUSE_ID=""
KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID=""
KARGO_ENTEGRATOR_DEFAULT_DESI="3"
```

- [ ] **Step 10.2: Commit**

```bash
git add .env.example
git commit -m "chore: add Kargo Entegratör env vars to .env.example"
```

---

## Task 11: Unit Tests for KE Service

**Files:**
- Create: `apps/api/src/tests/kargoEntegrator.unit.test.ts`

- [ ] **Step 11.1: Write the test file**

Create `apps/api/src/tests/kargoEntegrator.unit.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  splitFullName,
  createShipment,
  getShipment,
  deleteShipment,
  checkConnection,
  KargoEntegratorError,
  type OrderForShipment,
} from "../services/kargoEntegrator";

// ── splitFullName ──────────────────────────────────────────────────────────

describe("splitFullName", () => {
  it("splits two-word name correctly", () => {
    expect(splitFullName("Ahmet Yılmaz")).toEqual({ name: "Ahmet", surname: "Yılmaz" });
  });

  it("splits three-word name — last word is surname", () => {
    expect(splitFullName("Ahmet Mehmet Yılmaz")).toEqual({
      name: "Ahmet Mehmet",
      surname: "Yılmaz",
    });
  });

  it("handles single word — duplicates as both", () => {
    expect(splitFullName("Ahmet")).toEqual({ name: "Ahmet", surname: "Ahmet" });
  });

  it("trims extra spaces", () => {
    expect(splitFullName("  Fatma  Şahin  ")).toEqual({
      name: "Fatma",
      surname: "Şahin",
    });
  });
});

// ── HTTP client tests ──────────────────────────────────────────────────────

const MOCK_ORDER: OrderForShipment = {
  id: 42,
  totalAmount: "150.00",
  shippingAddressJson: {
    fullName: "Zeynep Kara",
    phone: "05550000000",
    line1: "Örnek Mah. No:1",
    district: "Kadıköy",
    city: "İstanbul",
    postalCode: "34710",
  },
  items: [
    { quantity: 2, titleSnapshot: "Test Ürün" },
  ],
  user: { email: "zeynep@example.com" },
};

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  });
}

describe("createShipment", () => {
  beforeEach(() => {
    process.env.KARGO_ENTEGRATOR_API_KEY = "test-key";
    process.env.KARGO_ENTEGRATOR_BASE_URL = "https://fake-ke.test";
    process.env.KARGO_ENTEGRATOR_WAREHOUSE_ID = "2";
    process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID = "1";
    process.env.KARGO_ENTEGRATOR_DEFAULT_DESI = "3";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/shipments and returns response", async () => {
    const fetchSpy = mockFetch(200, { id: 99, barcode: "123456789", status: "NEW" });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createShipment(MOCK_ORDER);

    expect(result.id).toBe(99);
    expect(result.barcode).toBe("123456789");

    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://fake-ke.test/api/shipments");
    expect(opts.method).toBe("POST");

    const body = JSON.parse(opts.body as string);
    expect(body.customer.name).toBe("Zeynep");
    expect(body.customer.surname).toBe("Kara");
    expect(body.customer.email).toBe("zeynep@example.com");
    expect(body.customer.city).toBe("İstanbul");
    expect(body.total).toBe(150);
    expect(body.platform_d_id).toBe(42);
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].quantity).toBe(2);
  });

  it("throws KargoEntegratorError on 4xx response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(422, { message: "Validation failed" })
    );

    await expect(createShipment(MOCK_ORDER)).rejects.toThrow(KargoEntegratorError);
  });
});

describe("getShipment", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("calls GET /api/shipments/{id}", async () => {
    const fetchSpy = mockFetch(200, { id: 5, status: "SHIPPED" });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await getShipment(5);
    expect(result.status).toBe("SHIPPED");

    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("/api/shipments/5");
  });
});

describe("deleteShipment", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("calls DELETE /api/shipments/{id}", async () => {
    const fetchSpy = mockFetch(204, null);
    vi.stubGlobal("fetch", fetchSpy);

    await expect(deleteShipment(7)).resolves.toBeNull();

    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/shipments/7");
    expect(opts.method).toBe("DELETE");
  });
});

describe("checkConnection", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns true on 200", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
    expect(await checkConnection()).toBe(true);
  });

  it("returns false on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    expect(await checkConnection()).toBe(false);
  });
});
```

- [ ] **Step 11.2: Run the tests**

```bash
pnpm --filter @niltellioglu/api test
```

Expected: all tests pass (existing tests + new KE unit tests).

- [ ] **Step 11.3: Commit**

```bash
git add apps/api/src/tests/kargoEntegrator.unit.test.ts
git commit -m "test(api): add unit tests for Kargo Entegratör service"
```

---

## Task 12: Full Build Check

- [ ] **Step 12.1: Typecheck both apps**

```bash
pnpm --filter @niltellioglu/api typecheck
pnpm --filter @niltellioglu/web typecheck
```

Expected: 0 errors in both.

- [ ] **Step 12.2: Run all API tests**

```bash
pnpm --filter @niltellioglu/api test
```

Expected: all pass.

- [ ] **Step 12.3: Build Next.js web app**

```bash
pnpm --filter @niltellioglu/web build
```

Expected: ✔ successful build, no errors.

- [ ] **Step 12.4: Start dev server and smoke-test manually**

```bash
pnpm dev
```

Navigate to:
1. `http://localhost:3000/admin/siparisler` — orders list loads with "Detay" links
2. Click "Detay" on any order → `/admin/siparisler/{id}` loads with order info + ShipmentPanel
3. If no shipment: "Kargo Oluştur" button is visible
4. `http://localhost:3000/hesabim/siparisler` — order list loads (no tracking shown until shipment exists)

---

## Task 13: CLAUDE.md Update + Deployment Docs

**Files:**
- Modify: `CLAUDE.md`
- Create: `docs/DEPLOYMENT.md`

- [ ] **Step 13.1: Append to CLAUDE.md**

Append the following section at the end of `CLAUDE.md`:

```markdown
---

## Review Notes — 2026-05-13 (Kargo Entegratör Integration)

### What Was Implemented

Full cargo/shipment integration with Kargo Entegratör API.

### New Files
- `apps/api/src/services/kargoEntegrator.ts` — Pure HTTP service client (createShipment, getShipment, deleteShipment, printLabel, checkConnection)
- `apps/api/src/routes/admin/shipments.ts` — Admin shipment CRUD endpoints
- `apps/web/src/app/admin/siparisler/[id]/page.tsx` — Admin order detail page (server)
- `apps/web/src/app/admin/siparisler/[id]/AdminOrderDetailClient.tsx` — Admin order detail client
- `apps/web/src/app/admin/siparisler/[id]/ShipmentPanel.tsx` — Shipment management UI
- `apps/web/src/app/admin/siparisler/[id]/detail.module.css` — Detail page styles
- `apps/api/src/tests/kargoEntegrator.unit.test.ts` — Unit tests
- `docs/DEPLOYMENT.md` — Local + server deployment guide

### Modified Files
- `apps/api/prisma/schema.prisma` — Added Shipment model; added SHIPPED + DELIVERED to OrderStatus enum
- `apps/api/src/app.ts` — Mounted admin shipments router
- `apps/api/src/routes/admin/orders.ts` — Updated status enum, added shipment include in GET /:id
- `apps/api/src/routes/payments.ts` — Auto-creates KE shipment after PayTR success callback
- `apps/api/src/routes/orders.ts` — Includes shipment data in customer orders API
- `apps/web/src/app/admin/siparisler/AdminOrdersClient.tsx` — Added Detail link + new status labels
- `apps/web/src/app/hesabim/siparisler/page.tsx` — Shows cargo tracking to customers
- `.env.example` — Added KE env vars

### New API Endpoints
- `POST   /api/admin/orders/:orderId/shipment` — Create KE shipment (prevents duplicate)
- `GET    /api/admin/orders/:orderId/shipment` — Get shipment record
- `POST   /api/admin/orders/:orderId/shipment/refresh` — Re-fetch status from KE
- `DELETE /api/admin/orders/:orderId/shipment` — Cancel + delete shipment
- `GET    /api/admin/orders/:orderId/shipment/label` — Proxy PDF label from KE

### New Environment Variables
```env
KARGO_ENTEGRATOR_API_KEY=""
KARGO_ENTEGRATOR_BASE_URL="https://app.kargoentegrator.com"
KARGO_ENTEGRATOR_WAREHOUSE_ID=""
KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID=""
KARGO_ENTEGRATOR_DEFAULT_DESI="3"
```

### Credentials Required from Kargo Entegratör Panel
1. **API Key** → https://app.kargoentegrator.com → Settings → API
2. **Warehouse ID** → Settings → Warehouses (or run `GET /api/settings/warehouses` with curl)
3. **Cargo Integration ID** → Integrations → Cargo (select the carrier: Aras, MNG, Yurtiçi, etc.)

### Auto-Shipment Behaviour
- PayTR callback marks Payment → SUCCESS and Order → PAID via `$transaction` (atomic)
- After the transaction, `setImmediate` fires a non-blocking KE shipment creation
- If KE call fails (network/credentials), error is logged but payment callback still returns `OK`
- Order.status advances to SHIPPED only after successful KE creation
- Admin can always manually create/cancel/refresh shipment from the order detail page

### Manual Test Checklist (Updated)
1. Add KE env vars to `.env`
2. Complete a payment → check server logs for `[KargoEntegratör]` messages
3. Open `/admin/siparisler` → click "Detay" on a PAID/SHIPPED order
4. If auto-creation succeeded: ShipmentPanel shows tracking number
5. Click "Durumu Yenile" → status refreshes
6. Click "Etiket İndir (PDF)" → PDF downloads
7. Click "Kargıyu İptal Et" → confirm → shipment deleted, order reverts to PAID
8. Re-create shipment manually from the panel
9. Open `/hesabim/siparisler` as the customer → cargo tracking block visible
10. Try creating duplicate shipment → expect "Bu sipariş için zaten kargo oluşturulmuş."
11. Try creating shipment on PENDING order → expect "Ödeme alınmadan kargo oluşturulamaz."
12. Remove `KARGO_ENTEGRATOR_API_KEY` from env → KE calls fail gracefully (logged, not crashed)
```

- [ ] **Step 13.2: Create docs/DEPLOYMENT.md**

Create `docs/DEPLOYMENT.md`:

```markdown
# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- MySQL 8.0+ (local or Docker)
- Redis 6+ (local or Docker)

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in values
cp .env.example .env
# Edit .env: set DATABASE_URL, SESSION_SECRET, CSRF_SECRET, PayTR, Kargo Entegratör vars

# 3. Create database (MySQL)
mysql -u root -p -e "CREATE DATABASE niltellioglu CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

# 4. Run migrations
pnpm --filter @niltellioglu/api db:migrate

# 5. Generate Prisma client
pnpm --filter @niltellioglu/api db:generate

# 6. Seed database (creates admin + 25 products)
pnpm --filter @niltellioglu/api db:seed
# Admin: admin@guzellikmerkezi.com.tr / Admin1234!

# 7. Start dev servers (both web + api)
pnpm dev
```

Web runs at: http://localhost:3000  
API runs at: http://localhost:4000

### Useful commands

```bash
# Run API unit tests
pnpm --filter @niltellioglu/api test

# Typecheck API
pnpm --filter @niltellioglu/api typecheck

# Typecheck Web
pnpm --filter @niltellioglu/web typecheck

# Next.js build
pnpm --filter @niltellioglu/web build

# Prisma Studio (DB GUI)
pnpm --filter @niltellioglu/api db:studio

# Clear Next.js build cache (if next-flight-client-entry-loader error)
Remove-Item -Recurse -Force apps/web/.next
```

---

## Production Server Deployment (VPS / Ubuntu)

### System Requirements
- Ubuntu 22.04 LTS
- Node.js 20 LTS (via nvm or NodeSource)
- pnpm 8+
- MySQL 8.0
- Redis 6+
- Nginx
- PM2

### 1. Install system packages

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2

# MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# Redis
sudo apt install redis-server

# Nginx
sudo apt install nginx
```

### 2. Database setup

```sql
-- In MySQL as root:
CREATE DATABASE niltellioglu CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'niltellioglu'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON niltellioglu.* TO 'niltellioglu'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Clone and configure

```bash
git clone https://github.com/YOUR_ORG/niltellioglu.git /var/www/niltellioglu
cd /var/www/niltellioglu

# Install dependencies
pnpm install --frozen-lockfile

# Create production env
cp .env.example .env
nano .env
# Fill in all values — especially:
#   DATABASE_URL=mysql://niltellioglu:STRONG_PASSWORD@localhost:3306/niltellioglu
#   NODE_ENV=production
#   SESSION_SECRET=<64-char random string>
#   CSRF_SECRET=<64-char random string>
#   WEB_BASE_URL=https://yourdomain.com
#   API_BASE_URL=https://yourdomain.com  (Nginx proxies /api to port 4000)
#   KARGO_ENTEGRATOR_API_KEY=<your key>
#   KARGO_ENTEGRATOR_WAREHOUSE_ID=<id>
#   KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID=<id>
```

### 4. Build + migrate

```bash
# Migrate DB
pnpm --filter @niltellioglu/api db:generate
pnpm --filter @niltellioglu/api db:migrate

# Build Next.js
pnpm --filter @niltellioglu/web build

# Build API
pnpm --filter @niltellioglu/api build
```

### 5. PM2 process config

Create `/var/www/niltellioglu/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "niltellioglu-api",
      script: "apps/api/dist/index.js",
      cwd: "/var/www/niltellioglu",
      env_file: "/var/www/niltellioglu/.env",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
    },
    {
      name: "niltellioglu-web",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/niltellioglu/apps/web",
      env_file: "/var/www/niltellioglu/.env",
      env: { PORT: 3000 },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # follow the printed instructions to auto-start on reboot
```

### 6. Nginx config

Create `/etc/nginx/sites-available/niltellioglu`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Upload files (served by Next.js public/)
    root /var/www/niltellioglu/apps/web/public;

    # API — proxy to Express on port 4000
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
    }

    # Uploads — serve from disk directly (bypasses Node)
    location /uploads/ {
        alias /var/www/niltellioglu/apps/api/uploads/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Next.js — proxy to port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/niltellioglu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# HTTPS cert (Certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Deploy updates

```bash
cd /var/www/niltellioglu
git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @niltellioglu/api db:generate
pnpm --filter @niltellioglu/api db:migrate
pnpm --filter @niltellioglu/web build
pnpm --filter @niltellioglu/api build
pm2 reload all
```

### 8. Set up Kargo Entegratör credentials on the server

```bash
# Edit .env
nano /var/www/niltellioglu/.env

# Add / update:
KARGO_ENTEGRATOR_API_KEY=your_real_api_key
KARGO_ENTEGRATOR_WAREHOUSE_ID=your_warehouse_id
KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID=your_cargo_integration_id
KARGO_ENTEGRATOR_DEFAULT_DESI=3

# Restart API to pick up new env
pm2 restart niltellioglu-api
```

### 9. Getting Kargo Entegratör IDs

Once you have your API key, you can find the IDs with these curl calls:

```bash
# List warehouses
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Accept: application/json" \
     https://app.kargoentegrator.com/api/settings/warehouses

# List cargo integrations
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Accept: application/json" \
     https://app.kargoentegrator.com/api/integration/cargos
```

Use the `id` field from the responses for `KARGO_ENTEGRATOR_WAREHOUSE_ID` and `KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID`.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `SESSION_SECRET` | Yes | 64-char random secret for session signing |
| `CSRF_SECRET` | Yes | 64-char random secret for CSRF tokens |
| `PAYTR_MERCHANT_ID` | Yes (payment) | From PayTR panel |
| `PAYTR_MERCHANT_KEY` | Yes (payment) | From PayTR panel |
| `PAYTR_MERCHANT_SALT` | Yes (payment) | From PayTR panel |
| `PAYTR_TEST_MODE` | Yes | `"1"` for test, `"0"` for live |
| `KARGO_ENTEGRATOR_API_KEY` | Yes (cargo) | Bearer token from KE panel |
| `KARGO_ENTEGRATOR_BASE_URL` | No | Default: `https://app.kargoentegrator.com` |
| `KARGO_ENTEGRATOR_WAREHOUSE_ID` | Yes (cargo) | From KE Settings → Warehouses |
| `KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID` | Yes (cargo) | From KE Integrations → Cargo |
| `KARGO_ENTEGRATOR_DEFAULT_DESI` | No | Default: `3` |
| `WEB_BASE_URL` | Yes | Public URL for CORS + PayTR callbacks |
| `API_BASE_URL` | Yes | Public API URL |
| `NODE_ENV` | Yes | `development` or `production` |

---

## Troubleshooting

**`next-flight-client-entry-loader` error on dev start**
```bash
Remove-Item -Recurse -Force apps/web/.next
pnpm dev
```

**PayTR callback not creating shipment**
Check server logs for `[KargoEntegratör]` lines. Common causes:
- `KARGO_ENTEGRATOR_API_KEY` not set or wrong
- `KARGO_ENTEGRATOR_WAREHOUSE_ID` or `CARGO_INTEGRATION_ID` not set (0)
- KE API returning validation error (check the logged message)

**Shipment label returns 404 or 502**
KE shipment must have been created successfully first. Check `Shipment.keShipmentId` is not null in the DB.

**Prisma migration fails**
```bash
pnpm --filter @niltellioglu/api typecheck  # check schema syntax first
npx prisma validate --schema apps/api/prisma/schema.prisma
```
```

- [ ] **Step 13.3: Commit everything**

```bash
git add CLAUDE.md docs/DEPLOYMENT.md
git commit -m "docs: update CLAUDE.md with KE integration notes, add DEPLOYMENT.md"
```

---

## Spec Coverage Self-Check

| Requirement | Task |
|-------------|------|
| Auto-create shipment on payment | Task 5 |
| Separate Shipment model | Task 1 |
| SHIPPED/DELIVERED enum | Task 1 |
| KE service (create/get/delete/label/check) | Task 2 |
| Admin: create shipment | Task 3, 7 |
| Admin: view tracking number + status | Task 7 |
| Admin: refresh status | Task 3, 7 |
| Admin: cancel shipment | Task 3, 7 |
| Admin: download label | Task 3, 7 |
| Admin: duplicate prevention | Task 3 |
| Admin: PAID-only guard | Task 3 |
| Admin order detail page | Task 7 |
| Admin orders list: Detail link | Task 8 |
| Customer: tracking number visible | Task 9 |
| Customer: KE status in Turkish | Task 9 |
| .env.example | Task 10 |
| Unit tests | Task 11 |
| CLAUDE.md update | Task 13 |
| Deployment docs | Task 13 |
| No break to checkout/auth/cart/PayTR | Verified by scope — only additive changes |
```
