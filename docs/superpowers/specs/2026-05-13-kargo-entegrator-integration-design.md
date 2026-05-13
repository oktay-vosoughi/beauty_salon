# Kargo Entegratör Integration — Design Spec

**Date:** 2026-05-13  
**Status:** Approved  
**Scope:** Add cargo shipment creation and tracking to the existing Turkish e-commerce project via Kargo Entegratör REST API.

---

## 1. Goal

When an order is marked PAID, an admin must be able to create a cargo shipment record via the Kargo Entegratör API directly from the admin panel. The admin can then track status, refresh it, download a label PDF, or cancel the shipment. Customers see their tracking number and status in their order history.

---

## 2. API Reference (Kargo Entegratör)

**Base URL:** `https://app.kargoentegrator.com`  
**Auth:** `Authorization: Bearer {KARGO_ENTEGRATOR_API_KEY}` on every request  
**Content-Type:** `Accept: application/json`

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/shipments` | Create shipment |
| GET | `/api/shipments/{id}` | Get shipment detail / current status |
| DELETE | `/api/shipments/{id}` | Cancel/delete shipment |
| GET | `/api/print-pdf?shipments[]={id}` | Download label as PDF |
| GET | `/api/helpers/cargo-companies` | List available cargo companies |
| GET | `/api/helpers/check-connection` | Verify API key is valid |
| GET | `/api/integration/cargos` | List configured cargo integrations |
| GET | `/api/settings/warehouses` | List configured warehouses |

### POST /api/shipments — Request Body

```json
{
  "cargo_integration_id": 1,
  "warehouse_id": 2,
  "customer": {
    "name": "Zeynep",
    "surname": "Kara",
    "phone": "0555000000",
    "email": "zeynep@example.com",
    "country": "TÜRKIYE",
    "postcode": "34000",
    "city": "Istanbul",
    "district": "Kadikoy",
    "address": "Örnek Mah. No:1"
  },
  "payment_type": "credit_card",
  "package_type": "box",
  "payor_type": "sender",
  "is_pay_at_door": false,
  "total": 100.50,
  "currency": "TRY",
  "desi": 3,
  "platform_id": 1,
  "platform_d_id": 42,
  "notification_url": "https://yourdomain.com/api/webhooks/kargo",
  "note": "",
  "lines": [
    {
      "quantity": 2,
      "platform_id": 1,
      "image": "https://example.com/product.jpg",
      "sku": "urun-slug"
    }
  ]
}
```

---

## 3. Data Mapping (Our Order → KE Shipment)

| KE Field | Source | Notes |
|----------|--------|-------|
| `cargo_integration_id` | `KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID` env | Set once from panel |
| `warehouse_id` | `KARGO_ENTEGRATOR_WAREHOUSE_ID` env | Set once from panel |
| `customer.name` | `shippingAddressJson.fullName` split | Everything before the last space |
| `customer.surname` | `shippingAddressJson.fullName` split | The last word |
| `customer.phone` | `shippingAddressJson.phone` | Used directly |
| `customer.email` | `User.email` | Fetched from User table (not in snapshot) |
| `customer.country` | hardcoded `"TÜRKIYE"` | All orders are domestic |
| `customer.postcode` | `shippingAddressJson.postalCode` | Used directly |
| `customer.city` | `shippingAddressJson.city` | Used directly |
| `customer.district` | `shippingAddressJson.district` | Used directly |
| `customer.address` | `shippingAddressJson.line1` | Used directly |
| `payment_type` | hardcoded `"credit_card"` | All orders paid via PayTR |
| `package_type` | hardcoded `"box"` | Beauty products are always boxed |
| `payor_type` | hardcoded `"sender"` | Store pays shipping |
| `is_pay_at_door` | hardcoded `false` | Already paid via PayTR |
| `total` | `Order.totalAmount` | Cast to number |
| `currency` | hardcoded `"TRY"` | |
| `desi` | `KARGO_ENTEGRATOR_DEFAULT_DESI` env | Default: `3` |
| `platform_d_id` | `Order.id` | Our internal order ID |
| `note` | admin-provided at creation time | Optional free text |
| `lines[].quantity` | `OrderItem.quantity` | |
| `lines[].sku` | `OrderItem.titleSnapshot` | Product title as SKU |

---

## 4. Database Changes

### 4a. New Shipment Model

```prisma
model Shipment {
  id                 Int       @id @default(autoincrement())
  orderId            Int       @unique
  order              Order     @relation(fields: [orderId], references: [id])
  keShipmentId       Int?                         // KE's internal shipment ID
  cargoIntegrationId Int?                         // Which cargo integration used
  cargoCompanyName   String?                      // e.g. "Aras Kargo"
  trackingNumber     String?                      // Barcode / takip numarası
  status             String    @default("NEW")    // KE status string
  note               String?   @db.Text
  rawResponseJson    Json?                        // Full KE response for debugging
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  syncedAt           DateTime?                    // Last status sync time
}
```

### 4b. Add Shipment relation to Order

```prisma
model Order {
  // ... existing fields ...
  shipment  Shipment?
}
```

### 4c. Extend OrderStatus enum

Add `SHIPPED` and `DELIVERED` values (already referenced in frontend but missing from schema):

```prisma
enum OrderStatus {
  PENDING
  PAID
  SHIPPED    // NEW
  DELIVERED  // NEW
  CANCELLED
  REFUNDED
}
```

---

## 5. Environment Variables

Added to `.env.example`:

```env
# Kargo Entegratör
KARGO_ENTEGRATOR_API_KEY=""
KARGO_ENTEGRATOR_BASE_URL="https://app.kargoentegrator.com"
KARGO_ENTEGRATOR_WAREHOUSE_ID=""
KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID=""
KARGO_ENTEGRATOR_DEFAULT_DESI="3"
```

**What to fill in (from https://app.kargoentegrator.com):**
1. `KARGO_ENTEGRATOR_API_KEY` — Settings → API → your Bearer token
2. `KARGO_ENTEGRATOR_WAREHOUSE_ID` — Settings → Warehouses → ID of your warehouse
3. `KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID` — Integrations → Cargo → ID of your cargo company integration

---

## 6. Backend Architecture

### 6a. Service: `apps/api/src/services/kargoEntegrator.ts`

Pure HTTP client with no Express coupling:

```
createShipment(order, items, user, note?)  → { keShipmentId, trackingNumber, status, rawResponse }
getShipment(keShipmentId)                  → { status, trackingNumber, rawResponse }
deleteShipment(keShipmentId)               → void
printLabel(keShipmentId)                   → Buffer (PDF bytes)
listCargoCompanies()                       → CargoCompany[]
checkConnection()                          → boolean
```

Error handling: throws typed `KargoEntegratorError` with `message` and `statusCode`. Never logs the API key.

### 6b. Admin Routes: `apps/api/src/routes/admin/shipments.ts`

Mounted as `/api/admin/orders/:orderId/shipment` in `app.ts`, behind `requireAdmin` middleware.

| Method | Path | Behaviour |
|--------|------|-----------|
| POST | `/` | Validate order is PAID; prevent duplicate (400 if Shipment already exists); call KE; store Shipment; update Order.status → SHIPPED |
| GET | `/` | Return stored Shipment row |
| POST | `/refresh` | Call KE getShipment; update Shipment.status + syncedAt |
| DELETE | `/` | Call KE deleteShipment; delete Shipment row; revert Order.status → PAID |
| GET | `/label` | Call KE printLabel; pipe PDF bytes with `Content-Type: application/pdf` |

---

## 7. Frontend — Admin

### 7a. New Admin Order Detail Page

`apps/web/src/app/admin/siparisler/[id]/page.tsx` (server) + `AdminOrderDetailClient.tsx` (client)

**Sections:**
1. Order header (ID, date, status badge)
2. Customer info (name, email, phone from user)
3. Shipping address
4. Order items table (product, qty, unit price)
5. Payment info (provider, status, merchantOid, amount)
6. **Shipment panel** (new)

**Shipment panel states:**
- **No shipment:** Form with `note` field + "Kargo Oluştur" button
- **Creating:** Spinner, button disabled
- **Shipment exists:** 
  - Tracking number (copyable)
  - Status badge (color-coded by KE status)
  - Last synced timestamp
  - "Durumu Yenile" button
  - "Etiket İndir" button (opens PDF)
  - "Kargıyu İptal Et" button (red, requires `window.confirm`)
- **API error:** Inline error message in Turkish

### 7b. Admin Order List

Add a cargo status indicator (small badge) to each row in `AdminOrdersClient.tsx` — visible at a glance whether a shipment has been created.

---

## 8. Frontend — Customer

`apps/web/src/app/hesabim/siparisler/page.tsx` — extend each order card:

- If `order.shipment.trackingNumber` exists: show tracking number + status in Turkish
- Status label mapping (KE status → Turkish):
  - `NEW` → "Hazırlanıyor"
  - `SHIPPED` / `OUT_FOR_DELIVERY` → "Kargoda"
  - `DELIVERED` / `COMPLETED` → "Teslim Edildi"
  - `RETURNING` / `RETURNED` → "İade Sürecinde"
  - others → "İşlemde"
- Never expose raw API errors or internal IDs

---

## 9. Error Handling

- **Missing env vars at startup:** Service constructor throws with clear message listing which vars are missing.
- **KE API 4xx:** Return clean Turkish error message to admin UI. Log full response server-side.
- **KE API 5xx / network error:** Return 502 to admin. Log error. Do not leave partial DB state.
- **Duplicate shipment:** 400 with message "Bu sipariş için zaten kargo oluşturulmuş."
- **Order not PAID:** 400 with "Ödeme alınmadan kargo oluşturulamaz."
- **Label download failure:** Return 502, admin sees "Etiket alınamadı, lütfen tekrar deneyin."

---

## 10. Files To Create / Modify

| Action | File |
|--------|------|
| CREATE | `apps/api/src/services/kargoEntegrator.ts` |
| CREATE | `apps/api/src/routes/admin/shipments.ts` |
| CREATE | `apps/api/prisma/migrations/…/migration.sql` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/page.tsx` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/AdminOrderDetailClient.tsx` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/ShipmentPanel.tsx` |
| CREATE | `apps/web/src/app/admin/siparisler/[id]/page.module.css` |
| MODIFY | `apps/api/prisma/schema.prisma` — add Shipment model + OrderStatus enum values |
| MODIFY | `apps/api/src/app.ts` — mount admin/shipments router |
| MODIFY | `apps/web/src/app/admin/siparisler/AdminOrdersClient.tsx` — add shipment badge + detail link |
| MODIFY | `apps/web/src/app/hesabim/siparisler/page.tsx` — show tracking info |
| MODIFY | `.env.example` — add KE env vars |

