---
title: "Data & Objects Recipes"
description: "Copy-paste PHP recipes for StoreEngine — fetch a product, create and pay an order, add to cart by price_id, apply a coupon, load a customer, and read subscriptions."
sidebar_label: "Recipes"
keywords: [storeengine, php recipes, create order, add to cart, price_id, load customer, coupon, subscription api]
---

Practical, copy-paste recipes for working with StoreEngine's domain objects. They use the exact factory and helper patterns the objects expect.

:::note No `storeengine_get_*` globals
StoreEngine does not provide global getter functions like `storeengine_get_order()`. Instantiate the domain classes directly, or use `StoreEngine\Utils\Helper` and `StoreEngine\Classes\ProductFactory`.
:::

## Fetch a product and its prices

```php
use StoreEngine\Utils\Helper;

$product = Helper::get_product( 42 ); // AbstractProduct|false
if ( ! $product ) {
	return;
}

echo esc_html( $product->get_name() );

foreach ( $product->get_prices() as $price ) {
	$price_id = $price->get_id();   // the purchasable price_id
	printf( '%s: %0.2f', esc_html( $price->get_name() ), $price->get_price() );
}
```

Resolve the product that owns a `price_id`:

```php
use StoreEngine\Classes\ProductFactory;

$product = ( new ProductFactory() )->get_product_by_price_id( $price_id );
```

## Create an order and mark it paid

```php
use StoreEngine\Classes\Order;
use StoreEngine\Utils\Helper;

$order = new Order();
$order->set_currency( 'USD' );

$product = Helper::get_product( 42 );
$price   = $product->get_prices()[0];  // a Price object

$order->add_product( $price, 1 );      // add_product() takes a Price, not an id
$order->save();                        // persist; assigns id + order number

// Later, when the gateway confirms payment:
$order->payment_complete( $gateway_transaction_id );

if ( $order->is_paid() ) {
	// fulfill the order
}
```

Force an order to paid (manual/offline reconciliation):

```php
$order->mark_as_paid_force( 'Paid by bank transfer.' );
```

## Add to cart by price_id and apply a coupon

```php
use StoreEngine\Utils\Helper;

$cart = Helper::cart();

// add_product_to_cart( int $price_id, int $quantity = 1, ... )
$cart->add_product_to_cart( $price_id, 2 );

$cart->apply_coupon( 'WELCOME10' );
$cart->calculate_totals();

$subtotal = $cart->get_cart_subtotal();
$discount = $cart->get_total_discount();

if ( $cart->needs_shipping() ) {
	$methods = $cart->get_shipping_methods();
}
```

Update or remove using the item key:

```php
foreach ( $cart->get_cart_items() as $item_key => $item ) {
	$cart->update_quantity( $item_key, 3 );
	// $cart->remove_cart_item( $item_key );
}
```

## Load a customer

```php
use StoreEngine\Classes\Customer;

$customer = new Customer( get_current_user_id() );
$customer->get();

$name    = $customer->get_display_name();
$email   = $customer->get_email();
$orders  = $customer->get_total_orders();
$spent   = $customer->get_total_spent();
$country = $customer->get_billing_country();

// Update an address:
$customer->set_shipping_location( 'US', 'CA', '94016', 'San Francisco' );
$customer->save();
```

## Load a coupon and calculate a discount

```php
use StoreEngine\Classes\Coupon;

$coupon = new Coupon( 'WELCOME10' );

if ( $coupon->get_id() && $coupon->is_valid_for_cart() ) {
	$type       = $coupon->get_discount_type();
	$discounted = $coupon->calculate( 100.00 );
	$discount   = $coupon->get_discount_amount( 100.00 );
}
```

## Load subscriptions for an order

Requires the Subscription addon.

```php
use StoreEngine\Addons\Subscription\Classes\Subscription;

$subs = Subscription::get_subscriptions_by_order_id( $order_id );

foreach ( $subs as $sub ) {
	$status = $sub->get_status();
	$next   = $sub->get_next_payment_date();     // StoreEngineDateTime
	$orders = $sub->get_related_orders();        // Order[]
}

// Or fetch one directly, or filter by status:
$one    = Subscription::get_subscription( 456 );
$active = Subscription::get_subscriptions_by_status( 'active' );
```

## See also

- [Orders](/data/orders) · [Products](/data/products) · [Cart](/data/cart)
- [Customers](/data/customers) · [Coupons](/data/coupons) · [Subscriptions](/data/subscriptions)
- [Order Statuses](/data/order-statuses) — safe status transitions.
