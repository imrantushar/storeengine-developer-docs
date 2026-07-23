---
title: "The Cart Object"
description: "StoreEngine's Cart singleton — add products by price_id, update and remove items, calculate totals, apply coupons and fees, and check whether the cart needs payment or shipping."
sidebar_label: "Cart"
keywords: [storeengine, cart object, add to cart, price_id, cart totals, apply coupon, cart fees, singleton]
---

The cart is a **singleton** — one instance per request — represented by `StoreEngine\Classes\Cart`. Its constructor is private, so you never use `new Cart()`. Get the shared instance through one of the accessors below.

## Getting the cart

```php
use StoreEngine\Utils\Helper;
use StoreEngine\Classes\Cart;

$cart = Helper::cart();          // preferred: null-safe accessor
$cart = Cart::init();            // initialize + return
$cart = Cart::get_instance();    // return existing instance (nullable)
```

`Helper::cart()` returns `?Cart`; guard for `null` in contexts where the cart may not be booted.

## Adding items — by `price_id`

Add to the cart with a **`price_id`**, not a product id. The price is the purchasable unit (see [Products](/data/products)). This is the single most common source of confusion — a product may expose several prices, and each is added independently.

```php
$cart = Helper::cart();

// add_product_to_cart( int $price_id, int $quantity = 1, int $variation_id = 0, array $variation = [], array $item_data = [] )
$cart->add_product_to_cart( $price_id, 2 );

// A variation of a variable product:
$cart->add_product_to_cart( $price_id, 1, $variation_id, [ 'color' => 'blue' ] );
```

:::warning price_id vs product_id
`add_product_to_cart()` expects a **price_id**. If you only have a product, call `$product->get_prices()` and use `$price->get_id()`. Passing a product id will not add the intended item.
:::

## Updating and removing

Cart items are keyed by an opaque `item_key` (a hash). Read it from the item objects returned by `get_cart_items()`:

```php
$items = $cart->get_cart_items();          // array of CartItem, keyed by item_key

foreach ( $items as $item_key => $item ) {
	$cart->update_quantity( $item_key, 3 );
}

$cart->remove_cart_item( $item_key );      // returns bool
$cart->clear_cart();                       // empty the cart

$item  = $cart->get_cart_item( $item_key );                        // ?CartItem
$byPid = $cart->get_cart_item_by_product( $product_id, $price_id ); // lookup by product
$has   = $cart->has_items();
$count = $cart->get_count();
```

## Totals

Totals are computed on demand. Call `calculate_totals()` after mutating the cart, then read the aggregates:

```php
$cart->calculate_totals();

$subtotal = $cart->get_cart_subtotal();
$discount = $cart->get_total_discount();
```

## Coupons

```php
$cart->apply_coupon( 'WELCOME10' );
$applied = $cart->is_coupon_applied( 'WELCOME10' );
$coupons = $cart->get_coupons();
$cart->remove_coupon( 'WELCOME10' );
```

Coupon validity, discount type, and calculation are owned by the `Coupon` object — see [Coupons](/data/coupons).

## Fees

Add an arbitrary fee line to the cart (e.g. surcharge, gift wrap):

```php
// add_fee( string $name, $amount, string $id = '', bool $taxable = true, string $tax_class = '' )
$cart->add_fee( 'Gift wrap', 3.50 );
$cart->add_fee( 'Rush surcharge', 9.99, 'rush', false );

$fees = $cart->get_fees();
```

## Payment and shipping checks

Use these to decide which checkout steps to render:

```php
if ( $cart->needs_payment() ) {
	// show payment methods
}

if ( $cart->needs_shipping() ) {
	$methods = $cart->get_shipping_methods();
	// show shipping options
}
```

| Method | Returns |
| --- | --- |
| `needs_payment()` | Whether the cart total is greater than zero. |
| `needs_shipping()` | Whether any item requires shipping. |
| `get_shipping_methods()` | Available shipping methods for the cart. |

## See also

- [Products](/data/products) — where `price_id` comes from.
- [Coupons](/data/coupons) — the discount object the cart applies.
- [Orders](/data/orders) — the cart converts to an order at checkout.
- [REST API › Cart](/rest-api/cart) — the storefront cart endpoint.
