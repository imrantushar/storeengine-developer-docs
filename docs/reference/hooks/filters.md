---
title: "Filter Hooks Reference"
description: "Complete reference of StoreEngine filter hooks — modify checkout, pricing and tax, cart, order display, email, payment gateways, templates, REST, and addon settings with full signatures."
sidebar_label: "Filters"
keywords: [storeengine hooks, storeengine filters, storeengine filter hooks, apply_filters, checkout filters, price tax filters, template path, rest api filters, wordpress ecommerce hooks]
---

StoreEngine exposes **filter hooks** wherever a value can reasonably be customized — a product price, a tax calculation, the place-order button label, the file a template resolves to, the REST batch limit, and much more. Hook into these with `add_filter()`, transform the first argument, and **always return it**.

This page lists confirmed filter hooks grouped by domain, with their argument signatures and purpose. To *react* to events instead of changing values, see [Action hooks](/reference/hooks/actions).

## How to use

```php
add_filter(
	'storeengine/checkout/place_order_button_text',
	function ( $label, $needs_payment ) {
		return $needs_payment ? __( 'Pay securely now', 'my-textdomain' ) : $label;
	},
	10,
	2 // this filter passes two arguments — declare every one you read.
);
```

The first parameter is the value being filtered; return it (modified or untouched). Never return `null` or omit the return — that discards the value for every consumer downstream.

:::tip
Many pricing filters run on hot paths (every cart calculation, every product render). Keep callbacks cheap and side-effect free. For heavier work, react to an [action hook](/reference/hooks/actions) instead.
:::

## Checkout

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/checkout/create_customer_data` | `(array $userdata)` | Adjust the user data used to create an account during checkout. |
| `storeengine/checkout/require_email` | `($require, $data)` | Toggle whether an email address is required at checkout. |
| `storeengine/checkout/place_order_button_text` | `($label, $needs_payment)` | Change the place-order button label; `$needs_payment` flags whether payment is due. |
| `storeengine/checkout/validate` | `($pre_validation, $data)` | Short-circuit or extend checkout validation. Return a `WP_Error` to block, or `null` to defer to core validation. |
| `storeengine/checkout/fields_schema` | `($schema)` | Modify the checkout field schema (add, remove, or reorder fields). |
| `storeengine/checkout/publishable_key_auth` | `($result, $request)` | Headless publishable-key authentication for the checkout REST surface. See [REST authentication](/rest-api/authentication). |

## Pricing & tax

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/product/get_price` | `($price, $context)` | Filter a product's price. `$context` is typically `view` or `edit`. Multi-currency converts here. |
| `storeengine/product/get_compare_price` | `($compare_price, $context)` | Filter a product's compare-at (regular) price. |
| `storeengine/product/is_taxable` | `($is_taxable, $product)` | Override whether a product is taxable. |
| `storeengine/get_price_html` | `($html, $product)` | Filter the formatted price HTML shown on the storefront. |
| `storeengine/calc_tax` | `($taxes, $price, $rates, $price_includes_tax)` | Override tax line calculation for a price against a set of rates. |
| `storeengine/price_inc_tax_amount` | `($tax_amount, $key, $rate, $price)` | Adjust the tax amount extracted from a tax-inclusive price. |
| `storeengine/price_ex_tax_amount` | `($tax_amount, $key, $rate, $price)` | Adjust the tax amount added onto a tax-exclusive price. |
| `storeengine/adjust_non_base_location_prices` | `(bool $adjust)` | Whether to adjust displayed prices for non-base customer locations. |
| `storeengine/coupon_get_discount_amount` | `($discount, $price_to_discount, $item, false, $coupon)` | Override the discount amount a coupon applies to an item. |
| `storeengine/coupon_get_apply_quantity` | `($apply_quantity, $item, $coupon, $discounts)` | Override the quantity a coupon applies to. |

See [Coupons](/data/coupons) for the discount engine.

## Cart

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/cart/snapshot` | `($snapshot, $cart)` | Modify the serialized cart snapshot (used for persistence and REST). |
| `storeengine/cart/needs_payment` | `($needs_payment, $cart)` | Override whether the current cart requires payment. |
| `storeengine/cart/needs_shipping` | `($needs_shipping, $cart)` | Override whether the cart requires shipping. |
| `storeengine/cart/product_price` | `($price, $cart_item)` | Filter the per-item display price in the cart. |
| `storeengine/cart/product_subtotal` | `($subtotal, $cart_item)` | Filter the per-item subtotal in the cart. |
| `storeengine/cart/get_total` | `($total, $cart)` | Filter the cart grand total. |
| `storeengine/cart/get_subtotal` | `($subtotal, $cart)` | Filter the cart subtotal. |
| `storeengine/calculated_total` | `($total, $cart)` | Filter the final calculated total after all lines are summed. |

See [Cart](/data/cart) for the full cart object.

## Order display

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/get_formatted_order_total` | `($formatted_total, $order)` | Filter the formatted order total string. |
| `storeengine/get_order_item_totals` | `($total_rows, $order, $tax_display)` | Filter the totals rows table (subtotal, shipping, tax, total) shown for an order. |
| `storeengine/order_statuses` | `($order_statuses)` | Register or relabel order statuses. See [Order statuses](/data/order-statuses). |
| `storeengine/order/valid_statuses_for_cancel` | `($statuses, $order)` | Which statuses allow an order to be cancelled. |
| `storeengine/order/valid_statuses_for_payment` | `($statuses, $order)` | Which statuses accept a payment. |
| `storeengine/order_needs_payment` | `($needs_payment, $order, $valid_statuses)` | Override whether an order still needs payment. |
| `storeengine/order_number` | `($order_number, $order)` | Customize the displayed order number. |
| `storeengine/order_formatted_billing_address` | `($address, $order)` | Filter the formatted billing address. |
| `storeengine/order_formatted_shipping_address` | `($address, $order)` | Filter the formatted shipping address. |

