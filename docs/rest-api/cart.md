---
title: "Cart API"
description: "StoreEngine Cart REST endpoints for headless and same-site storefronts — add, update, and remove items, direct checkout, coupons via snapshot, variation lookup, and refreshed HTML fragments."
sidebar_label: "Cart"
keywords: [storeengine rest api, cart api, add to cart, headless cart, direct checkout, cart snapshot, cart fragments]
---

The Cart controller (`api/cart.php`, base `cart`) is a public, headless-friendly REST surface that mirrors StoreEngine's legacy admin-ajax cart actions one-to-one, but speaks JSON. Every mutation returns a consistent **cart snapshot** so a client can re-render immediately without a follow-up `GET`.

For the underlying object model, see the [Cart object](/data/cart).

## Authentication

The cart uses **dual auth** and allows guests:

- **Same-site:** cookie + `X-WP-Nonce`. Guests are permitted (a session cart is created).
- **Cross-origin headless:** send `X-StoreEngine-Pk` (or a `pk` query param). Auth is delegated to the `storeengine/checkout/publishable_key_auth` filter installed by the Instant Checkout addon. Without that addon a keyed request returns `storeengine_cart_pk_unsupported` (401).

See [Authentication](/rest-api/authentication#headless-publishable--embed-key) for details.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/cart` | Full cart snapshot |
| <span class="api-method api-method--delete">DELETE</span> | `/cart` | Clear the cart |
| <span class="api-method api-method--post">POST</span> | `/cart/items` | Add an item |
| <span class="api-method api-method--delete">DELETE</span> | `/cart/items` | Clear the cart (alias) |
| <span class="api-method api-method--post">POST</span> | `/cart/items/direct-checkout` | Clear + add one item (Buy Now) |
| <span class="api-method api-method--patch">PATCH</span> | `/cart/items/<key>` | Update line quantity (0 removes) |
| <span class="api-method api-method--delete">DELETE</span> | `/cart/items/<key>` | Remove a line |
| <span class="api-method api-method--get">GET</span> | `/cart/refresh-fragments` | Re-rendered cart/checkout HTML fragments |
| <span class="api-method api-method--get">GET</span> | `/cart/products/<product_id>/variations` | Variation lookup for a variable product |

All paths are relative to `/wp-json/storeengine/v1`.

## The cart snapshot

Every endpoint returns (or embeds under `snapshot`) the same object:

```json
{
  "items": [
    {
      "item_key": "a1b2c3…",
      "product_id": 42,
      "price_id": 105,
      "name": "Pro License",
      "image": "https://…/thumb.jpg",
      "quantity": 2,
      "price": 49.0,
      "subtotal": 98.0,
      "variation_id": 0,
      "coupon_discount": 10.0,
      "bogo_free_units": 0,
      "bogo_coupon": ""
    }
  ],
  "totals": { "subtotal": 98.0, "shipping": 0, "tax": 0, "discount": 10.0, "total": 88.0 },
  "currency": "USD",
  "needs_shipping": false,
  "needs_payment": true,
  "applied_coupons": [ { "code": "SAVE10", "discount": 10.0 } ],
  "item_count": 2
}
```

The snapshot is filterable via `storeengine/cart/snapshot`, so addons can enrich it (for example, splitting BOGO reward units into a separate free line).

## GET /cart

`GET /wp-json/storeengine/v1/cart`

Returns the current cart snapshot.

```bash
curl https://your-store.example/wp-json/storeengine/v1/cart \
  -H "X-WP-Nonce: $NONCE" --cookie "$WP_COOKIES"
```

## POST /cart/items

`POST /wp-json/storeengine/v1/cart/items`

Adds a product price to the cart.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `price_id` | integer | yes | The price (variation of price/plan) to add. Minimum 1. |
| `quantity` | integer | no | Defaults to 1. |
| `variation_id` | integer | conditional | Required when the product is variable. |
| `product_id` | integer | no | Resolved from `price_id` if omitted. |

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/cart/items \
  -H "Content-Type: application/json" \
  -H "X-StoreEngine-Pk: pk_live_xxx" \
  -d '{ "price_id": 105, "quantity": 2 }'
```

Response is `{ item, product_id, price_id, snapshot }`. Invalid prices, missing products, or a missing required variation return `422` (`storeengine_cart_invalid_price`, `storeengine_cart_variation_required`, etc.).

## POST /cart/items/direct-checkout

`POST /wp-json/storeengine/v1/cart/items/direct-checkout`

The "Buy Now" flow: clears the cart, then adds the single item. Same parameters as `/cart/items`. The response additionally includes a `redirect` URL to the checkout page.

## PATCH /cart/items/&lt;key&gt;

`PATCH /wp-json/storeengine/v1/cart/items/<key>`

Updates the quantity of an existing line, identified by its `item_key`.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `quantity` | integer | yes | Minimum 0. Passing `0` removes the line. |

```bash
curl -X PATCH https://your-store.example/wp-json/storeengine/v1/cart/items/a1b2c3 \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: $NONCE" --cookie "$WP_COOKIES" \
  -d '{ "quantity": 3 }'
```

Returns `{ item, product_id, price_id, message, snapshot }`. When quantity `0` removes the line, `item` is `null`.

## DELETE /cart/items/&lt;key&gt;

`DELETE /wp-json/storeengine/v1/cart/items/<key>`

Removes a single line. Returns `{ removed: true, item_key, item, product_id, price_id, message, snapshot }`. An unknown key returns `storeengine_cart_item_not_found` (404).

## DELETE /cart

`DELETE /wp-json/storeengine/v1/cart` (or `DELETE /cart/items`)

Empties the cart. Returns `{ cleared: true, snapshot }`.

## GET /cart/refresh-fragments

`GET /wp-json/storeengine/v1/cart/refresh-fragments`

Returns a map of re-rendered HTML fragments that the storefront cart script swaps in after a mutation — the order summary, the cart sub-total table, and the checkout payment-method block. Keys are the DOM class names each fragment targets. The controller detects whether the request originated from the cart or checkout page (via the referer) so the shared shipping fragment renders in the correct mode. The set of shortcodes is filterable through `storeengine/cart/refresh_shortcodes`.

## GET /cart/products/&lt;product_id&gt;/variations

`GET /wp-json/storeengine/v1/cart/products/<product_id>/variations`

Returns `{ product_id, variations }` for a variable product, so a client can render the variation selector. A non-existent product returns `404`; a non-variable product returns `storeengine_product_not_variable` (422).

## Coupons

Cart-level coupon apply/remove lives on the [Checkout API](/rest-api/checkout#coupons) (`/checkout/coupon/apply` and `/checkout/coupon/remove`); the resulting discount is reflected in the cart snapshot's `applied_coupons` and `totals.discount`.

## Related

- [Checkout API](/rest-api/checkout) — place an order from the cart.
- [Mini cart](/rest-api/analytics-and-logs#mini-cart) — lightweight header cart summary.
- [Cart object](/data/cart) — the underlying data model.
