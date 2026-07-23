---
title: "Subscriptions API (Admin)"
description: "Admin StoreEngine REST endpoints to list and read subscriptions store-wide. Read-only, gated on manage_options, and available only when the Subscription addon is active."
sidebar_label: "Subscriptions"
keywords: [storeengine rest api, subscriptions api, admin subscriptions, recurring billing, subscription listing, manage_options]
---

The admin Subscription controller (`api/subscription.php`, base `subscription`) provides a store-wide, read-only view of subscriptions for back-office tooling. It is the admin counterpart to the customer-facing [Me → Subscriptions](/rest-api/me-subscriptions) controller (which can also mutate subscriptions the customer owns).

:::note Addon requirement
Subscriptions exist only when the Subscription addon is active. On a store without it, these routes are not registered.
:::

## Authentication

Admin only — `Helper::check_rest_user_cap( 'manage_options' )`. See [Authentication](/rest-api/authentication#admin-routes--capability-gates).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/subscription` | List subscriptions |
| <span class="api-method api-method--get">GET</span> | `/subscription/<id>` | Get one subscription |

All paths are relative to `/wp-json/storeengine/v1`. This controller is read-only; there are no create/update/delete routes. To change a subscription's state programmatically, act on the subscription object server-side, or use the customer-scoped cancel/pause/resume routes on [Me → Subscriptions](/rest-api/me-subscriptions).

## GET /subscription

`GET /wp-json/storeengine/v1/subscription`

Lists all subscriptions. Uses the shared analytics-style collection parameters — pagination (`page`, `per_page`), plus date-range filtering. Emits `X-WP-Total` / `X-WP-TotalPages`.

```bash
curl "https://your-store.example/wp-json/storeengine/v1/subscription?per_page=20&page=1" \
  -u "admin:APPLICATION_PASSWORD"
```

## GET /subscription/&lt;id&gt;

`GET /wp-json/storeengine/v1/subscription/<id>`

Returns a single subscription with its billing schedule, status, related orders, and addresses. Accepts the `context` parameter (`view` default, `edit`).

## Related

- [Me → Subscriptions](/rest-api/me-subscriptions) — customer self-service (list, cancel, pause, resume).
- [Subscriptions object](/data/subscriptions) — the data model and status lifecycle.
