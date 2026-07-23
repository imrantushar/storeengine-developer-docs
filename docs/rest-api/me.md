---
title: "Me (Customer Dashboard) API"
description: "Current-user-scoped StoreEngine REST endpoints for headless customer dashboards — profile, password, orders, downloads with signed URLs, addresses, saved payment methods, notifications, and privacy."
sidebar_label: "Me"
keywords: [storeengine rest api, customer dashboard api, me endpoint, headless account, signed download url, customer orders, customer addresses]
---

The `me` controller (`api/me.php`, base `me`) powers a headless customer account dashboard. Every route resolves the user from `get_current_user_id()`, so it works with any WordPress auth mechanism (cookie + nonce, Application Passwords). Per-resource ownership is enforced in each handler — a customer only ever sees their own data.

## Authentication

Logged-in only. Requests without a session return `storeengine_rest_not_logged_in` (401). No special capability is required. Not-owned resources return `404` (never `403`) to avoid leaking existence. See [Authentication](/rest-api/authentication#logged-in-customer-tier-me).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/me` | Profile + stats |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/me` | Update profile |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/me/password` | Change password |
| <span class="api-method api-method--get">GET</span> | `/me/menu` | Dashboard menu items |
| <span class="api-method api-method--get">GET</span> | `/me/orders` | List own orders |
| <span class="api-method api-method--get">GET</span> | `/me/orders/<id>` | Order detail |
| <span class="api-method api-method--post">POST</span> | `/me/orders/<id>/cancel` | Cancel an order |
| <span class="api-method api-method--post">POST</span> | `/me/orders/<id>/pay` | Get the pay URL for an order |
| <span class="api-method api-method--get">GET</span> | `/me/orders/<id>/invoice` | Invoice URL |
| <span class="api-method api-method--get">GET</span> | `/me/downloads` | List downloadable products |
| <span class="api-method api-method--post">POST</span> | `/me/downloads/<permission_id>/sign` | Short-lived signed download URL |
| <span class="api-method api-method--get">GET</span> | `/me/addresses` | Billing + shipping addresses |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/me/addresses/<billing\|shipping>` | Update one address |
| <span class="api-method api-method--get">GET</span> | `/me/payment-methods` | List saved tokens |
| <span class="api-method api-method--delete">DELETE</span> | `/me/payment-methods/<id>` | Delete a token |
| <span class="api-method api-method--post">POST</span> | `/me/payment-methods/<id>/default` | Set default token |
| <span class="api-method api-method--get">GET</span>/<span class="api-method api-method--put">PUT</span> | `/me/notifications` | Notification prefs |
| <span class="api-method api-method--get">GET</span>/<span class="api-method api-method--put">PUT</span> | `/me/privacy` | Consent prefs |
| <span class="api-method api-method--post">POST</span> | `/me/privacy/erase-request` | Request personal-data erasure |

All paths are relative to `/wp-json/storeengine/v1`.

## Profile

### GET /me

Returns the customer profile plus aggregate stats:

```json
{
  "id": 12, "username": "ada", "email": "ada@example.com",
  "first_name": "Ada", "last_name": "Lovelace", "display_name": "Ada Lovelace",
  "avatar_url": "https://…", "user_registered": "2024-02-01 10:00:00",
  "subscribe_to_email": true,
  "stats": { "total_orders": 4, "total_spent": 312.5, "total_downloads": 6 },
  "has_billing_address": true, "has_shipping_address": false
}
```

### PUT/PATCH /me

Accepts any of `first_name`, `last_name`, `display_name`, `email`, `subscribe_to_email`. Email changes are validated and must be unique (`storeengine_rest_email_taken`, 409). Returns the updated profile.

### PUT/PATCH /me/password

| Param | Type | Required |
| --- | --- | --- |
| `current_password` | string | yes |
| `new_password` | string | yes (min 8 chars) |

An incorrect current password returns `storeengine_rest_bad_password` (400). Returns `{ updated: true }`.

## Menu

### GET /me/menu

Returns the dashboard sidebar items (dashboard, orders, downloads, addresses, payment methods, account), sorted by `order`. Payment methods are dropped when no active gateway supports tokenization. Extend it with the `storeengine/rest/me/menu_items` filter — this is how the Subscriptions addon injects its own item.

## Orders

### GET /me/orders

Lists the current customer's orders (drafts excluded).

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | integer | 1 | |
| `per_page` | integer | 10 | Capped at 100. |
| `status` | string | — | Filter by order status. |

Emits `X-WP-Total` / `X-WP-TotalPages`. Each item is a summary (`id`, `status`, `paid_status`, `currency`, `total`, `item_count`, dates, `needs_payment`).

```bash
curl "https://your-store.example/wp-json/storeengine/v1/me/orders?per_page=20" \
  -u "ada:APPLICATION_PASSWORD"
```

### GET /me/orders/&lt;id&gt;

Full order detail — line items, totals breakdown, billing/shipping addresses, payment method, transaction id, and downloadable items. Fires `storeengine/rest/me/order_response` so Pro addons (returns, installments) can inject fields.

### POST /me/orders/&lt;id&gt;/cancel

Cancels an order that is still cancellable. Cancellable statuses default to `pending_payment` and `on_hold` (filter `storeengine/rest/me/cancellable_statuses`). A non-cancellable order returns `409`.

### POST /me/orders/&lt;id&gt;/pay

Returns `{ order_id, pay_url, amount, currency }`. The actual payment happens via the [Checkout pay-order flow](/rest-api/checkout#post-checkoutpay-order); the storefront redirects to `pay_url`. An already-paid order returns `409`.

### GET /me/orders/&lt;id&gt;/invoice

Returns `{ order_id, invoice_url }`. The URL defaults to the order view page and is filterable via `storeengine/rest/me/invoice_url` (invoice addons can return a PDF link).

## Downloads

### GET /me/downloads

Lists the customer's download permissions with `downloads_remaining`, `download_count`, `access_expires`, and `is_expired`. Supports `page` / `per_page` (default 20).

### POST /me/downloads/&lt;permission_id&gt;/sign

Mints a short-lived signed download URL.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `expires_in` | integer | 300 | Clamped to 30–3600 seconds. |

Returns `{ url, expires_in, expires_at, file_name }`. Exhausted or expired permissions return `410`. The signed URL is verified and the remaining-count decremented atomically when the file is actually streamed.

## Addresses

### GET /me/addresses

Returns `{ billing: {…}, shipping: {…} }` with the standard address fields (`first_name`, `last_name`, `company`, `phone`, `email`, `address_1`, `address_2`, `city`, `state`, `country`, `postcode`).

### PUT/PATCH /me/addresses/&lt;type&gt;

`type` is `billing` or `shipping`. Send any subset of the address fields in the JSON body. Returns the updated address.

## Saved payment methods

### GET /me/payment-methods

Lists saved tokens: `{ id, gateway, display_name, is_default }`. Concrete fields depend on the issuing gateway; each item passes through `storeengine/rest/me/payment_method`.

### DELETE /me/payment-methods/&lt;id&gt; · POST /me/payment-methods/&lt;id&gt;/default

Delete or default a token. These fire `storeengine/rest/me/delete_payment_method` and `storeengine/rest/me/set_default_payment_method` respectively, letting the owning gateway addon do the work. To *add* a card, use [Payment Methods](/rest-api/payment-methods).

## Notifications & privacy

- `GET`/`PUT /me/notifications` — `subscribe_to_email`, `order_email`, `marketing_email`.
- `GET`/`PUT /me/privacy` — `data_sharing_consent`, `profiling_consent`.
- `POST /me/privacy/erase-request` — creates and dispatches a WordPress personal-data erasure request. Returns `{ request_id, status: "requested" }`.

## Related

- [Me → Subscriptions](/rest-api/me-subscriptions) — the customer's own subscriptions.
- [Customers API](/rest-api/customers) — the admin-side customer CRUD.
- [Orders object](/data/orders)
