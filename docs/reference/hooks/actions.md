---
title: "Action Hooks Reference"
description: "Complete reference of StoreEngine action hooks — order lifecycle, payments, refunds, checkout, cart, stock, subscriptions, templates, and addon lifecycle events with full signatures."
sidebar_label: "Actions"
keywords: [storeengine hooks, storeengine actions, storeengine action hooks, do_action, order status changed, payment complete, checkout hooks, cart hooks, wordpress ecommerce hooks]
---

StoreEngine fires **action hooks** at every meaningful point in the commerce flow — when an order changes status, a payment completes, a refund is created, an item is added to the cart, a subscription renews, and so on. Hook into these with `add_action()` to run side effects such as syncing to a CRM, sending a notification, or writing an audit log.

This page lists every confirmed action hook grouped by domain, with its full argument signature and when it fires. For hooks that let you *change* a value, see [Filter hooks](/reference/hooks/filters).

## How to use

```php
add_action(
	'storeengine/order/status_changed',
	function ( $order_id, $old_status, $new_status, $order ) {
		if ( 'completed' === $new_status ) {
			// Fulfill, notify, sync — runs after every order that reaches "completed".
			my_crm_sync_order( $order );
		}
	},
	10,
	4 // status_changed passes four arguments — declare all you consume.
);
```

Always declare the correct accepted-args count (the fourth parameter of `add_action`). StoreEngine namespaces every hook under `storeengine/`, so you can safely target them without collision.

:::tip
`storeengine/order/status_changed` is the backbone of order automation. The email addon subscribes to it rather than firing a per-email `do_action` — there is no dedicated "order completed email" hook. To send your own mail on a transition, hook `status_changed` and check `$new_status`. See [Order statuses](/data/order-statuses) for the full status set and transition rules.
:::

## Order lifecycle

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/order/status_changed` | `($order_id, $old_status, $new_status, $order)` | After an order transitions from one status to another. The primary post-order automation hook; the email addon listens here. |
| `storeengine/order/status_{$new_status}` | `($order_id, $old_status, $order)` | Dynamic variant fired alongside `status_changed`, named for the destination status (e.g. `storeengine/order/status_completed`). Convenient when you only care about one target status. |
| `storeengine/order_edit_status` | `($order_id, $new_order_status)` | Lower-level status write, before `status_changed` and before the transition is finalized. |
| `storeengine/order/proceed_to_next_status` | `($trigger, $order, $args)` | The order state machine advancing to its next status. `$trigger` is the event that caused the advance. |
| `storeengine/order_payment_status_changed` | `($order_id, $order)` | When an order's payment status (paid/unpaid) changes, independent of the order status. |
| `storeengine/models/after_create_order` | `($order)` | After a new order row is inserted at the model layer. |
| `storeengine/models/after_update_order` | `($order)` | After an order row is updated at the model layer. |
| `storeengine/api/after_create_order` | `($order)` | After the REST API creates an order. Pairs with `storeengine/api/before_create_order`. |
| `storeengine/api/after_update_order` | `($order)` | After the REST API updates an order. |
| `storeengine/api/after_delete_order` | `($order)` | After the REST API deletes an order. |
| `storeengine/api/order/add_order_item` | `($item, $order)` | After a line item is added to an order via the REST API. |
| `storeengine/api/order/update_order_item` | `($item, $order)` | After a REST-API line-item update. |
| `storeengine/api/order/delete_order_item` | `($item_id, $order)` | After a REST-API line-item deletion. |
| `storeengine/order/removed_order_items` | `($order, $type)` | After order items of a given `$type` are removed from an order. |
| `storeengine/order/note_added` | `($comment_id, $order)` | After a note (private or customer) is added to an order. |
| `storeengine/order/note_deleted` | `($note_id, $note)` | After an order note is deleted. |
| `storeengine/new_customer_note` | `(array $args)` | After a customer-facing order note is created (payload array). |
| `storeengine/order/new_customer_note` | `($note, $order)` | Object-oriented variant fired with the note and order objects. |
| `storeengine/order/applied_coupon` | `($coupon, $order)` | After a coupon is applied to an order. |
| `storeengine/order/payment_token_added` | `($order_id, $token_id, $token, $token_ids)` | After a saved payment token is attached to an order. |
| `storeengine/order/settlement_recorded` | `($order, $captured_amount, $mismatch)` | After a captured settlement is recorded; `$mismatch` flags a captured-vs-expected discrepancy. |
| `storeengine/order/item_shipped` | `($order_id, $order_item_id, $product_id, $shipment, $new_status)` | After an order item is marked shipped. |

See [Orders](/data/orders) for the order object model and [Order statuses](/data/order-statuses) for the status vocabulary.

## Payment & completion

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/pre_payment_complete` | `($order_id, $transaction_id)` | Just before an order is marked payment-complete. Use to run last-minute checks. |
| `storeengine/payment_complete` | `($order_id, $transaction_id)` | After payment is recorded complete for an order. |
| `storeengine/payment_gateways_initialized` | `($gateways)` | After the payment gateway registry is built and gateways are loaded. |
| `storeengine/payment_token/set_default` | `($token_id, $token)` | After a customer sets a saved payment method as their default. |

