---
title: "Checkout API"
description: "StoreEngine Checkout REST endpoints — fetch checkout state, live-update address and shipping, place an order, pay an existing order, create payment intents, and apply or remove coupons."
sidebar_label: "Checkout"
keywords: [storeengine rest api, checkout api, place order, payment intent, headless checkout, embedded checkout, checkout coupon]
---

The Checkout controller (`api/checkout.php`, base `checkout`) is the single REST surface behind both the traditional `/checkout/` page and the embedded/instant checkout React app. It exposes the full checkout lifecycle: read state, live-recalculate as the shopper types, place an order, pay an existing order, and create gateway payment intents.

## Authentication

Like the [Cart](/rest-api/cart), checkout uses **dual auth** and allows guests:

- **Same-site:** cookie + `X-WP-Nonce`.
- **Cross-origin embed:** send `X-StoreEngine-Embed-Key` (preferred) or `X-StoreEngine-Pk` (legacy), or a `pk` query param. Auth is delegated to `storeengine/checkout/publishable_key_auth`, installed by the Embeddable Checkout addon. Without it, a keyed request returns `storeengine_checkout_pk_unsupported` (401).

CORS headers are emitted only for keyed requests whose origin matched the addon's allow-list.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/checkout/state` | Full checkout state snapshot |
| <span class="api-method api-method--post">POST</span> | `/checkout/update` | Live update address/shipping, recalc totals |
| <span class="api-method api-method--post">POST</span> | `/checkout/place` | Place the order |
| <span class="api-method api-method--get">GET</span> | `/checkout/states` | States/provinces for a country |
| <span class="api-method api-method--post">POST</span> | `/checkout/pay-order` | Pay an existing pending/failed order |
| <span class="api-method api-method--post">POST</span> | `/checkout/payment-intent/<gateway_id>` | Create a client-side payment intent |
| <span class="api-method api-method--post">POST</span> | `/checkout/coupon/apply` | Apply a coupon |
| <span class="api-method api-method--post">POST</span> | `/checkout/coupon/remove` | Remove a coupon |

All paths are relative to `/wp-json/storeengine/v1`. Every mutation accepts an optional `session_id` used by the embedded flow to resolve and hydrate a cross-origin cart.

## GET /checkout/state

`GET /wp-json/storeengine/v1/checkout/state`

Returns everything the checkout UI needs to render:

```json
{
  "cart": { "items": [ … ], "needs_shipping": true, "needs_payment": true, "currency": "USD" },
  "totals": { "subtotal": 98, "shipping": 5, "tax": 8.24, "discount": 10, "total": 101.24 },
  "available_gateways": [ { "id": "stripe", "title": "Card", "publishable_key": "pk_…" } ],
  "order_id": 0,
  "declared_items": [],
  "selection": [],
  "checkout_fields": [ … ],
  "saved_fields": { "billing_email": "a@b.co", … },
  "branding": { "logo_url": "…", "store_name": "…", "site_url": "…" },
  "applied_coupons": [ { "code": "SAVE10", "discount": 10 } ],
  "shipping_rates": [ { "id": "flat_rate:1", "label": "Flat rate", "cost": 5, "tax": 0 } ],
  "chosen_shipping_method": "flat_rate:1",
  "place_order_label": "Place order",
  "consent_checkboxes": []
}
```

The whole snapshot is filterable via `storeengine/checkout/state_snapshot`, and `totals` via `storeengine/api/checkout/totals`.

## POST /checkout/update

`POST /wp-json/storeengine/v1/checkout/update`

Pushes the current form values onto the cart, recalculates shipping/tax, and returns a refresh payload. Called on every debounced field change in the React checkout.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `fields` | object | yes | Checkout field values (billing/shipping address, `shipping_method`, etc.). |
| `session_id` | string | no | Embed session id. |

The response carries `refresh` (whether the summary should re-render — set whenever any total moved), other legacy refresh keys, and an embedded `snapshot`. Field-level validation errors thrown by hooks surface as `422`.

## POST /checkout/place

`POST /wp-json/storeengine/v1/checkout/place`

Places the order against the current cart.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `fields` | object | yes | Final checkout field values (address, notes, consent). |
| `payment_method` | string | yes | Selected gateway id (e.g. `stripe`, `cod`). |
| `payment_payload` | object | no | Gateway-specific data from the client adapter (intent id, token, etc.). |
| `session_id` | string | no | Embed session id. |

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/checkout/place \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: $NONCE" --cookie "$WP_COOKIES" \
  -d '{
        "fields": {
          "billing_first_name": "Ada", "billing_email": "ada@example.com",
          "billing_country": "US", "billing_state": "CA",
          "shipping_method": "flat_rate:1"
        },
        "payment_method": "stripe",
        "payment_payload": { "payment_intent_id": "pi_123" }
      }'
```

The cart is recalculated against the submitted address before charging, so the amount charged matches the amount shown. The response is the gateway's result — typically `{ result: 'success', redirect: '…', order_id: N }`. Same-site pages follow `redirect`; SPA clients navigate themselves. Gateway addons can hook `storeengine/checkout/before_place_order_payload` (and the per-gateway variant) to persist intent/transaction ids before the order is placed.

## POST /checkout/pay-order

`POST /wp-json/storeengine/v1/checkout/pay-order`

Charges a gateway against an **existing** pending/failed order (dashboard "Pay" and guest-pay links).

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `order_id` | integer | yes | The order to pay. |
| `payment_method` | string | yes | Gateway id. |
| `order_key` | string | no | Guest-pay key; authorizes payment without ownership. |
| `payment_payload` | object | no | Gateway payload. |

Authorization matches the order-pay page: the caller must own the order, hold the `pay_for_order` capability, or supply a matching `order_key`. The selected gateway is re-checked against the order (so a gateway that cannot handle a subscription renewal is rejected). Returns the gateway's `process_payment()` result plus `order_id`.

## POST /checkout/payment-intent/&lt;gateway_id&gt;

`POST /wp-json/storeengine/v1/checkout/payment-intent/<gateway_id>`

Creates a client-side payment intent. Two flows:

1. **New checkout** — no `order_id`. Requires a non-empty cart; syncs the address, snapshots the cart onto a draft order, and asks the gateway to build the intent.
2. **Pay existing order** — pass `order_id` (caller must be authorized to pay it). The order's totals are authoritative; no cart sync.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `order_id` | integer | no | Switches to the pay-existing-order flow. |
| `session_id` | string | no | Embed session id. |

The gateway must implement `GatewayAdapterInterface::create_intent()`, or an addon must answer the `storeengine/checkout/create_intent` filter. A gateway with no intent support returns `storeengine_checkout_intent_unsupported` (422). The response is the gateway's intent object (for example `{ client_secret, intent_id }`).

## Coupons {#coupons}

### POST /checkout/coupon/apply

`POST /wp-json/storeengine/v1/checkout/coupon/apply`

| Param | Type | Required |
| --- | --- | --- |
| `coupon_code` | string | yes |

Returns `{ applied: true, code, snapshot }`. An empty code or an invalid coupon returns `422`.

### POST /checkout/coupon/remove

`POST /wp-json/storeengine/v1/checkout/coupon/remove`

Same body. Returns `{ removed: true, code, snapshot }`.

## GET /checkout/states

`GET /wp-json/storeengine/v1/checkout/states?country_code=US`

Returns `{ country_code, states, label, required }` for a country's state/province selector.

## Related

- [Cart API](/rest-api/cart) — build the cart the checkout consumes.
- [Payment Methods](/rest-api/payment-methods) — save cards outside a checkout.
- [Orders object](/data/orders) — the order this flow produces.
