# Campaign System Design

## Goal

Add an admin-managed campaign system for a "2 al 2 bedava" promotion. When active, the cart/order engine automatically charges the two most expensive items in each group of four eligible units and marks the two cheapest units as gifts.

## Scope

- Admin can create, update, list, and deactivate campaigns.
- Initial campaign type is `BUY_2_GET_2`.
- Admin can toggle whether the campaign is active and whether it appears as a homepage banner.
- Public homepage shows the active banner campaign.
- Cart and order totals are calculated server-side so PayTR receives the discounted amount.
- Order history preserves gift/discount information per order item.

## Data Model

Add `Campaign` with title, slug, description, type, active flags, optional dates, banner copy, and button fields. Add discount snapshot fields to `OrderItem`: `discountAmount`, `isGift`, and `campaignId`.

The first version applies campaigns to all active products. Category/product targeting is intentionally out of scope.

## Calculation Rule

For every active `BUY_2_GET_2` campaign:

1. Expand cart lines into individual product units.
2. Sort units by price descending.
3. For each complete group of four units, charge the first two units and discount the last two units.
4. Leave incomplete units outside the group at full price.

Example: prices `100, 90, 50, 30` produce paid total `190` and discount `80`.

## API Design

- `GET /api/campaigns/active-banner` returns the active campaign banner or `null`.
- `GET /api/admin/campaigns` lists campaigns.
- `POST /api/admin/campaigns` creates a campaign.
- `GET /api/admin/campaigns/:id` returns one campaign.
- `PATCH /api/admin/campaigns/:id` updates a campaign.
- `DELETE /api/admin/campaigns/:id` deactivates a campaign.

## UI Design

Admin sidebar gains `Kampanyalar`. The page contains a compact campaign form and campaign list. Public homepage shows the campaign banner between hero and categories when `showOnHomepage` is true.

## Testing

Add API/unit tests for the promotion calculation and admin/public campaign endpoints. Existing order creation tests should verify `Order.totalAmount` uses the discounted total and `OrderItem` stores gift metadata.
