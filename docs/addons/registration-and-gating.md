---
title: "Addon Registration & Gating"
description: "The full StoreEngine addon pipeline: the loader map, autoloader wiring, active-status option, the get_addon_active_status gate, and the activate/deactivate API."
sidebar_label: "Registration & Gating"
keywords: [storeengine, addon development, addon registration, addon gating, get_addon_active_status, storeengine addons]
---

This page traces how StoreEngine goes from a slug in a filter to a booted, gated addon: the loader map, the autoloader, the `run()` call, the active-status option, and the checks and APIs that decide whether an addon's code actually executes. It's the reference behind [Create your first addon](/addons/create-your-first-addon) and [Addon architecture](/addons/architecture).

## The registration pipeline

Everything starts in `includes/addons.php`. `Addons::init()` constructs the registry and calls `addons_loader()`, which builds the slug → class-name map behind a filter:

```php
$addons = apply_filters( 'storeengine/addons/loader_args', [
	'paypal'         => 'Paypal',
	'stripe'         => 'Stripe',
	'affiliate'      => 'Affiliate',
	'subscription'   => 'Subscription',
	'webhooks'       => 'Webhooks',
	'seo'            => 'Seo',
	// ...many more core addons...
	'funnel-builder' => 'FunnelBuilder',
] );
```

Then for **each** entry it does three things:

```php
foreach ( $addons as $addon_name => $addon_class_name ) {
	$addon_root_path = STOREENGINE_ADDONS_DIR_PATH . $addon_name . '/';
	$addon_namespace = 'StoreEngine\\Addons\\' . $addon_class_name;

	// 1. Register the addon's namespace with the autoloader.
	Autoload::get_instance()->add_namespace_directory( $addon_namespace, $addon_root_path );

	// 2. Instantiate the singleton and run its lifecycle.
	$class = $addon_namespace . '\\' . $addon_class_name;
	$class = $class::init();
	$class->run();

	// 3. Collect active addons for schema syncing.
	if ( Helper::get_addon_active_status( $addon_name ) ) {
		$this->loaded_addons[ $addon_name ] = $class;
	}
}

add_action( 'init', [ $this, 'sync_addon_schemas' ], 4 );
do_action( 'storeengine/addons/loaded' );
```

