---
title: "Addon Dependencies"
description: "Declare inter-addon dependencies in StoreEngine: the dependencies filter, missing-requirement and active-dependent checks, and requiring Pro or other plugins."
sidebar_label: "Dependencies"
keywords: [storeengine, addon development, addon dependencies, get_missing_requirements, get_active_dependents, storeengine addons]
---

Some addons only make sense on top of others — a returns feature needs inventory, a point-of-sale addon needs stock tracking. StoreEngine models these as **hard inter-addon dependencies**: activating an addon requires its dependencies to be active first, and deactivating an addon is blocked while anything that depends on it is still active.

This page covers the dependency map, the query helpers, the blocking rules, and how to require StoreEngine Pro or third-party plugins. It builds on [Registration and gating](/addons/registration-and-gating).

## The dependency map

Dependencies are declared as a `consumer => [required-slugs]` map behind the `storeengine/addons/dependencies` filter, in `includes/addons.php`:

```php
public static function get_dependencies(): array {
	return apply_filters( 'storeengine/addons/dependencies', [
		'inventory-pro' => [ 'inventory' ],
		'pos'           => [ 'inventory' ],
		'returns'       => [ 'inventory' ],
	] );
}
```

Read it as: activating `pos` requires `inventory` to already be active; `inventory` cannot be deactivated while `pos` (or `returns`, or `inventory-pro`) is active.

### Declaring your own dependency

Because it's a filter, you add dependencies without editing core. To declare that your `my-feature` addon requires `subscription`:

```php
add_filter( 'storeengine/addons/dependencies', function ( array $map ): array {
	$map['my-feature'] = [ 'subscription' ];
	return $map;
} );
```

You can require more than one:

```php
$map['my-feature'] = [ 'subscription', 'invoice' ];
```

:::note[Hard vs soft dependencies]
This map is for **hard** requirements — the consumer literally cannot function without them, so activation is blocked. For a **soft** dependency (extra behavior when another addon is present, graceful fallback when it isn't), don't add it to the map. Instead, feature-detect at runtime with `Helper::get_addon_active_status()`. Core does this: POS *hard*-requires `inventory` but treats `inventory-pro` as a soft dependency, enabling per-location stock only when it's active.
:::

## Query helpers

Three static methods on `StoreEngine\Addons` answer the questions the toggle logic needs.

| Method | Returns |
| --- | --- |
| `get_dependencies()` | The full `consumer => [required]` map (filtered). |
| `get_missing_requirements( $slug )` | Slugs `$slug` requires that are **not** currently active. |
| `get_active_dependents( $slug )` | Slugs that depend on `$slug` **and** are themselves active. |

`get_missing_requirements()` answers "can I turn this on?" — an empty array means all requirements are satisfied:

```php
$missing = \StoreEngine\Addons::get_missing_requirements( 'pos' );
// If 'inventory' is off: ['inventory']. If on: [].
```

`get_active_dependents()` answers "can I turn this off?" — a non-empty array means something still needs it:

```php
$dependents = \StoreEngine\Addons::get_active_dependents( 'inventory' );
// If POS is active: ['pos']. Otherwise: [].
```

Both read the live `$storeengine_addons` global, so they reflect current active status.

## Blocking rules on toggle

The admin toggle (AJAX action `saved_addon_status` in `includes/ajax/addons.php`) enforces the map before it flips anything:

- **On activate** — if `get_missing_requirements()` is non-empty, the request errors with a message like *"Activate inventory first — required by POS."* and nothing changes.
- **On deactivate** — if `get_active_dependents()` is non-empty, the request errors with *"Cannot deactivate Inventory while POS depends on it. Deactivate POS first."* and nothing changes.

So the enforced invariant is: **you can't enable an addon before its requirements, and you can't disable an addon out from under its dependents.** If you toggle addons programmatically via `Addons::activate()` / `Addons::deactivate()`, those methods flip status directly and do **not** run these dependency guards — so check the helpers yourself first when bypassing the admin UI:

```php
if ( ! \StoreEngine\Addons::get_missing_requirements( 'pos' ) ) {
	\StoreEngine\Addons::activate( 'pos' );
}
```

## Requiring a host plugin

Beyond sibling addons, an addon can require a **separate WordPress plugin** to be installed and active. The toggle handler checks a `required_plugin` payload (with `plugin_dir_path` and `plugin_name`) and refuses activation with *"{Plugin} Plugin is required to activate {Addon} addon."* when `Helper::is_plugin_active()` is false. Surface this requirement from the admin UI's addon definition so users get the message before toggling.

## Requiring StoreEngine Pro

A Pro-only addon shouldn't run unless the Pro plugin is active. That's not expressed through the dependency map — it's the second argument to the gate. Pass `true` to `get_addon_active_status()` so the addon gates on both its own toggle *and* Pro being active:

```php
if ( \StoreEngine\Utils\Helper::get_addon_active_status( 'inventory-pro', true ) ) {
	// Both the addon is enabled and StoreEngine Pro is active.
}
```

Pro addons are registered and schema-synced through the Pro loader; see [Registration and gating](/addons/registration-and-gating#pro-loader-differences).

## Related

- [Registration and gating](/addons/registration-and-gating) — the activate/deactivate API and the admin toggle.
- [Addon architecture](/addons/architecture) — where gating sits in the lifecycle.
- [Create your first addon](/addons/create-your-first-addon) — build the addon you're adding dependencies to.
