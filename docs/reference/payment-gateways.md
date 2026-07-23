---
title: "Building a Payment Gateway"
description: "Build a custom StoreEngine payment gateway: extend the PaymentGateway base class, declare settings and supports, register lazily, process payments and refunds, plus a minimal skeleton."
sidebar_label: "Payment Gateways"
keywords: [storeengine, payment gateway, custom gateway, process_payment, PaymentGateway, GatewayAdapterInterface, storeengine payment_gateways]
---

A StoreEngine payment gateway is a PHP class that extends `StoreEngine\Payment\Gateways\PaymentGateway` (`includes/payment-gateways/payment-gateway.php`), declares its id, settings, and capabilities, and implements `process_payment()`. The `Payment_Gateways` registry (`includes/payment-gateways.php`) discovers, boots, and materializes gateways lazily, so a store with 20 registered gateways only instantiates the two or three that are enabled.

This page shows the base class contract, how to register, and a minimal working gateway.

:::caution Use the modern base class
`StoreEngine\Classes\AbstractPaymentGateway` and `AbstractPaymentGateways` are **deprecated**. Always extend `StoreEngine\Payment\Gateways\PaymentGateway`.
:::

## The base class contract

Extend `PaymentGateway` and set your identity and capabilities in the constructor. Key public/protected properties:

| Property | Type | Purpose |
| --- | --- | --- |
| `$id` | `string` | Unique gateway id (e.g. `stripe`, `razorpay`). Drives its option key and hooks. |
| `$title` / `$description` | `string` | Customer-facing title/description at checkout. |
| `$method_title` / `$method_description` | `string` | Admin-facing name/description in settings. |
| `$icon` | `string` | Icon URL. |
| `$has_fields` | `bool` | Whether the gateway renders extra fields at checkout. |
| `$supports` | `array` | Declared features (default `['products']`). |
| `$index` | `int` | Sort order among gateways. |
| `$max_amount` | `int` | Optional max transaction amount (0 = no cap). |
| `$saved_cards` | `bool` | Whether saving payment methods is allowed. |
| `$admin_fields` | `array` | The settings-field schema. |
| `$verify_config` | `bool` | Whether saved settings need verification. |

### Methods you typically implement or override

| Method | When to override |
| --- | --- |
| `__construct()` | Call `setup()`, `init_admin_fields()`, `init_settings()`, then read options. |
| `process_payment( Order $order ): array\|WP_Error` | **Required.** Charge/confirm and return `['result' => 'success', 'redirect' => ...]`. |
| `init_admin_fields()` | Populate `$this->admin_fields` with the settings schema. |
| `is_available(): bool` | Add gateway-specific availability rules (currency, page context). |
| `supports( string $feature ): bool` | Usually just declare `$supports`; override for dynamic logic. |
| `process_refund( int $order_id, $amount = null, string $reason = '' )` | Implement if you declare `refunds` support. |
| `payment_fields()` | Render custom checkout fields when `$has_fields` is true. |
| `validate_fields(): void` | Throw a `StoreEngineException` to block an invalid submission. |
| `verify_config( array $config )` | Validate saved credentials when `$verify_config` is true. |
| `process_scheduled_payment( Order $renewal_order ): void` | Charge subscription renewals / installments (see below). |

### The `$supports` catalog

Declaring a feature turns on the related behavior. Common flags seen across core gateways: `products`, `refunds`, `subscriptions`, `multiple_subscriptions`, `subscription_cancellation`, `subscription_reactivation`, `subscription_suspension`, `subscription_amount_changes`, `subscription_date_changes`, `subscription_payment_method_change` (and `_admin` / `_customer` variants), `tokenization`, `add_payment_method`, and `gateway_scheduled_payments`.

If you support `gateway_scheduled_payments`, call `$this->register_subscription_hooks()` at the end of your constructor and implement `process_scheduled_payment()` — it wires both subscription renewals and installment-plan payments to that single method.

### Settings storage

`PaymentGateway` persists settings to the option `storeengine_payment_{$id}_settings`. Use `get_option( $key )` / `update_option( $key, $value )` on the instance (not the WordPress functions of the same name) — they read/write that option and merge in the defaults declared in `$admin_fields`. Every field also gets an implicit `is_enabled` (bool) and `index` (int).

## How gateways register

Two mechanisms, both filters. Prefer the lazy registry for anything that shouldn't be built until needed.

### Eager (legacy) — bare class names