---

## 11. Manual Test Checklist

1. Set KE env vars in `.env` (real or test credentials from panel)
2. Create an order and complete payment via PayTR so Order.status = PAID
3. Open `/admin/siparisler` → find the paid order → click to open detail
4. In Shipment panel: click "Kargo Oluştur" → spinner appears → success: tracking number shown
5. Click "Durumu Yenile" → status updates, syncedAt refreshes
6. Click "Etiket İndir" → PDF opens/downloads
7. Open `/hesabim/siparisler` as the customer → tracking number and status visible on order card
8. Try "Kargo Oluştur" again on same order → should get "Bu sipariş için zaten kargo oluşturulmuş." error
9. Open an order with status PENDING → "Kargo Oluştur" should be disabled or show "Ödeme alınmadan kargo oluşturulamaz."
10. Click "Kargıyu İptal Et" → confirm dialog → shipment deleted, order reverts to PAID
11. Try creating shipment with missing env var → server logs clear error, admin sees 502
12. Verify no other pages (checkout, cart, navbar, auth) are affected

---

## 12. Out of Scope

- Return shipment creation from admin panel (KE `/api/returneds` exists but not requested)
- Kargo Entegratör webhook ingestion (status push from KE; polling via "Durumu Yenile" is sufficient for now)
- Automatic shipment creation on payment callback (manual admin action is safer for a small business)
- Customer-initiated returns
