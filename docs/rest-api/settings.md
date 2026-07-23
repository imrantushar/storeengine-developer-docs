---
title: "Settings API"
description: "Admin StoreEngine REST endpoints to read store settings and update or verify payment gateway configuration, gated on manage_options under the storeengine/v1 namespace."
sidebar_label: "Settings"
keywords: [storeengine rest api, settings api, store settings, payment gateway settings, verify gateway, manage_options]
---

The Settings controller (`api/settings.php`, base `settings`) reads store settings and updates payment gateway configuration. It extends `WP_REST_Controller` directly (not the StoreEngine base controller).

## Authentication

Admin only — `Helper::check_rest_user_cap( 'manage_options' )`. See [Authentication](/rest-api/authentication#admin-routes--capability-gates).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/settings` | Read store settings |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/settings/payment-gateways` | Update gateway config |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/settings/verify-payment-gateways` | Verify gateway credentials |

All paths are relative to `/wp-json/storeengine/v1`.

## GET /settings

`GET /wp-json/storeengine/v1/settings`

Returns the store settings object (store identity, currency, pages, checkout options, and so on).

```bash
curl https://your-store.example/wp-json/storeengine/v1/settings \
  -u "admin:APPLICATION_PASSWORD"
```

## PUT/PATCH /settings/payment-gateways {#payment-gateways}

`PUT /wp-json/storeengine/v1/settings/payment-gateways`

Updates payment gateway settings. Each gateway declares its own fields (text, password, checkbox, safe-text, etc.), and the endpoint validates and sanitizes each field against that declared type.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `config` | object | yes | Gateway settings keyed by field. |
| `context` | string | no | Sanitization context; default `edit`. |

```bash
curl -X PUT https://your-store.example/wp-json/storeengine/v1/settings/payment-gateways \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
        "config": {
          "stripe": { "is_production": true, "publishable_key": "pk_live_…", "secret_key": "sk_live_…" }
        }
      }'
```

The precise `config` schema is generated from the registered gateways; inspect it with an `OPTIONS` request against the route.

## PUT/PATCH /settings/verify-payment-gateways

`PUT /wp-json/storeengine/v1/settings/verify-payment-gateways`

Verifies a gateway's credentials without persisting them — the "Test connection" action.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `method` | string | yes | Gateway id to verify (e.g. `stripe`). |
| `config` | object | yes | The credentials to test. |
| `context` | string | no | Default `edit`. |

```bash
curl -X PUT https://your-store.example/wp-json/storeengine/v1/settings/verify-payment-gateways \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "method": "stripe", "config": { "secret_key": "sk_test_…" } }'
```

## Related

- [Payments API](/rest-api/payments) — read gateway metadata.
- [Payment gateways reference](/reference/payment-gateways)
- [Settings API guide for addons](/addons/settings-api) — how addons register their own settings.
