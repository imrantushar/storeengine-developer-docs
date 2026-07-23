---
title: "Working with Orders"
description: "The StoreEngine Order object — load, create, and save orders, read totals and items, add products and fees, apply coupons, change status, and mark orders paid programmatically."
sidebar_label: "Orders"
keywords: [storeengine, order object, create order, payment_complete, order items, order status, php api]
---

Orders are represented by the `StoreEngine\Classes\Order` object, which wraps a row in the `wp_storeengine_orders` table (see [Database Schema](/data/database-schema)). `Order` extends `AbstractOrder` (a table-backed `AbstractEntity`), so it has full CRUD plus commerce-specific behavior.

Subscriptions reuse this machinery — `Subscription` extends `Order` — so everything here applies to them too. See [Subscriptions](/data/subscriptions).

## Loading an order

Pass an id to the constructor to load; pass `0` (the default) for a blank, unsaved order:

```php
use StoreEngine\Classes\Order;

$order = new Order( 123 );   // load existing order #123
$blank = new Order();        // blank order, not yet persisted

if ( $order->get_id() ) {
	echo $order->get_status();
	echo $order->get_formatted_order_total();
}
```

You can also look an order up by key or meta:

```php
$order = ( new Order() )->get_by_key( $order_key );
$order = ( new Order() )->get_by_meta( '_external_ref', 'INV-2025-0091' );
```

:::note There are no global helper functions
StoreEngine does not ship `storeengine_get_order()` style globals. Instantiate `Order` directly.
:::

## Creating and saving

The lifecycle mirrors a typical active-record object. `save()` inserts when the order has no id and updates otherwise:

```php
use StoreEngine\Classes\Order;
use StoreEngine\Utils\Helper;

$order = new Order();
$order->set_currency( 'USD' );

$product = Helper::get_product( 42 );
$price   = $product->get_prices()[0];      // a Price object

$order->add_product( $price, 2 );          // add 2 units of this price
$order->add_fee( 'Handling', 5.00 );

$order->save();                            // persist; assigns an id

echo $order->get_id();
echo $order->get_order_number();
```

CRUD methods available on the object:

| Method | Description |
| --- | --- |
| `create()` | Insert a new row. |
| `update()` | Persist changes to an existing row. |
| `save()` | Insert or update as appropriate. |
| `delete( bool $force = false )` | Trash, or permanently delete when `$force` is `true`. |
| `get_by_key( string $key )` | Load by the order key. |
| `get_by_meta( $key, $value, $format = null )` | Load by a meta value. |

## Reading order data

Getters accept a `$context` of `'view'` (default, filtered for display) or `'edit'` (raw). Date getters return a `StoreEngine\Classes\StoreEngineDateTime`.

| Method | Returns |
| --- | --- |
| `get_id()` | Order id. |
| `get_status( $context = 'view' )` | Current status slug. |
| `get_order_number()` | Human-readable order number. |
| `get_user_id()` | Customer WP user id. |
| `get_currency()` | Currency code. |
| `get_total()` | Grand total. |
| `get_subtotal()` | Items subtotal. |
| `get_total_tax()` / `get_tax_totals()` | Tax total / per-rate breakdown. |
| `get_shipping_total()` | Shipping total. |
| `get_discount_total()` | Total discounts. |
| `get_prices_include_tax()` | Whether stored prices are tax-inclusive. |
| `get_formatted_order_total()` | Display-formatted total. |
| `get_date_created()` / `get_date_paid()` / `get_date_completed()` | Key dates. |
| `get_payment_method()` / `get_transaction_id()` | Payment details. |
| `get_billing_first_name()` … / `get_shipping_country()` … | Address fields. |
| `is_paid()` | Whether payment has completed. |

## The items model

An order is a set of typed line rows in `wp_storeengine_order_items`. `get_items()` defaults to `line_item` (products); pass a type or use the typed helpers:

```php
$product_lines = $order->get_line_product_items();
$tax_lines     = $order->get_line_tax_items();
$shipping      = $order->get_line_shipping_items();
$fees          = $order->get_line_fee_items();
$coupon_lines  = $order->get_line_coupon_items();

$count = $order->get_item_count();
$codes = $order->get_coupon_codes();
```

| Row type | Retrieved via |
| --- | --- |
| `line_item` (product) | `get_line_product_items()` / `get_items()` |
| `tax` | `get_line_tax_items()` |
| `shipping` | `get_line_shipping_items()` |
| `fee` | `get_line_fee_items()` / `get_fees()` |
| `coupon` | `get_line_coupon_items()` / `get_coupons()` |

### Mutating items

```php
$item_id = $order->add_product( $price, 1 );        // $price is a Price object
$order->add_fee( 'Gift wrap', 3.50 );
$order->apply_coupon( 'WELCOME10' );
$order->recalculate_coupons();
$order->remove_coupon( 'WELCOME10' );
$order->remove_item( $item_id );
$order->save();
```

`add_product()` takes a **`Price` object**, not a product id — the price is the purchasable unit. See [Products](/data/products) and [Cart](/data/cart) for the price/`price_id` model.

## Changing status

Two methods change an order's status. Prefer `update_status()` — it runs the transition, records a note, and persists in one call:

```php
// Transition + note + save, in one call.
$order->update_status( 'processing', 'Stock allocated.' );

// Lower-level: set the status field (returns [from, to]); you save yourself.
[ $from, $to ] = $order->set_status( 'on_hold' );
$order->save();
```

| Method | Behavior |
| --- | --- |
| `update_status( string $new, string $note = '', bool $manual = false )` | Transitions, notes, and saves. Returns `bool`. |
| `set_status( string $new, string $note = '', bool $manual = false )` | Sets the status field, returns `[from, to]`. Does not save on its own. |

Valid statuses and allowed transitions are governed by the status state machine — see [Order Statuses](/data/order-statuses).

## Completing payment

When a gateway confirms payment, call `payment_complete()`. It moves the order to a paid state, stamps the paid date, and records the transaction id:

```php
$order->payment_complete( $gateway_transaction_id );

if ( $order->is_paid() ) {
	// fulfill
}
```

To force an order to paid regardless of gateway state (e.g. manual/offline payment reconciliation):

```php
$order->mark_as_paid_force( 'Marked paid manually after bank transfer.' );
```

## See also

- [Order Statuses](/data/order-statuses) — the transition state machine.
- [Products](/data/products) — the `Price` object `add_product()` expects.
- [Subscriptions](/data/subscriptions) — orders with a recurring schedule.
- [REST API › Orders](/rest-api/orders) — managing orders over HTTP.
- [Hooks › Actions](/reference/hooks/actions) — order lifecycle hooks.
