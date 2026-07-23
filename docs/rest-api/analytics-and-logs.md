---
title: "Analytics, Logs & Utility APIs"
description: "StoreEngine REST endpoints for store analytics, per-product analytics, system and email logs, the public mini-cart summary, and bundle purchaser synchronization."
sidebar_label: "Analytics & Logs"
keywords: [storeengine rest api, analytics api, product analytics, logs api, email logs, mini cart, bundle sync]
---

This page groups the reporting and utility controllers: store analytics, per-product analytics, system logs, email logs, the public mini-cart, and bundle purchaser sync. Most are admin-gated (`manage_options`); the mini-cart and log listing are public.

All paths are relative to `/wp-json/storeengine/v1`.

## Store analytics {#store-analytics}

`analytics.php`, base `analytics`, admin-only.

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/analytics` | Store-wide metrics over a date range |

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `from` | string | 1 month ago | Range start (`Y-m-d`). |
| `to` | string | today | Range end (`Y-m-d`). |
| `compare` | integer | 30 | Compare against the previous N days. |
| `currency` | string | base currency | ISO-4217 filter. `currencies_in_period` in the response lists the currencies that actually have orders in range. |

```bash
curl "https://your-store.example/wp-json/storeengine/v1/analytics?from=2026-06-01&to=2026-06-30" \
  -u "admin:APPLICATION_PASSWORD"
```

## Product analytics {#product-analytics}

`product-analytics.php`, base `product-analytics`, admin-only.

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/product-analytics` | Per-product performance list |
| <span class="api-method api-method--get">GET</span> | `/product-analytics/<id>` | Analytics for one product |

List parameters: `from`, `to` (`Y-m-d`), `currency`, `search`, `page` (default 1), `per_page` (default 20, max 100). The single-product route takes the same `from`/`to` range.

```bash
curl "https://your-store.example/wp-json/storeengine/v1/product-analytics?search=license&per_page=20" \
  -u "admin:APPLICATION_PASSWORD"
```

## Logs {#logs}

`logs.php`, base `logs`. **Reading is public**; mutating and settings require `manage_options`.

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/logs` | List log entries | Public |
| <span class="api-method api-method--delete">DELETE</span> | `/logs` | Delete entries by id | `manage_options` |
| <span class="api-method api-method--get">GET</span> | `/logs/settings` | Read cleanup settings | `manage_options` |
| <span class="api-method api-method--post">POST</span> | `/logs/settings` | Save cleanup settings | `manage_options` |

`GET /logs` supports `page`, `per_page`, and a `status` filter. `DELETE /logs` requires an `ids` array:

```bash
curl -X DELETE https://your-store.example/wp-json/storeengine/v1/logs \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "ids": [12, 13, 14] }'
```

## Email logs {#email-logs}

`email-log.php`, base `email-logs`, admin-only.

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/email-logs` | List email log entries |
| <span class="api-method api-method--get">GET</span> | `/email-logs/<id>` | Get one entry |
| <span class="api-method api-method--delete">DELETE</span> | `/email-logs/<id>` | Delete one entry |
| <span class="api-method api-method--get">GET</span> | `/email-logs/settings` | Read retention settings |
| <span class="api-method api-method--post">POST</span> | `/email-logs/settings` | Save retention settings |
| <span class="api-method api-method--post">POST</span> | `/email-logs/purge` | Purge now |
| <span class="api-method api-method--get">GET</span> | `/email-logs/resendable-types` | Email types that can be resent |
| <span class="api-method api-method--post">POST</span> | `/email-logs/<id>/resend` | Resend a logged email |

`POST /email-logs/settings` requires `retention_days_sent` and `retention_days_failed` (both integers).

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/email-logs/1042/resend \
  -u "admin:APPLICATION_PASSWORD"
```

## Mini cart {#mini-cart}

`mini-cart.php`, base `mini-cart`, **public**.

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/mini-cart/current` | Lightweight header-cart summary |

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `render` | boolean | true | When `true`, includes rendered `cart_items_html`. Set `false` for a JSON-only summary. |

The response includes `is_empty`, `subtotal`, `total`, tax breakdown, `cart_items_count`, `cart_items`, and the cart/checkout/shop URLs. The whole payload is filterable via `storeengine/api/mini_cart_response`. This is the endpoint a themed header cart polls after a [Cart](/rest-api/cart) mutation.

```bash
curl "https://your-store.example/wp-json/storeengine/v1/mini-cart/current?render=false"
```

## Bundle sync {#bundle-sync}

`bundle-sync.php`, base `bundle`, admin-only.

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--post">POST</span> | `/bundle/<id>/sync-purchasers` | Grant new bundle items to past purchasers |

When products are added to an existing bundle, this endpoint walks past paid orders containing the bundle (one page at a time), grants download permissions for the newly-added products, and fires an action addons can listen to. Paginate with `page` (default 1) and `per_page` (default 25, max 100) until the response reports no more work.

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/bundle/88/sync-purchasers \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "page": 1, "per_page": 25 }'
```

## Related

- [Overview](/rest-api/overview)
- [Cart API](/rest-api/cart) — the mini-cart mirrors cart state.
- [WP-CLI reference](/reference/wp-cli) — some of these tasks are also scriptable.
