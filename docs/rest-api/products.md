---
title: "Products API"
description: "StoreEngine product REST endpoints — native custom-post-type CRUD for products, categories, and tags, plus the auxiliary stock adjustment, stock movement, and inventory code generation routes."
sidebar_label: "Products"
keywords: [storeengine rest api, products api, product crud, stock adjust, inventory, sku barcode, product categories, product tags]
---

Products are exposed two ways. The main CRUD is **native WordPress custom-post-type REST**, and a handful of **auxiliary stock/inventory routes** live in `product.php`. Both sit under the `storeengine/v1` namespace.

## Native CPT CRUD

The `storeengine_product` post type is registered with `show_in_rest => true`, `rest_base => storeengine_product`, `rest_namespace => storeengine/v1`, and reuses WordPress core's `WP_REST_Posts_Controller`. That means you get the full standard REST surface — collection parameters, `OPTIONS` schema discovery, and `_links` — for free.

StoreEngine only extends it: it filters the response (`rest_prepare_storeengine_product`) to add commerce fields (prices, stock, inventory visibility) and persists custom fields on insert (`rest_insert_storeengine_product`).

### Authentication

Uses the custom-post-type capability map (not `manage_options`):

| Action | Capability |
| --- | --- |
| Read one | `read_storeengine_product` |
| Edit collection | `edit_storeengine_products` |
| Edit one | `edit_storeengine_product` |
| Publish | `publish_storeengine_products` |
| Delete one | `delete_storeengine_product` |

### Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/storeengine_product` | List products |
| <span class="api-method api-method--post">POST</span> | `/storeengine_product` | Create a product |
| <span class="api-method api-method--get">GET</span> | `/storeengine_product/<id>` | Get a product |
| <span class="api-method api-method--put">PUT</span>/<span class="api-method api-method--patch">PATCH</span> | `/storeengine_product/<id>` | Update a product |
| <span class="api-method api-method--delete">DELETE</span> | `/storeengine_product/<id>` | Delete a product |
| <span class="api-method api-method--get">GET</span>/<span class="api-method api-method--post">POST</span> | `/storeengine_product_category` | Product categories (terms) |
| <span class="api-method api-method--get">GET</span>/<span class="api-method api-method--post">POST</span> | `/storeengine_product_tag` | Product tags (terms) |

All paths are relative to `/wp-json/storeengine/v1`. Because these are core controllers, they accept the standard collection parameters: `per_page`, `page`, `search`, `slug`, `status`, `orderby`, `order`, `include`, `exclude`, `context`, and taxonomy filters.

```bash
# List published products
curl "https://your-store.example/wp-json/storeengine/v1/storeengine_product?per_page=20&status=publish" \
  -u "admin:APPLICATION_PASSWORD"

# Discover the exact create/update schema
curl -X OPTIONS https://your-store.example/wp-json/storeengine/v1/storeengine_product \
  -u "admin:APPLICATION_PASSWORD"
```

Categories (`storeengine_product_category`) and tags (`storeengine_product_tag`) are registered with `WP_REST_Terms_Controller` under the same namespace, so they support the standard term CRUD and query parameters.

### Extending the response

- `rest_prepare_storeengine_product` — filter each product response object.
- `rest_insert_storeengine_product` — act after a product is created/updated (StoreEngine uses this to save its custom fields).

See [Extending the API](/rest-api/extending#extending-native-cpt-routes).

## Stock and inventory {#stock-and-inventory}

`product.php` registers auxiliary routes for inventory management. These are **not** under `storeengine_product` — they live at `/products/*` and `/inventory/*` and gate on the broad `edit_storeengine_products` capability.

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--post">POST</span> | `/products/<id>/stock-adjust` | Adjust stock (add/remove/set) |
| <span class="api-method api-method--get">GET</span> | `/products/<id>/stock-movements` | Stock movement history |
| <span class="api-method api-method--post">POST</span> | `/inventory/generate-code` | Generate a SKU or barcode |
| <span class="api-method api-method--post">POST</span> | `/inventory/resolve-codes` | Resolve pasted codes to products |

### POST /products/&lt;id&gt;/stock-adjust

`POST /wp-json/storeengine/v1/products/<id>/stock-adjust`

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `action` | string | yes | One of `add`, `remove`, `set`. |
| `quantity` | integer | yes | Minimum 0. |
| `variation_id` | integer | no | Default 0; target a variation. |
| `reason` | string | no | Default `manual`. |
| `note` | string | no | Free-text note for the movement log. |

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/products/42/stock-adjust \
  -u "admin:APPLICATION_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{ "action": "add", "quantity": 25, "reason": "restock", "note": "PO #883" }'
```

### GET /products/&lt;id&gt;/stock-movements

`GET /wp-json/storeengine/v1/products/<id>/stock-movements`

Paginated stock-movement history.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `variation_id` | integer | 0 | Filter to a variation. |
| `per_page` | integer | 25 | 1–100. |
| `page` | integer | 1 | |

### POST /inventory/generate-code

`POST /wp-json/storeengine/v1/inventory/generate-code`

Generates a SKU or barcode on demand (the "Generate" buttons in the product editor).

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | string | yes | `sku` or `barcode`. |
| `name` | string | no | Product name, used by the SKU pattern. |
| `category_id` | integer | no | Category context for the pattern. |

Returns `{ value: "…" }`.

### POST /inventory/resolve-codes

`POST /wp-json/storeengine/v1/inventory/resolve-codes`

Batch-resolves pasted SKUs/barcodes to product name + price (used by the Barcode Labels screen, since the product collection `search` only matches title/content).

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `codes` | string[] | yes | Array of raw SKUs/barcodes. |

## Related

- [Products object](/data/products) — product types, prices, and inventory model.
- [Post types and taxonomies](/data/post-types-and-taxonomies)
- [Coupons API](/rest-api/coupons) — the other native CPT REST surface.
