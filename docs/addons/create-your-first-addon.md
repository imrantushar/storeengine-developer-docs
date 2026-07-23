---
title: "Create Your First Addon"
description: "A copy-pasteable tutorial for building a StoreEngine addon: directory layout, the minimal class, registering it, enabling it, and verifying it loaded."
sidebar_label: "Create Your First Addon"
keywords: [storeengine, addon development, create addon, abstractaddon, wordpress plugin tutorial, storeengine addons]
---

This tutorial walks you through building a StoreEngine addon from an empty directory to a running, enabled feature. By the end you will have a minimal addon, an optional settings class, and a way to confirm it booted. Read the [Addon architecture](/addons/architecture) first if you want the conceptual picture.

We'll build an addon called **My Feature** with the slug `my-feature`.

## 1. Create the directory and main file

Core addons live under `addons/<slug>/` inside the StoreEngine plugin (or under `storeengine-pro/addons/<slug>/` for Pro). The main file is conventionally named after the slug:

```bash
storeengine/addons/my-feature/my-feature.php
```

If you're shipping the addon from your **own plugin** instead of inside StoreEngine, put it anywhere in your plugin and register it via the `storeengine/addons/loader_args` filter (see [step 3](#3-register-the-addon)).

## 2. Write the addon class

The minimal contract is: extend `AbstractAddon`, `use Singleton;`, redeclare `$addon_name`, and implement `define_constants()` and `init_addon()`. Everything else has a working default.

```php
<?php
/**
 * My Feature addon.
 */

namespace StoreEngine\Addons\MyFeature;

use StoreEngine\Classes\AbstractAddon;
use StoreEngine\Traits\Singleton;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class MyFeature extends AbstractAddon {

	use Singleton;

	/**
	 * Unique slug. MUST be redeclared or run() bails with _doing_it_wrong.
	 * Used for gating, dynamic hook names, and schema syncing.
	 */
	protected string $addon_name = 'my-feature';

	/**
	 * Always called by run(), even when the addon is disabled.
	 */
	public function define_constants() {
		define( 'STOREENGINE_MY_FEATURE_VERSION', '1.0.0' );
		define( 'STOREENGINE_MY_FEATURE_DIR_PATH', STOREENGINE_ADDONS_DIR_PATH . 'my-feature/' );
	}

	/**
	 * Boot the addon. Runs ONLY when the addon is active.
	 * Register hooks, REST routes, admin menus, etc. here.
	 */
	public function init_addon() {
		add_action( 'storeengine/order/status_changed', [ $this, 'on_order_status_changed' ], 10, 3 );
	}

	public function on_order_status_changed( $order, $from, $to ) {
		// Your feature logic.
	}
}

// End of file my-feature.php.
```

:::warning `$addon_name` is mandatory
`AbstractAddon::run()` verifies `$addon_name` before doing anything else. If you forget to redeclare it, StoreEngine fires `_doing_it_wrong()` and your addon never boots. The slug must be unique across all addons.
:::

### Optional: activation and table methods

Add these only if you need them. All have no-op defaults on `AbstractAddon`.

```php
	/**
	 * Fires once when the addon is switched on.
	 * A good place to seed default settings or flush rewrite rules.
	 */
	public function addon_activation_hook() {
		Settings::init()->save_default_settings();
	}

	/**
	 * Fires once when the addon is switched off.
	 */
	public function addon_deactivation_hook() {
		// Teardown that should happen on disable.
	}

	/**
	 * Only override these two if your addon owns custom tables.
	 * Bump the version constant to trigger a re-install. See Database tables.
	 */
	public function get_db_version(): string {
		return STOREENGINE_MY_FEATURE_DB_VERSION;
	}

	public function install_tables(): void {
		Database::init();
	}
```

See [Database tables](/addons/database-tables) for the full custom-table pattern.

## 3. Register the addon

StoreEngine discovers addons through a slug → class-name map. There are two ways to get into it.

**Core addon (inside StoreEngine).** Add your entry to the array in `includes/addons.php`:

```php
$addons = apply_filters( 'storeengine/addons/loader_args', [
	// ...existing core addons...
	'my-feature' => 'MyFeature',
] );
```

**External addon (from your own plugin).** Hook the `storeengine/addons/loader_args` filter — no core edit required:

```php
add_filter( 'storeengine/addons/loader_args', function ( array $addons ): array {
	$addons['my-feature'] = 'MyFeature';
	return $addons;
} );
```

The value is the **class name** (without namespace). StoreEngine builds the namespace as `StoreEngine\Addons\<ClassName>`, registers it with the autoloader against `STOREENGINE_ADDONS_DIR_PATH . '<slug>/'`, and calls `<Namespace>\<ClassName>::init()->run()`.

:::note Autoload path
The loader points the autoloader at `STOREENGINE_ADDONS_DIR_PATH . $slug . '/'`. If your external addon lives outside that directory, register its namespace yourself (for example via your plugin's own PSR-4 autoloader or `Autoload::get_instance()->add_namespace_directory()`) so the class can be found. See [Registration and gating](/addons/registration-and-gating).
:::

## 4. Enable the addon

Registering an addon makes StoreEngine *aware* of it, but `init_addon()` runs only when the addon is **active**. Active status is stored in the `storeengine_addons` option as a slug → boolean map.

The normal way to enable an addon is the admin **Addons** screen — toggling it there sets `storeengine_addons['my-feature'] = true` and fires `storeengine/addons/activated_my-feature`.

To enable it programmatically (e.g. in your own plugin's activation routine):

```php
\StoreEngine\Addons::activate( 'my-feature' );
```

This flips the global, persists the option, and fires the activation hook. Use `\StoreEngine\Addons::deactivate( 'my-feature' )` to turn it off. See [Registration and gating](/addons/registration-and-gating) for the full activate/deactivate API.

## 5. Verify it loaded

Once the addon is active, StoreEngine fires `storeengine/addons/my-feature/loaded` right after `init_addon()` completes. Hook it to confirm your addon booted:

```php
add_action( 'storeengine/addons/my-feature/loaded', function () {
	error_log( 'My Feature addon loaded.' );
} );
```

:::tip Quick check from anywhere
Ask the gate directly:

```php
if ( \StoreEngine\Utils\Helper::get_addon_active_status( 'my-feature' ) ) {
	// The addon is enabled.
}
```

This is the same function `run()` uses to decide whether to call `init_addon()`.
:::

## Full skeleton recap

A complete minimal addon is just this:

```php
<?php
namespace StoreEngine\Addons\MyFeature;

use StoreEngine\Classes\AbstractAddon;
use StoreEngine\Traits\Singleton;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class MyFeature extends AbstractAddon {
	use Singleton;

	protected string $addon_name = 'my-feature';

	public function define_constants() {
		define( 'STOREENGINE_MY_FEATURE_VERSION', '1.0.0' );
		define( 'STOREENGINE_MY_FEATURE_DIR_PATH', STOREENGINE_ADDONS_DIR_PATH . 'my-feature/' );
	}

	public function init_addon() {
		// Register your hooks, routes, menus.
	}
}
```

Register it, enable it, and you're running.

## Next steps

- [Settings API](/addons/settings-api) — add configurable settings that appear in the admin UI.
- [Database tables](/addons/database-tables) — give your addon its own tables.
- [Dependencies](/addons/dependencies) — require another addon or StoreEngine Pro.
- [Hooks reference](/reference/hooks/actions) — the actions and filters you can build against.