## Email

Emails are triggered by hooking [`storeengine/order/status_changed`](/reference/hooks/actions#order-lifecycle) — there is no per-email `do_action`. These filters shape how the email addon builds and sends messages.

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/email/settings_fields` | `($fields)` | Register or modify email settings fields. |
| `storeengine/email/settings_default_data` | `($defaults)` | Provide default values for email settings (deep-merged). |
| `storeengine/email/mail_send_arguments` | `($args)` | Modify the arguments passed to the mailer (to, subject, headers, body). |
| `storeengine/email/admin_reply_to` | `($header, $order, $email_name)` | Set the Reply-To header for admin notifications. |
| `storeengine/email/{id}` | *(varies)* | Dynamic per-template filter, named for the email `{id}`, applied while rendering that specific template. |
| `storeengine/email_log/resend_handlers` | `($handlers)` | Register handlers that know how to resend a logged email. |
| `storeengine/email_log/next_capture_payload` | `($extra)` | Add extra data captured with the next logged email. |

## Payment gateways

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/payment_gateways` | `($gateways)` | Register or filter the raw gateway list. |
| `storeengine/available_payment_gateways` | `($gateways)` | Filter the gateways available for the current cart/context. |
| `storeengine/payment_settings_fields` | `($fields)` | Register or modify payment settings fields. |
| `storeengine/payment_methods_list_item` | `($item, $payment_token)` | Filter a saved-payment-method row in the customer's payment methods list. |
| `storeengine/payment_gateway_supports` | `($supports, $feature, $gateway)` | Declare gateway feature support (refunds, tokenization, subscriptions…). |
| `storeengine/payment_complete_order_status` | `($status, $order_id, $order)` | The status an order moves to on successful payment. |

## Templates

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/template_path` | `($path)` | The theme sub-directory StoreEngine looks in (default `'storeengine/'`). |
| `storeengine/plugin_path` | `($path)` | The plugin's base path used to resolve bundled templates. |
| `storeengine/locate_template` | `($template, $template_name, $template_path)` | Override the resolved absolute path of a located template. |
| `storeengine/get_template` | `($template, $template_name, $args, $template_path, $default_path)` | Override the template file used by `get_template()`. |
| `storeengine/get_template_part` | `($template, $slug, $name)` | Override the file resolved for a template part. |
| `storeengine/template/get_content` | `($rendered, $template_name, $args, $template_path, $default_path)` | Filter the rendered output of a template. |

See [Templates](/reference/templates) for the override hierarchy and pairing action hooks.

## Addons & settings

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/addons/loader_args` | `($addons)` | Register core addons with the loader (slug → class map). |
| `storeengine_pro/addons/loader_args` | `($addons)` | Register Pro addons with the loader. |
| `storeengine/addons/dependencies` | `($dependencies)` | Declare inter-addon dependencies. See [Dependencies](/addons/architecture). |
| `storeengine/admin/settings_default_data` | `($defaults)` | Default values for the admin settings store (deep-merged). |
| `storeengine/ajax/settings_fields` | `($fields)` | Register or modify admin settings fields. |
| `storeengine/ajax/validate_settings` | `($errors, $payload)` | Validate settings on save; add to the `WP_Error` to block invalid input. |
| `storeengine/subscription/ended_statuses` | `($statuses)` | Statuses considered "ended" for a subscription. |

## REST API

| Hook name | Arguments (signature) | Purpose |
| --- | --- | --- |
| `storeengine/rest_user_capability` | `($capability, $capability_context)` | Override the capability required for a REST operation. |
| `storeengine/rest_batch_items_limit` | `($limit, $rest_base)` | Cap the number of items accepted per batch request (default `100`). |
| `storeengine/rest_{object_type}_schema` | `($properties)` | Dynamic: filter the schema properties for a REST object type (e.g. `storeengine/rest_order_schema`). |
| `storeengine/api/cart/cart_schema` | `($schema)` | Filter the cart REST schema. |
| `storeengine/api/order/item_schema` | `($schema)` | Filter the order-item REST schema. |
| `storeengine/incoming_webhook/handlers` | `($handlers)` | Register handlers for inbound webhook actions. |
| `storeengine/webhooks_event_listeners` | `($listeners)` | Register outbound webhook event listeners. |

See the [REST API overview](/rest-api/overview) for endpoint conventions.

---

Looking to *react* to events (order placed, payment complete, item shipped) instead of transforming values? See the [Action hooks reference](/reference/hooks/actions).
