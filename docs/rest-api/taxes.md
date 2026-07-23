---
title: "Taxes API"
description: "Admin StoreEngine REST endpoints to manage tax rates — list, create, read, update, and delete rates, plus a batch endpoint for bulk create, update, and delete in one request."
sidebar_label: "Taxes"
keywords: [storeengine rest api, taxes api, tax rates, tax crud, batch taxes, manage_options]
---

The Taxes controller (`api/taxes.php`, base `taxes`) is the admin CRUD for tax rates, plus a batch endpoint for bulk edits.

## Authentication

Admin only — `Helper::check_rest_user_cap( 'manage_options' )`. See [Authentication](/rest-api/authentication#admin-routes--capability-gates).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/taxes` | List tax rates |
| <span class="api-method api-method--post">POST</span> | `/taxes` | Create a tax rate |
| <span class="api-method api-method--get">GET</span> | `/taxes/<id>` | Get a tax rate |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/taxes/<id>` | Update a tax rate |
| <span class="api-method api-method--delete">DELETE</span> | `/taxes/<id>` | Delete a tax rate |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/taxes/batch` | Bulk create/update/delete |

All paths are relative to `/wp-json/storeengine/v1`.

## GET /taxes

`GET /wp-json/storeengine/v1/taxes`

Lists tax rates. Supports the collection parameters `page`, `per_page`, `offset`, `order`, and `orderby` (one of `id`, `order`, `priority`).

```bash
curl "https://your-store.example/wp-json/storeengine/v1/taxes?per_page=50&orderby=priority" \
  -u "admin:APPLICATION_PASSWORD"
```

## POST /taxes · PUT/PATCH /taxes/&lt;id&gt;

Create or update a rate. The tax-rate fields (rate, name, country, state, postcode, city, priority, compound, shipping) follow the item schema — discover the exact shape with an `OPTIONS` request:

```bash
curl -X OPTIONS https://your-store.example/wp-json/storeengine/v1/taxes \
  -u "admin:APPLICATION_PASSWORD"
```

Example create:

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/taxes \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "rate": "8.25", "name": "TX State", "country": "US", "state": "TX", "priority": 1 }'
```

## DELETE /taxes/&lt;id&gt;

Tax rates do not support trashing, so deletion requires `force`.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `force` | boolean | false | Must be `true` to delete. |

## PUT/PATCH /taxes/batch

`PUT /wp-json/storeengine/v1/taxes/batch`

Bulk operations in a single request, following the shared [batch schema](/rest-api/overview#batch-endpoints): `create`, `update`, and `delete` arrays. Up to 100 items total (filter `storeengine/rest_batch_items_limit`).

```bash
curl -X PUT https://your-store.example/wp-json/storeengine/v1/taxes/batch \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
        "create": [ { "rate": "7.00", "name": "State" } ],
        "update": [ { "id": 12, "priority": 2 } ],
        "delete": [ 15 ]
      }'
```

The response echoes each array with a per-item result (or per-item `error`).

## Related

- [Shipping API](/rest-api/shipping)
- [Settings API](/rest-api/settings)
