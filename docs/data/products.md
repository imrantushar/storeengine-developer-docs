---
title: "Products & Prices"
description: "The StoreEngine product model — simple, variable, and bundled products, the Price object and price_id purchasable unit, fetching via the factory, attributes, gallery, and stock management."
sidebar_label: "Products"
keywords: [storeengine, product object, price_id, product factory, variable product, stock management, product api]
---

Products are CPT-backed (`storeengine_product`) but exposed through rich objects, not raw `WP_Post`s. The base class is `StoreEngine\Classes\AbstractProduct`; concrete types live in `includes/classes/product/`. Never instantiate the abstract class — use the factory, which returns the right concrete type.

## Product types

| Type | Class | Description |
| --- | --- | --- |
| `simple` | `SimpleProduct` | A single product with one or more prices. |
| `variable` | `VariableProduct` | A product with variations (built from attributes). |
| `bundled` | `BundledProduct` | A product composed of other products. |

Check a product's type with `get_type()` or `is_type( 'variable' )`.

## The Price object and `price_id`

A product **has many prices**. Each price is a row in `wp_storeengine_product_price` and is represented by a `StoreEngine\Classes\Price` object. The price — identified by its **`price_id`** — is the actual **purchasable unit**: it is what the cart adds and what order items reference. A product id alone is not enough to add something to a cart or order.

```php
use StoreEngine\Utils\Helper;

$product = Helper::get_product( 42 );
$prices  = $product->get_prices();   // Price[]

foreach ( $prices as $price ) {
	$price_id = $price->get_id();    // the purchasable price_id
	$name     = $price->get_name();
	$amount   = $price->get_price();
	$type     = $price->get_type();  // e.g. one-time / subscription
}
```

A `Price` can walk back to its product:

```php
$product = $price->get_product();
```

:::tip[price_id is the currency of cart and orders]
`Cart::add_product_to_cart()` takes a `price_id`, and `Order::add_product()` takes a `Price` object. Keep the price id around whenever you render a buy button. See [Cart](/data/cart).
:::

## Fetching products

Prefer the helper for one-off loads; use `ProductFactory` when you want explicit control or need a specific type:

```php
use StoreEngine\Utils\Helper;
use StoreEngine\Classes\ProductFactory;

// Helper — returns AbstractProduct|false
$product = Helper::get_product( 42 );

// Factory — instance and static forms
$product = ( new ProductFactory() )->get_product( 42 );
$product = ProductFactory::getProduct( 42, 'variable' );

// Resolve the product that owns a given price_id
$product = ( new ProductFactory() )->get_product_by_price_id( $price_id );

// A specific variation
$variation = Helper::get_product_variation( $variation_id );
```

## Reading product data

| Method | Returns |
| --- | --- |
| `get_id()` | Product id. |
| `get_type()` | `simple` / `variable` / `bundled`. |
| `get_name()` / `get_slug()` / `get_permalink()` | Identity and URL. |
| `get_status()` / `get_content()` | Post status and description. |
| `get_prices( bool $force_show_hidden = false )` | `Price[]`. |
| `get_price_types()` | The distinct price types on this product. |
| `get_attributes()` | Product attributes. |
| `get_product_gallery()` | Gallery image ids. |
| `get_upsell_ids()` / `get_crosssell_ids()` | Related product ids. |
| `get_downloadable_files()` | Downloadable file definitions. |
| `get_weight()` / `get_dimensions()` | Shipping dimensions. |

Flag helpers: `is_downloadable()`, `is_virtual()`, `is_visible()`, `needs_shipping()`, `is_sold_individually()`, `is_type( $type )`.

## Stock management

Stock methods live on the product object. Reads:

```php
if ( $product->manages_stock() ) {
	$qty       = $product->get_stock_quantity();
	$available = $product->get_available_stock_quantity(); // minus reserved
	$reserved  = $product->get_reserved_stock();
}

$in_stock  = $product->is_in_stock();
$status    = $product->get_stock_status();
$backorder = $product->is_on_backorder();
$ok        = $product->has_enough_stock( 3 );
```

Writes (for variable products pass the variation id):

```php
$product->reduce_stock( 2 );                     // on sale/fulfillment
$product->increase_stock( 2 );                   // on refund/cancel
$product->reduce_stock( 1, $variation_id );      // variation-specific
```

Every change is recorded in the `storeengine_stock_movements` ledger, and checkout uses `storeengine_reserved_stock` to hold quantity during payment. See [Database Schema](/data/database-schema).

Setters for building/editing products include `set_name()`, `set_type()`, `set_stock_quantity()`, and `set_stock_status()`.

## See also

- [Cart](/data/cart) — adding a `price_id` to the cart.
- [Orders](/data/orders) — `add_product()` takes a `Price`.
- [Post Types & Taxonomies](/data/post-types-and-taxonomies) — querying the product CPT.
- [REST API › Products](/rest-api/products) — the product HTTP API.