The core offline gateways (COD, BACS, Check) and the in-core Stripe/PayPal/Razorpay addons register a class name on `storeengine/payment_gateways`. The registry instantiates these on `init` (the set is small and bounded, and it can't learn the id without constructing them):

```php
add_filter( 'storeengine/payment_gateways', function ( array $gateways ) {
	$gateways[] = \My\Plugin\GatewayFoo::class;
	return $gateways;
} );
```

### Lazy — id => class-string or factory

Register `id => class-string|callable` on `storeengine/payment_gateway_classes`. Gateways registered here are **not instantiated** until an enabled gateway appears on checkout, the admin settings screen loads, or a by-id lookup (refund, renewal, webhook) needs it. A callable factory lets you return a pre-configured shared base without a subclass per provider:

```php
add_filter( 'storeengine/payment_gateway_classes', function ( array $gateways ) {
	$gateways['foo']    = \My\Plugin\GatewayFoo::class;
	$gateways['mollie'] = fn() => new \My\Plugin\AbstractRedirectGateway( $mollie_config );
	return $gateways;
} );
```

### Per-gateway init hook

When an **enabled** gateway is booted, the registry fires `storeengine/gateway/{id}/init` with the instance by reference — the place to register frontend assets or checkout glue:

```php
add_action( 'storeengine/gateway/foo/init', function ( $gateway ) {
	// Register scripts, service singletons, etc.
} );
```

The registry also fires `storeengine/payment_gateways_initialized` (passing the `Payment_Gateways` instance) once the registry is built — note this fires after registration, not after every gateway is instantiated.

## Availability

`is_available()` returns true when the gateway is enabled, within `$max_amount`, and compatible with the cart/order. The base implementation already excludes gateways that don't `supports('subscriptions')` from carts/orders that contain a subscription, and enforces `$max_amount`. Override to add currency or context checks, then call `parent::is_available()`:

```php
public function is_available(): bool {
	if ( ! $this->is_currency_supported() ) {
		return false;
	}
	return parent::is_available();
}
```

## Processing a payment

`process_payment()` runs during checkout / order-pay. It should move the order to its next status and return a result array with a redirect (usually the order-received URL). Return a `WP_Error` or a `['result' => 'failure']` array on failure.

```php
public function process_payment( Order $order ): array {
	// ...charge via your SDK...
	$order->set_paid_status( 'paid' );
	$context = new \StoreEngine\Classes\OrderContext( $order->get_status() );
	$context->proceed_to_next_status( 'process_order', $order );
	$order->save();

	return [
		'result'   => 'success',
		'redirect' => $order->get_checkout_order_received_url(),
	];
}
```

### Client-side intents (optional)

Gateways that need a pre-confirmation client step (Stripe PaymentIntents, PayPal/Razorpay order creation) implement `StoreEngine\Interfaces\GatewayAdapterInterface`. Its single method, `create_intent( Order $order, Cart $cart )`, returns a normalized payload (any of `client_secret`, `intent_id`, `redirect_url`, `requires_action`) shared by both the jQuery checkout and the React checkout via `POST /storeengine/v1/checkout/payment-intent/{gateway_id}`. Offline/COD gateways don't need this — `place_order` runs `process_payment()` directly.

## Minimal skeleton

```php
<?php
namespace My\Plugin;

use StoreEngine\Payment\Gateways\PaymentGateway;
use StoreEngine\Classes\Order;
use StoreEngine\Classes\OrderContext;

class GatewayFoo extends PaymentGateway {

	protected int $index = 5;

	public function __construct() {
		$this->setup();
		$this->init_admin_fields();
		$this->init_settings();

		$this->title       = $this->get_option( 'title' );
		$this->description = $this->get_option( 'description' );
	}

	protected function setup() {
		$this->id                 = 'foo';
		$this->method_title       = __( 'Foo Pay', 'my-plugin' );
		$this->method_description = __( 'Accept payments via Foo.', 'my-plugin' );
		$this->has_fields         = false;
		$this->verify_config      = true;
		$this->supports           = [ 'products', 'refunds' ];
	}

	protected function init_admin_fields() {
		$this->admin_fields = [
			'title'      => [
				'label'    => __( 'Title', 'my-plugin' ),
				'type'     => 'safe_text',
				'default'  => __( 'Foo Pay', 'my-plugin' ),
				'priority' => 0,
			],
			'api_key'    => [
				'label'    => __( 'API Key', 'my-plugin' ),
				'type'     => 'password',
				'required' => true,
				'priority' => 1,
			],
		];
	}

	public function verify_config( array $config ) {
		if ( empty( $config['api_key'] ) ) {
			throw new \StoreEngine\Classes\Exceptions\StoreEngineException(
				esc_html__( 'API Key is required.', 'my-plugin' ),
				'api-key-required', 400
			);
		}
	}

	public function process_payment( Order $order ): array {
		// ...call the Foo SDK with $order->get_total() / $order->get_currency()...
		$order->set_paid_status( 'paid' );
		( new OrderContext( $order->get_status() ) )
			->proceed_to_next_status( 'process_order', $order );
		$order->save();

		return [
			'result'   => 'success',
			'redirect' => $order->get_checkout_order_received_url(),
		];
	}

	public function process_refund( int $order_id, $amount = null, string $reason = '' ) {
		// ...call the Foo refund API; return true on success, WP_Error on failure...
		return true;
	}
}
```

Register it lazily:

```php
add_filter( 'storeengine/payment_gateway_classes', function ( array $gateways ) {
	$gateways['foo'] = \My\Plugin\GatewayFoo::class;
	return $gateways;
} );
```

## Settings-field types

The `type` of an `$admin_fields` entry maps to the admin form control and validation. Common types seen in core gateways: `text`, `safe_text`, `password`, `textarea`, `checkbox`, `multiselect`, and `copy_text` (a read-only display field). `password` and `copy_text` validate as text; `checkbox` validates as boolean.

## See also

- [Payments REST endpoints](/rest-api/payments) and [Checkout](/rest-api/checkout) — where gateways are driven at runtime.
- [Orders](/data/orders) and [Order Statuses](/data/order-statuses) — the objects `process_payment()` transitions.
- [Actions](/reference/hooks/actions) / [Filters](/reference/hooks/filters) — the gateway hook reference.
- [Building Addons](/addons/architecture) — packaging a gateway as an addon (as core Stripe/PayPal/Razorpay do).
