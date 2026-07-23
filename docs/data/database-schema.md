---
title: "Database Schema & Data Layer"
description: "Reference for StoreEngine's custom database tables and CPTs — orders, items, subscriptions, products, carts, stock, tax, shipping, and payment data in the wp_storeengine_* schema."
sidebar_label: "Database Schema"
keywords: [storeengine, database schema, wordpress custom tables, storeengine_orders, order items, subscriptions, product price, data layer]
---

StoreEngine stores transactional, high-volume data in **custom database tables** rather than `wp_posts`/`wp_postmeta`. This page maps the full schema so you know where each piece of data lives before you query, extend, or migrate it.

Not everything is a post. Products and coupons remain custom post types (see [Post Types & Taxonomies](/data/post-types-and-taxonomies)), but orders, order items, subscriptions, carts, stock, tax, shipping, and payment data all live in dedicated tables built for relational queries and scale.

## How the schema is defined

Each table has a `CREATE TABLE` definition in `includes/database/create-*.php`. Tables are registered in `includes/database.php` and installed/upgraded by `includes/installer.php` on activation and version bumps.

All tables use the site's WordPress table prefix. On a default install that prefix is `wp_`, so `storeengine_orders` becomes `wp_storeengine_orders`. Examples below use the `wp_` prefix; read it as `{$wpdb->prefix}` in code.

:::note[Orders and subscriptions share one table]
Both orders and subscriptions are stored in `wp_storeengine_orders`. A `type` column discriminates the row: `'order'` for a regular order, `'subscription'` for a subscription. There is no separate subscriptions post type or master table — the schedule detail for a subscription lives in `wp_storeengine_subscriptions`, keyed back to the order row.
:::

:::note[Coupons are a CPT, not a table]
Unlike orders, coupons are stored as the `storeengine_coupon` custom post type. There is no `storeengine_coupons` table.
:::

## Orders & Subscriptions

| Table | Purpose |
| --- | --- |
| `storeengine_orders` | Master record for both orders and subscriptions. The `type` column (`order` / `subscription`) discriminates. Holds status, currency, totals, customer id, and dates. |
| `storeengine_orders_meta` | Arbitrary key/value metadata attached to an order or subscription row. |
| `storeengine_order_items` | Line rows for an order. The `order_item_type` column distinguishes `line_item` (product), `tax`, `shipping`, `fee`, `coupon`, and `refund` rows. |
| `storeengine_order_item_meta` | Metadata for individual order items (e.g. product id, price id, quantity, subtotals). |
| `storeengine_order_addresses` | Billing and shipping addresses for an order, one row per address type. |
| `storeengine_order_operational_data` | Operational fields such as the human-readable order number and paid/completed timestamps. |
| `storeengine_subscriptions` | Schedule data for subscription rows: next payment date, period, interval, trial, retry, and related dates. |

## Products & Attributes

| Table | Purpose |
| --- | --- |
| `storeengine_product_price` | A product has many prices/plans. Each row is a **purchasable unit** identified by `price_id` — the thing that gets added to cart and referenced by order items. See [Products](/data/products). |
| `storeengine_product_variations` | Variation rows for variable products. |
| `storeengine_product_variation_meta` | Metadata for individual variations. |
| `storeengine_variation_term_relations` | Maps variations to attribute terms. |
| `storeengine_attribute_taxonomies` | Definitions for global (store-wide) product attributes. |

## Cart, Sessions & Stock

| Table | Purpose |
| --- | --- |
| `storeengine_cart` | Persisted cart contents, keyed to a session or user. |
| `storeengine_sessions` | Front-end session storage for guests and logged-in customers. |
| `storeengine_reserved_stock` | Temporary stock holds placed during checkout to prevent overselling. |
| `storeengine_stock_movements` | Append-only ledger of stock increases and decreases for auditing. |

## Downloads

| Table | Purpose |
| --- | --- |
| `storeengine_downloadable_product_permissions` | Grants that allow a customer to download a purchased file. |
| `storeengine_download_log` | Records each download event. |
| `storeengine_product_download_directories` | Approved directories from which downloadable files may be served. |

## Tax

| Table | Purpose |
| --- | --- |
| `storeengine_tax_rates` | Tax rate definitions (rate, class, priority, labels). |
| `storeengine_tax_rate_locations` | Location constraints (postcode/city) attached to a tax rate. |

## Shipping

| Table | Purpose |
| --- | --- |
| `storeengine_shipping_zones` | Shipping zone definitions. |
| `storeengine_shipping_zone_locations` | Countries/states/postcodes that belong to a zone. |
| `storeengine_shipping_zone_methods` | Shipping methods enabled within a zone. |

## Payment

| Table | Purpose |
| --- | --- |
| `storeengine_payment_tokens` | Saved payment methods (tokenized cards, etc.) for customers. |
| `storeengine_payment_tokenmeta` | Metadata for saved payment tokens. |
| `storeengine_payouts` | Payout records (used by affiliate/marketplace flows). |

## Analytics & Lookup

| Table | Purpose |
| --- | --- |
| `storeengine_order_product_lookup` | Denormalized per-product order rows for fast reporting. |
| `storeengine_customer_lookup` | Denormalized customer aggregates for analytics. |

## Integrations & Misc

| Table | Purpose |
| --- | --- |
| `storeengine_api_keys` | REST API key/secret pairs. See [REST API › Authentication](/rest-api/authentication). |
| `storeengine_integrations` | Stored third-party integration connections. |
| `storeengine_email_log` | Log of emails sent by the store. |
| `storeengine_logs` | General-purpose application log. |

## Querying custom tables

Because this data is not in `wp_posts`, `WP_Query` and `get_post_meta()` do not reach it. Use the domain objects instead — they wrap the tables and give you typed getters:

```php
use StoreEngine\Classes\Order;

$order = new Order( 123 );           // load by id
echo $order->get_total();
echo $order->get_status();
```

Reach for the raw `$wpdb` API only for reporting-style aggregate queries:

```php
global $wpdb;
$count = $wpdb->get_var(
	$wpdb->prepare(
		"SELECT COUNT(*) FROM {$wpdb->prefix}storeengine_orders WHERE type = %s AND status = %s",
		'order',
		'completed'
	)
);
```

:::tip[Owning your own tables]
If your addon needs its own table, follow the same install/upgrade pattern StoreEngine uses. See [Building Addons › Database Tables](/addons/database-tables).
:::

## See also

- [Post Types & Taxonomies](/data/post-types-and-taxonomies) — products and coupons as CPTs.
- [Orders](/data/orders) — the `Order` object over `storeengine_orders`.
- [Subscriptions](/data/subscriptions) — subscription rows and schedule data.
- [Products](/data/products) — the product/price model.
