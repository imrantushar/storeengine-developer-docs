---
title: "Coupons API"
description: "StoreEngine coupon REST endpoints — native custom-post-type CRUD for discount coupons under the storeengine/v1 namespace, with server-side validation of customer, price, and product references."
sidebar_label: "Coupons"
keywords: [storeengine rest api, coupons api, coupon crud, discount codes, coupon validation, native cpt rest]
---

Coupons, like [products](/rest-api/products), are exposed as **native WordPress custom-post-type REST**. The `storeengine_coupon` post type is registered with `show_in_rest => true`, `rest_base => storeengine_coupon`, `rest_namespace => storeengine/v1`, and reuses core's `WP_REST_Posts_Controller`. StoreEngine's `coupon.php` only adds validation on top.

## Authentication

Uses the coupon custom-post-type capability map:

| Action | Capability |
| --- | --- |
| Read one | `read_storeengine_coupon` |
| Edit collection | `edit_storeengine_coupons` |
| Edit one | `edit_storeengine_coupon` |
| Publish | `publish_storeengine_coupons` |
| Delete one | `delete_storeengine_coupon` |

See [Authentication](/rest-api/authentication#product--coupon-routes--cpt-capabilities).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/storeengine_coupon` | List coupons |
| <span class="api-method api-method--post">POST</span> | `/storeengine_coupon` | Create a coupon |
| <span class="api-method api-method--get">GET</span> | `/storeengine_coupon/<id>` | Get a coupon |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/storeengine_coupon/<id>` | Update a coupon |
| <span class="api-method api-method--delete">DELETE</span> | `/storeengine_coupon/<id>` | Delete a coupon |

All paths are relative to `/wp-json/storeengine/v1`. Standard WordPress collection parameters apply (`per_page`, `page`, `search`, `status`, `orderby`, `order`, `include`, `exclude`, `context`).

## Listing and reading

```bash
curl "https://your-store.example/wp-json/storeengine/v1/storeengine_coupon?per_page=20" \
  -u "admin:APPLICATION_PASSWORD"
```

Discover the exact field schema with an `OPTIONS` request against the collection.

## Creating and updating

Because this is a native CPT controller, coupon meta (discount type, amount, usage limits, allowed products/customers, expiry, etc.) is set through the post meta fields registered on the coupon type. Send them in the create/update body alongside the standard post fields (`title`, `status`).

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/storeengine_coupon \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "title": "SUMMER25", "status": "publish" }'
```

## Server-side validation

`coupon.php` hooks `rest_pre_insert_storeengine_coupon` to validate the payload before the coupon is saved — in particular that any referenced **customer IDs**, **price IDs**, and **product IDs** actually exist. An invalid reference is rejected with a `WP_Error` (4xx) rather than silently persisting a broken restriction. See [Extending the API](/rest-api/extending#extending-native-cpt-routes) for how to add your own coupon validation or fields via the same filter.

## Related

- [Coupons object](/data/coupons) — discount types, restrictions, and how coupons apply to a cart.
- [Checkout API — coupons](/rest-api/checkout#coupons) — applying a coupon at checkout.
- [Products API](/rest-api/products)
