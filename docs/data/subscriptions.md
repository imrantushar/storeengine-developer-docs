---
title: "The Subscription Object"
description: "StoreEngine's Subscription object — an Order subclass for recurring billing. Load subscriptions, read schedule dates, drive the lifecycle, handle renewals, and fetch related orders."
sidebar_label: "Subscriptions"
keywords: [storeengine, subscription object, recurring billing, renewal, subscription status, schedule, subscription addon]
---

Subscriptions model recurring billing. The `StoreEngine\Addons\Subscription\Classes\Subscription` object **extends `Order`**, so every method described in [Orders](/data/orders) — totals, items, addresses, `payment_complete()` — applies here too. A subscription is stored in the shared `wp_storeengine_orders` table with `type = 'subscription'`, and its schedule detail lives in `wp_storeengine_subscriptions`.

:::note[Requires the Subscription addon]
`Subscription` ships with the Subscription addon (`addons/subscription/`). The class and its schedule table only exist when that addon is active. Guard your integration accordingly.
:::

## Loading subscriptions

The constructor takes an id (like `Order`), but the static helpers are usually more convenient:

```php
use StoreEngine\Addons\Subscription\Classes\Subscription;

$sub = new Subscription( 456 );                       // by id
$sub = Subscription::get_subscription( 456 );         // ?Subscription

// All subscriptions created from a given order
$subs = Subscription::get_subscriptions_by_order_id( $order_id );

// Filter by status
$active = Subscription::get_subscriptions_by_status( 'active' );
```

## Schedule getters

Date getters return a `StoreEngineDateTime`:

| Method | Meaning |
| --- | --- |
| `get_start_date()` | When the subscription began. |
| `get_next_payment_date()` | Next scheduled renewal charge. |
| `get_last_payment_date()` | Most recent successful charge. |
| `get_end_date()` | Scheduled end, if any. |
| `get_trial_end_date()` | End of the trial period. |
| `get_cancelled_date()` | When it was cancelled. |
| `get_payment_retry_date()` | Next retry after a failed payment. |
| `get_period()` / `get_period_interval()` | Billing period (day/week/month/year) and interval. |
| `get_payment_duration()` / `get_payment_duration_type()` | Total billing length. |
| `get_trial()` / `get_trial_days()` | Trial config. |
| `get_suspension_count()` | Times suspended. |

You can also fetch any date generically:

```php
$dt = $sub->get_date( 'next_payment', 'gmt' );
```

## Lifecycle

Status transitions use the same `set_status()` / `update_status()` pattern as orders, and are validated against the subscription state machine:

```php
// Pause and resume are status changes:
$sub->update_status( 'on_hold', 'Paused by customer.' );
$sub->update_status( 'active', 'Resumed.' );

// Check what's allowed before transitioning
if ( $sub->can_be_updated_to( 'cancelled' ) ) {
	$sub->update_status( 'cancelled' );
}

$valid = $sub->get_valid_statuses();
```

Payment outcomes:

```php
$sub->payment_complete( $transaction_id );  // successful renewal
$sub->payment_failed( 'on_hold' );          // failed charge → new status
$sub->payment_refunded();                   // refund handling
```

Manual-renewal state:

```php
if ( $sub->is_manual() || $sub->get_requires_manual_renewal() ) {
	// no automatic charge; customer must pay each renewal
}
```

See [Order Statuses](/data/order-statuses) for the subscription status table and the `storeengine/subscription/ended_statuses` filter.

## Related orders

A subscription is linked to an initial order and to renewal/switch orders:

```php
$initial_id = $sub->get_initial_order_id();
$order_ids  = $sub->get_related_order_ids( 'renewal' ); // 'parent' | 'renewal' | 'switch' | 'any'
$orders     = $sub->get_related_orders();               // Order[]
```

## See also

- [Orders](/data/orders) — the base class; all its methods apply.
- [Order Statuses](/data/order-statuses) — subscription status machine.
- [Coupons](/data/coupons) — recurring discount fields.
- [REST API › Subscriptions](/rest-api/subscriptions) — the subscription HTTP API.