## Refunds

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/create_refund` | `($refund, $args)` | While a refund object is being created, before it is finalized. |
| `storeengine/order/refund_created` | `($refund, $args)` | After a refund record is created for an order. |
| `storeengine/order/order_refunded` | `($order_id, $refund_id)` | After an order is refunded (fires for both partial and full refunds). |
| `storeengine/order/partially_refunded` | `($order_id, $refund_id, $remaining_amount)` | After a partial refund, when a balance remains. |
| `storeengine/order/fully_refunded` | `($order_id, $refund_id)` | After a refund brings the order to fully refunded. |
| `storeengine/order/order_cancelled` | `($order_id)` | After an order is cancelled by the customer or admin. |

## Checkout

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/frontend/checkout/before_place_order` | `($order)` | Just before the draft order is placed at the frontend checkout. |
| `storeengine/checkout/before_place_order_payload` | `($payment_data, $payment_method)` | Before the place-order payload is dispatched to the gateway. |
| `storeengine/checkout/before_pay_order_payload` | `($payment_data, $payment_method, $order)` | Before the pay-for-existing-order payload is dispatched. |
| `storeengine/checkout/order_processed` | `($order, $payload)` | After the order is processed but before redirect/response. |
| `storeengine/checkout/after_place_order` | `($order, $payload)` | After a new checkout order is fully placed. |
| `storeengine/checkout/after_pay_order` | `($order)` | After payment completes for an existing (pay-for-order) flow. |
| `storeengine/frontend/checkout/update_checkout` | `($draft_order)` | When the checkout is refreshed (address/shipping/coupon change re-computes the draft order). |
| `storeengine/checkout/customer_created` | `($user_id, $userdata)` | After a guest account is created during checkout. |

### Order-item creation during checkout

These fire as each line of the order is built from the cart. Useful for copying custom cart-item data onto the persisted order item.

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/checkout/create_order_line_item` | `($item, $values, $order)` | After a product line item is created. |
| `storeengine/checkout/create_order_fee_item` | `($item, $fee, $order)` | After a fee line item is created. |
| `storeengine/checkout/create_order_setup_fee_item` | `($item, $cart_item, $order)` | After a subscription setup-fee line item is created. |
| `storeengine/checkout/create_order_shipping_item` | `($shipping_item, $shipping_rate, $order)` | After a shipping line item is created. |
| `storeengine/checkout/create_order_coupon_item` | `($item, $coupon, $order)` | After a coupon line item is created. |
| `storeengine/checkout/create_order_tax_item` | `($item, $tax_rate_id, $order)` | After a tax line item is created. |

## Cart

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/cart/add_to_cart` | `($cart_id, $price_id, $product_id, $variation_id, $quantity, $item_data)` | Low-level: a product has been added to the cart store. |
| `storeengine/cart/added_to_cart` | `($params)` | After the add-to-cart REST request succeeds (request params array). |
| `storeengine/ajax/cart/added_to_cart` | `($params)` | AJAX counterpart of `added_to_cart`, fired for the AJAX add flow. |
| `storeengine/cart/item_update_quantity` | `($item_key, $quantity, $cart)` | When a cart item's quantity is set. |
| `storeengine/cart/after_item_quantity_update` | `($cart_item, $old_quantity, $cart)` | After a cart item's quantity change is applied. |
| `storeengine/cart/check_items` | *(none)* | Cart validation pass — re-validate stock, prices, and availability. |
| `storeengine/cart/before_calculate_totals` | `($cart)` | Before cart totals are recalculated. |
| `storeengine/cart/after_calculate_totals` | `($cart)` | After cart totals are recalculated. |
| `storeengine/calculate_totals` | `($cart)` | Totals calculation entry point on the cart object. |
| `storeengine/cart/calculate_fees` | `($cart)` | While cart fees are being calculated — the place to register custom fees. |
| `storeengine/cart/calculated_shipping` | *(none)* | After shipping rates for the cart have been calculated. |
| `storeengine/cart/reset` | `($cart)` | After the cart is reset/emptied. |
| `storeengine/cart/deleted` | `($cart_ids)` | After cart records are deleted. |
| `storeengine/cart/set_cart_cookies` | `($set)` | When cart cookies are set or cleared. |

See [Cart](/data/cart) for the cart object and item structure.

