---
title: "REST API Overview"
description: "Introduction to the StoreEngine REST API — base URL, the storeengine/v1 namespace, custom controllers versus native CPT routes, response envelopes, pagination headers, and batch endpoints."
sidebar_label: "Overview"
keywords: [storeengine rest api, storeengine/v1, wordpress rest api, headless commerce, rest namespace, batch endpoints, pagination headers]
---

StoreEngine ships a full REST API under the `storeengine/v1` namespace. It powers the embedded/instant checkout, the headless customer dashboard, the admin React apps (orders, products, analytics, settings), and any external integration you build. Every route lives beneath a single base URL and follows standard WordPress REST conventions, so if you have worked with the WP REST API before, you already know most of the rules here.

This page is the landing map: the base URL, how routes are registered, the response conventions shared across controllers, and an index of every controller with its base path and auth level.

## Base URL and namespace

All routes are served under the `storeengine/v1` namespace:

```
https://your-store.example/wp-json/storeengine/v1/…
```

The namespace is declared once on the base controller (`STOREENGINE_PLUGIN_SLUG . '/v1'`, where the slug is `storeengine`) and reused everywhere, including the native custom-post-type routes. If your site uses plain permalinks, the same routes are reachable via the query form `?rest_route=/storeengine/v1/…`.

## Two registration mechanisms

Routes in the `storeengine/v1` namespace come from two distinct sources. Knowing which one you are calling explains the response shape and the available query parameters.

### A. Custom controllers

Most endpoints are custom controllers under `includes/api/`, each extending `AbstractRestApiController` (which itself extends `WP_REST_Controller`). They are booted from `StoreEngine\API::init()` in `includes/api.php`, and every controller self-registers its routes on the `rest_api_init` hook via its own `register_routes()` method. Cart, checkout, orders, the `me` dashboard, customers, shipping, taxes, settings, analytics, and logs are all custom controllers.

The shared base controller gives every custom controller:

- **Batch operations** — a `batch_items()` handler for bulk create/update/delete on collection endpoints that opt in.
- **Batch schema** — `get_public_batch_schema()` describing the `create`/`update`/`delete` envelope.
- **A batch limit** — `check_batch_limit()` caps a single batch request at 100 items, filterable via `storeengine/rest_batch_items_limit`.
- **Pagination headers** — `X-WP-Total` and `X-WP-TotalPages` on list responses, plus `Link` headers for `prev`/`next`.
- **Meta include/exclude** — `include_meta` / `exclude_meta` request params to trim the `meta_data` array.
- **HATEOAS links** — `_links.self` and `_links.collection` via `prepare_links()`.

### B. Native custom-post-type routes

[Products](/rest-api/products) and [coupons](/rest-api/coupons) are **not** custom controllers. They are registered as WordPress custom post types (`storeengine_product`, `storeengine_coupon`) with `show_in_rest => true` in `includes/database.php`, reusing WordPress core's `WP_REST_Posts_Controller` — but under the `storeengine/v1` namespace via `rest_namespace`. Product categories and tags follow the same pattern with `WP_REST_Terms_Controller`.

StoreEngine only *extends* these native routes: `product.php` filters the product response (`rest_prepare_storeengine_product`), persists custom fields on insert, and adds a handful of auxiliary stock/inventory routes; `coupon.php` validates coupon payloads on `rest_pre_insert_storeengine_coupon`. Because these are core controllers, they support the standard WordPress collection parameters (`per_page`, `page`, `search`, `orderby`, `order`, `status`, `context`, and so on) out of the box.

## Response conventions

- **Success** returns the resource (or a small result object) as JSON with a `2xx` status. List endpoints return a JSON array.
- **Errors** are serialized `WP_Error` objects: `{ "code": "…", "message": "…", "data": { "status": 4xx } }`. See [Authentication](/rest-api/authentication#error-shape) for the exact shape.
- **Pagination** — list endpoints emit `X-WP-Total` (total matching rows) and `X-WP-TotalPages` (total pages) response headers. Page through with `page` and `per_page`.
- **Money** values are returned as floats in the store's base currency; each cart/checkout/order payload also carries a `currency` code.

## Batch endpoints

Collection controllers that opt into batching accept a single `POST` with `create`, `update`, and `delete` arrays and fan them out server-side:

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/taxes/batch \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
        "create": [ { "rate": "8.25", "name": "TX State" } ],
        "update": [ { "id": 12, "rate": "7.00" } ],
        "delete": [ 15, 16 ]
      }'
```

The response mirrors the request with a per-item result (or per-item `error`) for each of the three arrays. A batch may contain at most 100 items in total; exceeding that returns `rest_request_entity_too_large` (413). Raise or lower the cap with the `storeengine/rest_batch_items_limit` filter.

## Controller index

| Controller | Base path | Auth level | Reference |
| --- | --- | --- | --- |
| Cart | `/cart` | Public + publishable key | [Cart](/rest-api/cart) |
| Checkout | `/checkout` | Public + embed key | [Checkout](/rest-api/checkout) |
| Mini cart | `/mini-cart` | Public | [Analytics & Logs](/rest-api/analytics-and-logs#mini-cart) |
| Me (customer dashboard) | `/me` | Logged-in | [Me](/rest-api/me) |
| Me → Subscriptions | `/me/subscriptions` | Logged-in (addon) | [Me Subscriptions](/rest-api/me-subscriptions) |
| Payment methods | `/payment-methods` | Logged-in | [Payment Methods](/rest-api/payment-methods) |
| Storefront auth | `/auth` | Public | [Storefront Auth](/rest-api/storefront-auth) |
| Orders | `/order` | `manage_options` | [Orders](/rest-api/orders) |
| Products | `/storeengine_product` | CPT caps | [Products](/rest-api/products) |
| Product stock/inventory | `/products`, `/inventory` | `edit_storeengine_products` | [Products](/rest-api/products#stock-and-inventory) |
| Coupons | `/storeengine_coupon` | CPT caps | [Coupons](/rest-api/coupons) |
| Customers | `/customer` | `manage_options` | [Customers](/rest-api/customers) |
| Subscriptions (admin) | `/subscription` | `manage_options` | [Subscriptions](/rest-api/subscriptions) |
| Payment | `/payment` | Order-scoped / admin | [Payments](/rest-api/payments) |
| Shipping | `/shipping` | `manage_options` | [Shipping](/rest-api/shipping) |
| Taxes | `/taxes` | `manage_options` | [Taxes](/rest-api/taxes) |
| Settings | `/settings` | `manage_options` | [Settings](/rest-api/settings) |
| Analytics | `/analytics` | `manage_options` | [Analytics & Logs](/rest-api/analytics-and-logs#store-analytics) |
| Product analytics | `/product-analytics` | `manage_options` | [Analytics & Logs](/rest-api/analytics-and-logs#product-analytics) |
| Logs | `/logs` | Public read / admin write | [Analytics & Logs](/rest-api/analytics-and-logs#logs) |
| Email log | `/email-logs` | `manage_options` | [Analytics & Logs](/rest-api/analytics-and-logs#email-logs) |
| Bundle sync | `/bundle` | `manage_options` | [Analytics & Logs](/rest-api/analytics-and-logs#bundle-sync) |

## Next steps

- Read [Authentication](/rest-api/authentication) to pick the right auth mechanism for your client.
- Building headless storefronts? Start with [Cart](/rest-api/cart) and [Checkout](/rest-api/checkout).
- Adding your own routes? See [Extending the API](/rest-api/extending).
