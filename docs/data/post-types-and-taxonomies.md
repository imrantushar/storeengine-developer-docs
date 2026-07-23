---
title: "Post Types & Taxonomies"
description: "StoreEngine's custom post types and taxonomies — the storeengine_product and storeengine_coupon CPTs, product categories, tags, global attributes, and addon-registered types."
sidebar_label: "Post Types & Taxonomies"
keywords: [storeengine, custom post types, taxonomies, storeengine_product, storeengine_coupon, product attributes, wp_query]
---

StoreEngine keeps a deliberately small set of custom post types. Only content that benefits from the WordPress editing experience — products and coupons — is stored as posts. Orders and subscriptions are **table-backed** and are not post types (see [Database Schema](/data/database-schema)).

Post types and core taxonomies are registered in `includes/database.php`. Their identifiers are exposed as constants on `StoreEngine\Utils\Helper` (`includes/utils/helper.php`) — always reference the constant rather than hardcoding the string.

## Custom post types

| Post type | Helper constant | Purpose | Registered by |
| --- | --- | --- | --- |
| `storeengine_product` | `Helper::PRODUCT_POST_TYPE` | Products. Each product owns one or more prices/plans (see [Products](/data/products)). | `includes/database.php` |
| `storeengine_coupon` | `Helper::COUPON_POST_TYPE` | Discount coupons. Wrapped by the `Coupon` object (see [Coupons](/data/coupons)). | `includes/database.php` |

:::note Orders and subscriptions are not post types
Both live in the `wp_storeengine_orders` table, discriminated by a `type` column. Load them with the `Order` and `Subscription` objects, not `get_post()`.
:::

## Product taxonomies

These taxonomies are attached to the `storeengine_product` post type:

| Taxonomy | Purpose |
| --- | --- |
| `storeengine_product_category` | Hierarchical product categories. |
| `storeengine_product_tag` | Flat product tags. |
| `storeengine_product_attribute` | Base attribute taxonomy for product attributes. |

### Global (store-wide) attributes

Global attributes are defined in the `storeengine_attribute_taxonomies` table and registered as taxonomies dynamically at runtime. The taxonomy name for a given attribute is derived through the helper:

```php
use StoreEngine\Utils\Helper;

$taxonomy = Helper::get_attribute_taxonomy_name( 'color' );
$terms    = get_terms( [ 'taxonomy' => $taxonomy, 'hide_empty' => false ] );
```

Because these taxonomies are created from stored definitions, the exact set depends on how the store is configured.

## Addon-registered types

Some post types and taxonomies exist only when the relevant addon is active:

| Type | Kind | Addon | Purpose |
| --- | --- | --- | --- |
| `storeengine_membership` | Post type | Membership | Access Groups. |
| `storeengine_webhook` | Post type | Webhooks | Outgoing webhook definitions. |
| `storeengine_in_hook` | Post type | Webhooks | Incoming webhook receivers. |
| `storeengine_product_brand` | Taxonomy | Brand | Product brands. |

## Querying products

Because products are a CPT, standard `WP_Query` works:

```php
use StoreEngine\Utils\Helper;

$query = new WP_Query( [
	'post_type'      => Helper::PRODUCT_POST_TYPE,
	'posts_per_page' => 12,
	'post_status'    => 'publish',
	'tax_query'      => [
		[
			'taxonomy' => 'storeengine_product_category',
			'field'    => 'slug',
			'terms'    => 'apparel',
		],
	],
] );
```

To turn a product post id into a rich product object with prices, stock, and attributes, use the factory rather than working with the raw `WP_Post`:

```php
$product = Helper::get_product( get_the_ID() ); // AbstractProduct|false
if ( $product ) {
	echo esc_html( $product->get_name() );
	foreach ( $product->get_prices() as $price ) {
		// $price is a Price object; $price->get_id() is the price_id
	}
}
```

See [Products](/data/products) for the full object API.

## See also

- [Database Schema](/data/database-schema) — where table-backed data lives.
- [Products](/data/products) and [Coupons](/data/coupons) — the objects over these CPTs.
- [REST API › Products](/rest-api/products) — querying products over HTTP.