## Stock & product delivery

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/order/stock_reduced` | `($product_id, $variation_id, $qty, $order_id)` | After stock is reduced for an order line. |
| `storeengine/order/stock_restored` | `($product_id, $variation_id, $qty, $order_id)` | After stock is restored (e.g. on cancel/refund). |
| `storeengine/stock_status_changed` | `($product_id, $price_id, $from, $to)` | When a product's stock status (in/out of stock) changes. |
| `storeengine/before_single_product_delivered` | `($product_id, $order_id, $current_status, $new_status)` | Before a single downloadable/deliverable product is marked delivered. |
| `storeengine/after_single_product_delivered` | `($product_id, $order_id, $current_status, $new_status)` | After a single product is marked delivered. |
| `storeengine/all_product_delivered` | `($order_id)` | After every deliverable item in an order has been delivered. |

See [Products](/data/products) for the product/price model.

## Subscriptions

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/before_create_subscription` | `($args)` | Before a subscription is created. |
| `storeengine/after_create_subscription` | `($subscription)` | After a subscription object is created. |
| `storeengine/subscription/status_changed` | `($subscription_id, $from, $to, $subscription)` | After a subscription transitions status (active, on-hold, cancelled, expired…). |
| `storeengine/change_subscription_status` | `($subscription)` | While a subscription status change is applied. |
| `storeengine/subscription/payment_complete` | `($subscription)` | After a subscription payment completes (initial or renewal). |
| `storeengine/subscription/renewal_payment_complete` | `($subscription, $last_order)` | After a renewal-order payment completes. |
| `storeengine/subscription/activated_for_order` | `($subscription, $order)` | When a subscription is activated for its parent order. |
| `storeengine/subscription/trial_ended` | `($subscription)` | When a subscription's trial period ends. |

See [Subscriptions](/data/subscriptions) for the subscription lifecycle.

## Templates

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/before_template_part` | `($template_name, $template_path, $located, $args)` | Before a template part is included. |
| `storeengine/after_template_part` | `($template_name, $template_path, $located, $args)` | After a template part is included. |

To *change which file* is loaded rather than inject around it, use the template [filters](/reference/hooks/filters#templates). See [Templates](/reference/templates) for the override mechanism.

## Addon lifecycle

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/addons/loaded` | *(none)* | After all active addons have been loaded and booted. |
| `storeengine/addons/{slug}/loaded` | *(none)* | Dynamic: after the addon identified by `{slug}` boots (e.g. `storeengine/addons/subscription/loaded`). |
| `storeengine/addons/activated_{slug}` | *(none)* | Dynamic: after the `{slug}` addon is activated. |
| `storeengine/addons/deactivated_{slug}` | *(none)* | Dynamic: after the `{slug}` addon is deactivated. |

See [Building Addons](/addons/architecture) for the init-run-gate-boot lifecycle these hooks bracket.

## Addon-specific events

Fired only when the owning addon is active.

| Hook name | Arguments (signature) | Fires / Purpose |
| --- | --- | --- |
| `storeengine/membership/user_added_to_group` | `($user_id, $group_id)` | Membership: a user is added to a membership group. |
| `storeengine/membership/user_removed_from_group` | `($user_id, $group_id)` | Membership: a user is removed from a group. |
| `storeengine/addons/affiliate/after_registration` | `($affiliate_id)` | Affiliate: after an affiliate registers. |
| `storeengine/addons/affiliate/update_status` | `($affiliate_id, $status)` | Affiliate: after an affiliate's status changes. |
| `storeengine/addons/affiliate/commission_reversed` | `($commission_id, $order)` | Affiliate: after a commission is reversed (e.g. on refund). |
| `storeengine/multi_vendor/vendor_registered` | `($vendor)` | Multi-vendor: after a vendor registers. |
| `storeengine/multi_vendor/vendor_approved` | `($vendor)` | Multi-vendor: after a vendor is approved. |
| `storeengine/multi_vendor/commission_computed` | `($order_id)` | Multi-vendor: after commissions are computed for an order. |
| `storeengine/multi_vendor/payout_recorded` | `($vendor_id, $amount)` | Multi-vendor: after a vendor payout is recorded. |
| `storeengine/courier/shipment_created` | `($shipment_id, $order_id, $provider_id)` | Connectors: after a courier shipment is created. |
| `storeengine/courier/shipment_status_updated` | `($shipment_id, $status, $internal_status, $delivered)` | Connectors: after a shipment status update. |
| `storeengine/multi_currency/switched` | `($previous, $currency)` | Multi-currency: after the active display currency changes. |
| `storeengine/incoming_webhook/received` | `($payload, $context)` | Webhooks: after a verified inbound webhook is received. |
| `storeengine/webhook/delivery` | `($http_args, $response, $duration, $http_args, $webhook_id)` | Webhooks: after an outbound webhook delivery attempt. |

---

Looking to *modify* values (prices, tax, labels, template paths, REST limits) rather than react to events? See the [Filter hooks reference](/reference/hooks/filters).
