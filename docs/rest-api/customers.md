---
title: "Customers API"
description: "Admin StoreEngine REST endpoints for customer management — list, create, read, update, and delete customers, built on WordPress's users controller under the storeengine/v1 namespace."
sidebar_label: "Customers"
keywords: [storeengine rest api, customers api, customer crud, manage customers, wp_rest_users_controller, admin customers]
---

The Customer controller (`api/customer.php`, base `customer`) is the admin-facing customer CRUD. It extends WordPress core's `WP_REST_Users_Controller`, so a StoreEngine customer is a WordPress user, and the standard user fields and query parameters apply — but the routes live under `storeengine/v1` and are gated on `manage_options`.

For the *current* customer's self-service dashboard, use the [Me API](/rest-api/me) instead.

## Authentication

Admin only. Every route calls `Helper::check_rest_user_cap( 'manage_options' )`. See [Authentication](/rest-api/authentication#admin-routes--capability-gates).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/customer` | List customers |
| <span class="api-method api-method--post">POST</span> | `/customer` | Create a customer |
| <span class="api-method api-method--get">GET</span> | `/customer/<id>` | Get a customer |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/customer/<id>` | Update a customer |
| <span class="api-method api-method--delete">DELETE</span> | `/customer/<id>` | Delete a customer |

All paths are relative to `/wp-json/storeengine/v1`.

## GET /customer

`GET /wp-json/storeengine/v1/customer`

Lists customers using the standard user collection parameters (`page`, `per_page`, `search`, `orderby`, `order`, `include`, `exclude`, `roles`, `context`). Emits pagination headers.

```bash
curl "https://your-store.example/wp-json/storeengine/v1/customer?per_page=20&search=ada" \
  -u "admin:APPLICATION_PASSWORD"
```

## POST /customer

`POST /wp-json/storeengine/v1/customer`

Creates a customer (a WordPress user).

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string | yes | New user's email. |
| `username` | string | yes | New user's username. |
| `password` | string | no | Auto-generated if omitted. |

Plus any writable field from the users schema (`first_name`, `last_name`, `roles`, `meta`, and StoreEngine billing/shipping fields). Passing an `id` returns `rest_customer_exists` (400).

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/customer \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "email": "grace@example.com", "username": "grace", "first_name": "Grace" }'
```

## GET /customer/&lt;id&gt;

`GET /wp-json/storeengine/v1/customer/<id>`

Returns one customer. Accepts the `context` parameter (`view` default, `edit`).

## PUT/PATCH /customer/&lt;id&gt;

`PUT /wp-json/storeengine/v1/customer/<id>`

Updates a customer. Accepts the writable user schema fields.

## DELETE /customer/&lt;id&gt;

`DELETE /wp-json/storeengine/v1/customer/<id>`

Users do not support trashing, so deletion requires `force`.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `force` | boolean | false | Must be `true` to delete. |
| `reassign` | integer | 0 | User ID to reassign the deleted user's content to. |

```bash
curl -X DELETE "https://your-store.example/wp-json/storeengine/v1/customer/57?force=true&reassign=1" \
  -u "admin:APPLICATION_PASSWORD"
```

## Related

- [Customers object](/data/customers) — the customer/user data model and billing/shipping storage.
- [Me API](/rest-api/me) — the customer's own self-service endpoints.
