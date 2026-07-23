---
title: "The Coupon Object"
description: "StoreEngine's Coupon object — load coupons by code, read discount type and limits, validate against a cart or product, calculate discount amounts, and use BOGO and recurring fields."
sidebar_label: "Coupons"
keywords: [storeengine, coupon object, discount type, coupon validation, bogo, recurring discount, coupon api]
---

Coupons are stored as the `storeengine_coupon` custom post type (see [Post Types & Taxonomies](/data/post-types-and-taxonomies)) and wrapped by `StoreEngine\Classes\Coupon`. Unlike orders, coupons are **not** a custom table.

## Loading by code

The constructor loads a coupon by its code:

```php
use StoreEngine\Classes\Coupon;

$coupon = new Coupon( 'WELCOME10' );

if ( $coupon->get_id() ) {
	echo $coupon->get_code();
	echo $coupon->get_amount();
	echo $coupon->get_discount_type();
}
```

## Properties

| Method | Returns |
| --- | --- |
| `get_id()` / `get_code()` | Post id / coupon code. |
| `get_amount()` | The discount amount (interpretation depends on type). |
| `get_discount_type()` | The discount type slug. |
| `get_minimum_amount()` / `get_maximum_amount()` | Spend thresholds. |
| `get_product_ids()` / `get_excluded_product_ids()` | Product scope. |
| `get_product_categories()` | Category scope. |
| `get_date_expires()` | Expiry date. |
| `get_usage_count()` | Times already used. |
| `get_usage_limit()` / `get_usage_limit_per_user()` | Usage caps. |
| `get_free_shipping()` | Whether the coupon grants free shipping. |
| `get_auto_apply()` | Whether the coupon applies automatically. |

## Discount types

The set of valid discount types comes from the helper (filterable via `storeengine/product_coupon_types`):

```php
use StoreEngine\Utils\Helper;

$types = Helper::get_coupon_types();   // e.g. [ 'percentage', 'fixedAmount' ]
```

Test a coupon's type:

```php
if ( $coupon->is_type( 'percentage' ) ) {
	// percentage-based discount
}
```

## Validation

`validate_coupon()` checks expiry, spend thresholds, usage limits, and scope. Pass `false` to skip the total-usage check (e.g. when re-validating an already-applied coupon):

```php
try {
	$coupon->validate_coupon();          // throws on failure
	// ...apply
} catch ( \Throwable $e ) {
	// invalid: $e->getMessage()
}

$valid_for_cart = $coupon->is_valid_for_cart();
$valid_for_prod = $coupon->is_valid_for_product( $product_id, $price_id, $object );
```

Per-user usage:

```php
$used = $coupon->get_usage_by_user_id( get_current_user_id() );
```

## Calculating a discount

`calculate()` applies the coupon to a raw amount. `get_discount_amount()` computes the discount for a specific amount or cart item:

```php
$discounted = $coupon->calculate( 100.00 );

// get_discount_amount( $discounting_amount, $cart_item = null, bool $single = false ): float
$discount = $coupon->get_discount_amount( 100.00 );
```

## BOGO and recurring fields

For buy-one-get-one and subscription coupons:

```php
// BOGO
$buy      = $coupon->get_bogo_buy_qty();
$get      = $coupon->get_bogo_get_qty();
$bogo_amt = $coupon->get_bogo_discount();

// Recurring (subscriptions)
$recurring       = $coupon->get_recurring_discount();
$recurring_limit = $coupon->get_recurring_discount_limit();
```

## See also

- [Cart](/data/cart) — `apply_coupon()` on the cart.
- [Orders](/data/orders) — `apply_coupon()` and coupon line items on orders.
- [Subscriptions](/data/subscriptions) — recurring discounts.
- [REST API › Coupons](/rest-api/coupons) — the coupon HTTP API.