1. **Autoloader wiring.** The namespace `StoreEngine\Addons\<Class>` is mapped to `STOREENGINE_ADDONS_DIR_PATH . '<slug>/'`, so the addon's classes resolve on demand.
2. **`init()->run()`.** The singleton is created and `run()` executes the lifecycle (constants, activation wiring, gate, `init_addon()`). See [Architecture](/addons/architecture#lifecycle-of-run).
3. **Active collection.** Only addons that pass the gate are stored in `loaded_addons`, which feeds [schema syncing](/addons/database-tables).

After the loop, a single `init` hook (priority `4`) drives table syncing for every active addon, and `storeengine/addons/loaded` fires.

### The `loader_args` filters

Two filters register addons, one per plugin:

| Filter | Registers | Namespace built |
| --- | --- | --- |
| `storeengine/addons/loader_args` | Core (free) addons | `StoreEngine\Addons\<Class>` |
| `storeengine_pro/addons/loader_args` | Pro addons | `StoreEnginePro\Addons\<Class>` |

To register an addon from your own plugin, hook the appropriate filter:

```php
add_filter( 'storeengine/addons/loader_args', function ( array $addons ): array {
	$addons['my-feature'] = 'MyFeature';
	return $addons;
} );
```

:::note Autoload path for external addons
The core loader points the autoloader at `STOREENGINE_ADDONS_DIR_PATH . $slug . '/'`. If your addon class lives outside StoreEngine's `addons/` directory, register its namespace with your own autoloader (or `Autoload::get_instance()->add_namespace_directory()`) so it can be found — registering the slug alone isn't enough when the file lives elsewhere.
:::

## Active status: the `storeengine_addons` option

Whether an addon is *enabled* is separate from whether it is *registered*. Active status lives in the `storeengine_addons` option (constant `STOREENGINE_ADDONS_SETTINGS_NAME`, defined in `storeengine.php` as `'storeengine_addons'`), stored as a JSON object of `slug => boolean` and hydrated into the global `$storeengine_addons` on load:

```php
$GLOBALS['storeengine_addons'] = json_decode( get_option( STOREENGINE_ADDONS_SETTINGS_NAME, '{}' ) );
```

## The gate: `get_addon_active_status()`

`run()` calls one function to decide whether to boot an addon, and you use the same one to check active status from your own code. From `includes/utils/helper.php`:

```php
public static function get_addon_active_status( $addon_name, $is_pro = false ): bool {
	global $storeengine_addons;
	if ( $is_pro && ! self::is_active_storeengine_pro() ) {
		return false;
	}
	if ( isset( $storeengine_addons->{$addon_name} ) ) {
		return (bool) $storeengine_addons->{$addon_name};
	}

	return false;
}
```

- **First argument** — the addon slug. Returns the boolean from `$storeengine_addons`, or `false` if the slug isn't present.
- **`$is_pro` (second argument)** — when `true`, the check *also* requires StoreEngine Pro to be active (`is_active_storeengine_pro()`). Use this for Pro addons so they gate on both their own toggle and the Pro plugin being present.

### Checking from your own code

```php
use StoreEngine\Utils\Helper;

// Is a core addon enabled?
if ( Helper::get_addon_active_status( 'affiliate' ) ) {
	// Affiliate features are on.
}

// Is a Pro addon enabled AND is Pro active?
if ( Helper::get_addon_active_status( 'inventory-pro', true ) ) {
	// Safe to call the Pro addon's APIs.
}
```

This is the canonical way to feature-detect another addon before calling into it.

## Activate / deactivate API

`Addons::activate()` and `Addons::deactivate()` flip an addon's status, persist the option, and fire the matching lifecycle hook.

```php
\StoreEngine\Addons::activate( 'my-feature' );
\StoreEngine\Addons::deactivate( 'my-feature' );
```

Both:

- Read (or lazily load) the `$storeengine_addons` global.
- Return a `WP_Error` if the addon is already in the requested state (`addon_already_activated` / `addon_already_deactivated`).
- Set `$storeengine_addons->{$slug}` to `true`/`false`.
- Persist via `update_option( STOREENGINE_ADDONS_SETTINGS_NAME, wp_json_encode( $storeengine_addons ) )`.
- Fire `storeengine/addons/activated_{$slug}` or `storeengine/addons/deactivated_{$slug}`.

Those dynamic hooks are what `AbstractAddon::run()` wired to your `addon_activation_hook()` / `addon_deactivation_hook()`, so activating an addon runs its setup even though `init_addon()` didn't run earlier in that request.

| Fired hook | Bound to | Typical use |
| --- | --- | --- |
| `storeengine/addons/activated_{slug}` | `addon_activation_hook()` | Seed defaults, create tables, flush rewrites. |
| `storeengine/addons/deactivated_{slug}` | `addon_deactivation_hook()` | Teardown that should happen on disable. |

## The admin toggle (AJAX)

The admin **Addons** screen toggles addons through two AJAX actions in `includes/ajax/addons.php`, both capability-gated to `manage_options`:

| Action | Purpose |
| --- | --- |
| `get_all_addons` | Returns the current `storeengine_addons` map for the UI. |
| `saved_addon_status` | Enables/disables an addon after running guard checks. |

`saved_addon_status` does more than flip a bit. Before persisting it:

- Enforces any **required host plugin** (`required_plugin`) declared for the addon and errors if it isn't active.
- On enable, blocks if the addon has **missing sibling requirements** (`get_missing_requirements()`).
- On disable, blocks if **active dependents** still rely on it (`get_active_dependents()`).
- Fires the appropriate `activated_`/`deactivated_` hook, then writes the option.

The dependency logic is covered in [Dependencies](/addons/dependencies).

## Pro loader differences

The Pro plugin (`storeengine-pro/includes/addons.php`) mirrors the core loader but:

- Reads its map from `storeengine_pro/addons/loader_args`.
- Builds namespaces under `StoreEnginePro\Addons\`.
- Reuses core's schema manager — it calls `\StoreEngine\Addons::sync_schema_for( $this->loaded_addons )` (guarded by `method_exists` for version-skew safety) so Pro addon schemas are tracked in the same `storeengine_addons_db_version` option.

## Related

- [Addon architecture](/addons/architecture) — the lifecycle these pieces drive.
- [Dependencies](/addons/dependencies) — the activate/deactivate guard rules.
- [Database tables](/addons/database-tables) — what the `loaded_addons` collection feeds.
- [Actions reference](/reference/hooks/actions) — the addon lifecycle hooks.
