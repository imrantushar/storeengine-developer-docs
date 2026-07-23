---
title: "Build a Standalone Addon Plugin"
description: "Ship your own WordPress plugin that extends StoreEngine — the dependency guard, booting on storeengine_loaded, when to use AbstractAddon, and the StoreEngine Pro pattern."
sidebar_label: "Standalone Addon Plugin"
keywords:
  - storeengine addon plugin
  - extend storeengine
  - storeengine third party plugin
  - storeengine_loaded
  - storeengine dependency
---

The [Create Your First Addon](/addons/create-your-first-addon) guide covers addons that live **inside** StoreEngine's own `addons/` directory. This guide is for the more common third-party case: shipping **your own separate WordPress plugin** that extends StoreEngine — distributed on your site, wp.org, or a marketplace.

:::warning[The `storeengine/addons/loader_args` filter is core-internal — you can't use it]
It's tempting to add your addon to the `storeengine/addons/loader_args` map. **This does not work from an external plugin.** StoreEngine's loader hard-anchors every entry to its *own* addons directory (`STOREENGINE_ADDONS_DIR_PATH . {slug}/`) and its *own* namespace (`StoreEngine\Addons\*`), and it re-registers that namespace path itself — overwriting anything you set. The filter exists so StoreEngine can split *its own* addons into satellites. A third-party plugin must run its own loader (the [Pro pattern](#option-b) below), or skip the addon framework entirely (the [recommended path](#option-a)).
:::

## Prerequisites: declare the dependency

Every StoreEngine extension plugin starts with a header that declares StoreEngine as a required plugin (WordPress 6.5+ enforces this) plus a runtime guard.

```php
<?php
/**
 * Plugin Name:     My StoreEngine Extension
 * Description:     Adds X to StoreEngine.
 * Version:         1.0.0
 * Requires PHP:    7.4
 * Requires at least: 6.5
 * Requires Plugins: storeengine
 * Text Domain:     my-se-extension
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
```

## Option A — Hook core (recommended) {#option-a}

If your plugin doesn't need StoreEngine's addon **toggle UI**, don't extend the addon framework at all. Just boot on the `storeengine_loaded` action — StoreEngine fires it after `plugins_loaded`, once core is fully initialized — and hook whatever actions, filters, or REST routes you need.

```php
add_action( 'storeengine_loaded', 'my_se_ext_init' );

function my_se_ext_init() {
	// Guard: core present and new enough. Never assume — fail with a notice.
	if ( ! defined( 'STOREENGINE_VERSION' )
		|| version_compare( STOREENGINE_VERSION, '2.2.0', '<' ) ) {
		add_action( 'admin_notices', 'my_se_ext_core_notice' );
		return;
	}

	// You're safe to use StoreEngine here.
	add_action( 'storeengine/order/status_changed', 'my_se_ext_on_status', 10, 4 );
	add_filter( 'storeengine/product/get_price', 'my_se_ext_price', 10, 2 );
}

function my_se_ext_on_status( $order_id, $old, $new, $order ) {
	if ( 'completed' === $new ) {
		// ... your logic
	}
}

function my_se_ext_core_notice() {
	echo '<div class="notice notice-error"><p>';
	esc_html_e( 'My StoreEngine Extension requires StoreEngine 2.2.0 or newer.', 'my-se-extension' );
	echo '</p></div>';
}
```

This is all most integrations need. The full surface you can build on:

- **[Hooks: Actions](/reference/hooks/actions)** and **[Filters](/reference/hooks/filters)** — order lifecycle, checkout, cart, pricing, email, templates.
- **[REST API › Extending](/rest-api/extending)** — add endpoints in the `storeengine/v1` namespace.
- **[Data & Objects](/data/orders)** — Order, Product, Cart, Customer, Coupon, Subscription classes.
- **[Payment Gateways](/reference/payment-gateways)** — register a gateway via `storeengine/payment_gateways`.
- **Booting narrower:** `storeengine/addons/loaded` fires after all core addons load; `storeengine/addons/{slug}/loaded` fires when a specific addon initializes — hook it to extend a feature only when its addon is active.

:::tip[Checking if StoreEngine (or Pro) is active from anywhere]
```php
use StoreEngine\Utils\Helper;

Helper::is_plugin_active( 'storeengine/storeengine.php' ); // core active?
Helper::is_active_storeengine_pro();                       // Pro active?
```
There is no `Helper::is_active_storeengine()` — use `is_plugin_active()` or the `STOREENGINE_VERSION` constant.
:::

## Option B — The StoreEngine Pro pattern (AbstractAddon lifecycle) {#option-b}

Choose this only if you want the [`AbstractAddon`](/addons/architecture) lifecycle — versioned constants, `install_tables()` schema management, and activation/deactivation hooks — in a separate plugin. This is exactly how **StoreEngine Pro** extends the free plugin, so it's the canonical reference.

The pattern has four parts:

### 1. Ship your own autoloader & namespace

Don't reuse `StoreEngine\Addons\*`. Register your own PSR-4 namespace (e.g. `MyVendor\SEExt\`) with your own autoloader — Pro ships `StoreEnginePro\Autoload` for exactly this. A Composer `vendor/autoload.php` works equally well.

### 2. Defer init to `storeengine_loaded` and version-guard

```php
final class My_SE_Extension {
	const MIN_CORE_VERSION = '2.2.0';

	public function __construct() {
		$this->define_constants();
		$this->load_dependencies(); // your autoloader(s)
		add_action( 'storeengine_loaded', [ $this, 'init_plugin' ] );
	}

	public function init_plugin() {
		if ( ! $this->is_core_compatible() ) {
			add_action( 'admin_notices', [ $this, 'notice_core_incompatible' ] );
			return;
		}
		// Boot your own addon loader here.
		\MyVendor\SEExt\Addons::init();
	}

	private function is_core_compatible(): bool {
		return defined( 'STOREENGINE_VERSION' )
			&& version_compare( STOREENGINE_VERSION, self::MIN_CORE_VERSION, '>=' );
	}
}
```

Pro follows this exactly: it `require`s its autoloaders through a `require_or_notice()` helper (so a missing build shows an admin notice instead of a fatal), defers all work to `storeengine_loaded`, and checks `defined( 'STOREENGINE_VERSION' ) && version_compare( … , STOREENGINE_PRO_MIN_CORE_VERSION, '>=' )`.

### 3. Run your addon classes yourself

Your addon class may extend `StoreEngine\Classes\AbstractAddon` (to inherit the lifecycle), but **you** instantiate and `run()` it — StoreEngine's loader won't. Mirror Pro's loop with your own namespace and directory:

```php
namespace MyVendor\SEExt;

class Addons {
	public static function init() {
		$self = new self();
		foreach ( $self->get_addons() as $slug => $class_name ) {
			$fqcn = __NAMESPACE__ . '\\Addons\\' . $class_name . '\\' . $class_name;
			$fqcn::init()->run();
		}
		// Share the DB-version option with core (guard for older cores).
		if ( method_exists( \StoreEngine\Addons::class, 'sync_schema_for' ) ) {
			\StoreEngine\Addons::sync_schema_for( $self->loaded_addons );
		}
	}

	private function get_addons(): array {
		// Your OWN filter — not core's.
		return apply_filters( 'my_se_ext/addons/loader_args', [ 'my-addon' => 'MyAddon' ] );
	}
}
```

### 4. Seed your addon active — the gotcha

`AbstractAddon::run()` is `final` and **returns early unless the addon is toggled on**:

```php
// includes/classes/abstract-addon.php
if ( ! Helper::get_addon_active_status( $this->addon_name ) ) {
	return; // init_addon() never runs
}
```

The active state lives in the `storeengine_addons` option, and **the admin addons screen only lists StoreEngine's own (and Pro's) addons** — its catalog is baked into the core admin bundle with no server-side hook to register a third-party card. So a standalone `AbstractAddon` addon is **inert by default**: nothing will ever toggle it on.

Fix it by seeding your slug active yourself, typically on plugin activation:

```php
register_activation_hook( __FILE__, function () {
	$addons = json_decode( get_option( 'storeengine_addons', '{}' ) );
	$addons = is_object( $addons ) ? $addons : new stdClass();
	$addons->{'my-addon'} = true;
	update_option( 'storeengine_addons', wp_json_encode( $addons ) );
} );
```

:::note[Which option should I choose?]
For the vast majority of extensions — analytics, notifications, custom fields, integrations, gateways — **Option A is simpler, more robust, and future-proof.** Reach for Option B only when you specifically need `install_tables()` schema versioning or the activation/deactivation lifecycle in a separate plugin, and you're comfortable managing the active-state seed yourself.
:::

## Related

- **[Addon Architecture](/addons/architecture)** — the `AbstractAddon` lifecycle in depth.
- **[Create Your First Addon](/addons/create-your-first-addon)** — addons inside StoreEngine core.
- **[Registration & Gating](/addons/registration-and-gating)** — how the active-status gate works.
- **[Free vs Pro](/getting-started/free-vs-pro)** — how Pro extends the free plugin.
