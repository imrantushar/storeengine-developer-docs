---
title: "Shipping API"
description: "Admin StoreEngine REST endpoints to manage shipping — create and edit shipping zones, attach and configure shipping methods per zone, and list available method types and regions."
sidebar_label: "Shipping"
keywords: [storeengine rest api, shipping api, shipping zones, shipping methods, flat rate, shipping regions, manage_options]
---

The Shipping controller (`api/shipping.php`, base `shipping`) manages the store's shipping configuration: zones, the methods attached to each zone, and the catalog of available method types and regions.

## Authentication

Admin only — every route calls `Helper::check_rest_user_cap( 'manage_options' )`. See [Authentication](/rest-api/authentication#admin-routes--capability-gates).

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/shipping/zones` | List shipping zones |
| <span class="api-method api-method--post">POST</span> | `/shipping/zones` | Create a zone |
| <span class="api-method api-method--get">GET</span> | `/shipping/zones/<zone_id>` | Get a zone |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/shipping/zones/<zone_id>` | Update a zone |
| <span class="api-method api-method--delete">DELETE</span> | `/shipping/zones/<zone_id>` | Delete a zone |
| <span class="api-method api-method--get">GET</span> | `/shipping/zones/<zone_id>/methods` | Methods in a zone |
| <span class="api-method api-method--post">POST</span> | `/shipping/zones/<zone_id>/methods` | Add a method to a zone |
| <span class="api-method api-method--get">GET</span> | `/shipping/methods` | Available method types |
| <span class="api-method api-method--get">GET</span> | `/shipping/methods/<method_id>/<instance_id>` | Get a configured method instance |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/shipping/methods/<method_id>/<instance_id>` | Update a method instance |
| <span class="api-method api-method--delete">DELETE</span> | `/shipping/methods/<method_id>/<instance_id>` | Delete a method instance |
| <span class="api-method api-method--get">GET</span> | `/shipping/regions` | List selectable regions |

All paths are relative to `/wp-json/storeengine/v1`.

## Zones

### GET /shipping/zones

Lists all shipping zones with their locations and attached methods.

```bash
curl https://your-store.example/wp-json/storeengine/v1/shipping/zones \
  -u "admin:APPLICATION_PASSWORD"
```

### POST /shipping/zones · PUT/PATCH /shipping/zones/&lt;zone_id&gt;

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `zone_name` | string | yes | Display name of the zone. |
| `zone_locations` | string[] | no | Region codes assigned to the zone. |
| `zone_postcodes` | string | no | Newline-separated postcodes/ranges. |

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/shipping/zones \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "zone_name": "North America", "zone_locations": ["US", "CA"] }'
```

### DELETE /shipping/zones/&lt;zone_id&gt;

Deletes a zone and its method instances.

## Zone methods

### GET /shipping/zones/&lt;zone_id&gt;/methods

Lists the method instances configured in a zone.

### POST /shipping/zones/&lt;zone_id&gt;/methods

Adds a shipping method to the zone. The body follows the method's own settings schema (discover it with an `OPTIONS` request against the route). The response includes the new instance's `method_id` + `instance_id`, which you then use on the method-instance routes below.

## Method instances

A configured method is addressed by its `method_id` (the method type, e.g. `flat_rate`) and its numeric `instance_id`.

### GET /shipping/methods/&lt;method_id&gt;/&lt;instance_id&gt;

Returns the configured settings for a single method instance.

### PUT/PATCH /shipping/methods/&lt;method_id&gt;/&lt;instance_id&gt;

Updates a method instance.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Instance title. |
| `zone_id` | integer | yes | Owning zone. |

Plus the method-type-specific settings.

### DELETE /shipping/methods/&lt;method_id&gt;/&lt;instance_id&gt;

Removes the method instance from its zone.

## Catalog

### GET /shipping/methods

Lists the available shipping method *types* that can be added to a zone (flat rate, free shipping, and any registered by addons).

### GET /shipping/regions

Lists the selectable regions (countries/continents) for assigning to zones.

## Related

- [Checkout API](/rest-api/checkout) — shipping rates are surfaced in the checkout state snapshot (`shipping_rates`).
- [Settings API](/rest-api/settings) — store-wide configuration.
- [Taxes API](/rest-api/taxes)
