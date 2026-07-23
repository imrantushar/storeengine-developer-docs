---
title: "Me Subscriptions API"
description: "Current-user-scoped StoreEngine REST endpoints for the headless customer dashboard to list, view, cancel, pause, and resume their own subscriptions. Requires the Subscription addon."
sidebar_label: "Me Subscriptions"
keywords: [storeengine rest api, customer subscriptions api, cancel subscription, pause subscription, resume subscription, headless subscriptions]
---

The `me/subscriptions` controller (`api/me-subscriptions.php`, base `me/subscriptions`) lets a signed-in customer manage their own subscriptions from a headless dashboard. It is the customer-facing counterpart to the admin-only [Subscriptions API](/rest-api/subscriptions).

:::note[Addon requirement]
These routes register **only when the Subscription addon is active** (specifically, when `SubscriptionCollection` exists). On a store without subscriptions the routes do not exist and return `404`.
:::

The controller also injects a "Subscriptions" item into the [dashboard menu](/rest-api/me#menu) via the `storeengine/rest/me/menu_items` filter.

## Authentication

Logged-in only. Requests without a session return `storeengine_rest_not_logged_in` (401). Each handler enforces ownership: a subscription belonging to another customer returns `404`. See [Authentication](/rest-api/authentication#logged-in-customer-tier-me).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/me/subscriptions` | List own subscriptions |
| <span class="api-method api-method--get">GET</span> | `/me/subscriptions/<id>` | Subscription detail |
| <span class="api-method api-method--post">POST</span> | `/me/subscriptions/<id>/cancel` | Cancel (→ `pending_cancel`) |
| <span class="api-method api-method--post">POST</span> | `/me/subscriptions/<id>/pause` | Pause (→ `on_hold`) |
| <span class="api-method api-method--post">POST</span> | `/me/subscriptions/<id>/resume` | Resume (→ `active`) |

All paths are relative to `/wp-json/storeengine/v1`.

## GET /me/subscriptions

Lists the current customer's subscriptions.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | integer | 1 | |
| `per_page` | integer | 10 | Capped at 100. |
| `status` | string | — | Filter by subscription status. |

Emits `X-WP-Total` / `X-WP-TotalPages`. Each item:

```json
{
  "id": 210, "status": "active",
  "total": 19.0, "currency": "USD",
  "billing_period": "month", "billing_interval": 1,
  "start_date": "2025-01-01 00:00:00",
  "next_payment_date": "2025-08-01 00:00:00",
  "last_payment_date": "2025-07-01 00:00:00",
  "end_date": null,
  "trial": false, "trial_end_date": null,
  "payment_method": "Card ending 4242",
  "parent_order_id": 1187
}
```

```bash
curl "https://your-store.example/wp-json/storeengine/v1/me/subscriptions?status=active" \
  -u "ada:APPLICATION_PASSWORD"
```

## GET /me/subscriptions/&lt;id&gt;

Returns the detailed shape — the summary fields above plus `related_order_ids`, `suspension_count`, `billing_address`, and `shipping_address`.

## POST /me/subscriptions/&lt;id&gt;/cancel

Transitions the subscription to `pending_cancel` with a customer note. Returns the detailed object.

## POST /me/subscriptions/&lt;id&gt;/pause

Transitions to `on_hold`. Returns the detailed object.

## POST /me/subscriptions/&lt;id&gt;/resume

Transitions to `active`. Returns the detailed object.

A failed status transition returns `storeengine_rest_status_failed` (500). None of these endpoints take a request body.

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/me/subscriptions/210/pause \
  -u "ada:APPLICATION_PASSWORD"
```

## Related

- [Subscriptions API](/rest-api/subscriptions) — admin (read-only) subscription listing.
- [Subscriptions object](/data/subscriptions) — the data model and status lifecycle.
- [Me API](/rest-api/me) — the rest of the customer dashboard.
