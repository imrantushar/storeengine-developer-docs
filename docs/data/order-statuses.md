---
title: "Order Status State Machine"
description: "StoreEngine's order status system — the full status list, the OrderContext state machine with triggers and proceed_to_next_status, subscription statuses, and safe transitions."
sidebar_label: "Order Statuses"
keywords: [storeengine, order status, state machine, order context, update_status, subscription status, transitions]
---

Order status in StoreEngine is a **state machine**, not a free-form field. Each status is a class that declares which statuses it can transition to and which triggers cause those transitions. This keeps orders from jumping to invalid states.

## The pieces

- **Status classes** live in `includes/classes/order-status/` and implement the interface in `includes/interfaces/order-status.php`. Each defines a `const STATUS` and implements:
  - `get_status()` / `get_status_title()` — slug and label
  - `get_possible_next_statuses()` — allowed transitions
  - `get_possible_triggers()` — trigger names this status responds to
  - `proceed_to_next_status( OrderContext $context, $trigger )` — perform the transition
- **`OrderContext`** (`includes/classes/order-context.php`) is the state-machine driver. It holds the current status and applies triggers, delegating to the current status class.

## Order statuses

| Status | Meaning |
| --- | --- |
| `draft` | Order being built, not yet placed. |
| `auto-draft` | System-created placeholder draft. |
| `pending_payment` | Placed, awaiting payment. |
| `payment_confirmed` | Payment received and confirmed. |
| `payment_failed` | Payment attempt failed. |
| `processing` | Paid; being fulfilled. |
| `on_hold` | Paused, awaiting action (e.g. manual review). |
| `completed` | Fulfilled and closed. |
| `cancelled` | Cancelled before completion. |
| `refunded` | Payment refunded. |
| `active` | Active (used for access/subscription-style orders). |
| `pending_cancel` | Cancellation requested, still active until period end. |
| `trash` | Trashed. |

## How transitions work

Rather than setting the status field directly, the state machine advances the order by applying a **trigger** to the current `OrderContext`. The current status class inspects the trigger, validates it against its allowed next statuses, and calls `proceed_to_next_status()`:

```php
// Conceptually: the context holds the current status and applies a trigger.
$context = new OrderContext( $order->get_status() );
$context->proceed_to_next_status( 'payment_received', $order );
```

Because `get_possible_next_statuses()` constrains each status, an invalid jump (e.g. `completed` → `pending_payment`) is rejected.

## Transitioning safely from your code

For most integrations you do not touch `OrderContext` directly. Use the `Order` methods, which run the transition and persist it:

```php
// Preferred: transition + note + save.
$order->update_status( 'processing', 'Payment cleared.' );

// When a gateway confirms payment, this drives the correct transition for you:
$order->payment_complete( $transaction_id );
```

`set_status()` sets the field and returns `[from, to]` but does not save on its own — prefer `update_status()`. See [Orders › Changing status](/data/orders).

:::tip[Let payment_complete() drive paid transitions]
On successful payment, call `payment_complete()` rather than manually setting `processing`/`completed`. It moves the order through the right states, stamps the paid date, and records the transaction.
:::

## Subscription statuses

Subscriptions have their own status set, defined by `SubscriptionCollection::get_subscription_statuses()` with constants `Constants::SUBSCRIPTION_STATUS_*`:

| Status | Meaning |
| --- | --- |
| `pending` | Created, not yet active. |
| `active` | Billing normally. |
| `on_hold` | Paused (no charges). |
| `pending_cancel` | Cancellation scheduled; runs until period end. |
| `cancelled` | Cancelled. |
| `expired` | Reached its end/duration. |
| `switched` | Replaced by a switch to another plan. |
| `completed` | Finished its full term. |

### Ended statuses

The set of statuses considered "ended" (terminal) is filterable:

```php
// filter: storeengine/subscription/ended_statuses
// Defaults: cancelled, trash, expired, switched, pending_cancel
add_filter( 'storeengine/subscription/ended_statuses', function ( array $statuses ) {
	return $statuses;
} );
```

Transition subscriptions the same way as orders, and check `can_be_updated_to()` first — see [Subscriptions › Lifecycle](/data/subscriptions).

## See also

- [Orders](/data/orders) — `update_status()`, `set_status()`, `payment_complete()`.
- [Subscriptions](/data/subscriptions) — subscription lifecycle.
- [Hooks › Actions](/reference/hooks/actions) — status-change hooks.
