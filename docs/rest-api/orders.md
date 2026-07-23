---
title: "Orders API"
description: "Admin StoreEngine REST endpoints for orders — list, create, read, update, and delete orders, manage order line items, and look up country states. Requires manage_options."
sidebar_label: "Orders"
keywords: [storeengine rest api, orders api, create order, order line items, order crud, admin orders, order item]
---

The Orders controller (`api/orders.php`, base `order`) is the admin-facing CRUD surface for orders. It uses the shared `OrderSchema` trait — the most complete schema in the API, covering line items and billing/shipping address objects.

Customers manage their *own* orders through the [Me API](/rest-api/me#orders) instead; this controller is for store staff.

## Authentication

Admin only. Every route calls `Helper::check_rest_user_cap( 'manage_options' )` and returns `storeengine_rest_forbidden_context` (401/403) otherwise. Use cookie + nonce in wp-admin or Application Passwords for external clients. See [Authentication](/rest-api/authentication#admin-routes--capability-gates).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/order` | List orders |
| <span class="api-method api-method--post">POST</span> | `/order` | Create an order |
| <span class="api-method api-method--get">GET</span> | `/order/<id>` | Get one order |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/order/<id>` | Update an order |
| <span class="api-method api-method--delete">DELETE</span> | `/order/<id>` | Delete an order |
| <span class="api-method api-method--post">POST</span> | `/order/<id>/order_item` | Add a line item |
| <span class="api-method api-method--delete">DELETE</span> | `/order/<id>/order_item` | Remove line item(s) |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/order/<id>/order_item/<item_id>` | Update a line item |
| <span class="api-method api-method--get">GET</span> | `/order/get_states/<cc>` | States for a country |

All paths are relative to `/wp-json/storeengine/v1`.

## GET /order

`GET /wp-json/storeengine/v1/order`

Lists orders using the standard collection parameters (`page`, `per_page`, `search`, `orderby`, `order`, and status/date filters exposed by the order schema's collection params). Emits `X-WP-Total` / `X-WP-TotalPages`.

```bash
curl "https://your-store.example/wp-json/storeengine/v1/order?per_page=20&page=1" \
  -u "admin:APPLICATION_PASSWORD"
```

## POST /order

`POST /wp-json/storeengine/v1/order`

Creates an order from the order schema. Key parts of the payload:

- **`status`** — order status slug (see [Order statuses](/data/order-statuses)).
- **`currency`**, **`customer_id`**, **`payment_method`**, **`customer_note`**.
- **`billing`** / **`shipping`** — address objects (`first_name`, `last_name`, `company`, `address_1`, `address_2`, `city`, `state`, `postcode`, `country`, `email`, `phone`).
- **`line_items`** — array of items, each referencing a `price_id`/`product_id` and `quantity`.
- **`meta_data`** — arbitrary key/value pairs.

Fetch the exact, current schema at runtime with an `OPTIONS` request:

```bash
curl -X OPTIONS https://your-store.example/wp-json/storeengine/v1/order \
  -u "admin:APPLICATION_PASSWORD"
```

## GET /order/&lt;id&gt;

`GET /wp-json/storeengine/v1/order/<id>`

Returns a single order. Accepts the `context` parameter (`view` default, `edit`). A missing order returns `404`.

## PUT/PATCH /order/&lt;id&gt;

`PUT /wp-json/storeengine/v1/order/<id>`

Updates an order. Accepts the same fields as create. Returns the updated order.

## DELETE /order/&lt;id&gt;

`DELETE /wp-json/storeengine/v1/order/<id>`

Deletes the order.

## Order line items

Line items have their own routes. The order must be editable — an order that is no longer editable (for example, completed) returns `order-not-editable` (400).

### POST /order/&lt;id&gt;/order_item

Adds a line item to an existing order. Body follows the item schema (product/price reference, quantity, etc.).

### DELETE /order/&lt;id&gt;/order_item

Removes one or more line items from the order.

### PUT/PATCH /order/&lt;id&gt;/order_item/&lt;item_id&gt;

Updates a specific line item (e.g. quantity).

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/order/1187/order_item \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "price_id": 105, "quantity": 1 }'
```

## GET /order/get_states/&lt;cc&gt;

`GET /wp-json/storeengine/v1/order/get_states/US`

Returns the states/provinces for a two-letter ISO-3166 country code, for building address forms in an order editor.

## Batch

Orders inherit the shared [batch endpoint](/rest-api/overview#batch-endpoints) behavior from the base controller for bulk create/update/delete, subject to the 100-item limit.

## Related

- [Orders object](/data/orders) — the full order data model, statuses, and totals.
- [Order statuses](/data/order-statuses)
- [Me API — orders](/rest-api/me#orders) — the customer-facing view.
