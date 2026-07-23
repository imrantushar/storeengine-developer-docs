---
title: "Addon Settings API"
description: "Give a StoreEngine addon settings with AbstractAddonSettings: defaults, typed field maps, reading values, save validation, and auto-wired admin UI filters."
sidebar_label: "Settings API"
keywords: [storeengine, addon development, addon settings, abstractaddonsettings, wordpress settings api, storeengine addons]
---

Most addons need configuration. StoreEngine gives you `AbstractAddonSettings` — a base class that stores your settings as a single option, exposes a typed reader, and **auto-wires** your defaults and field definitions into the admin Settings UI without you touching any admin code.

This page is a deep dive on that class. For the addon itself, see [Create your first addon](/addons/create-your-first-addon).

## Anatomy of a settings class

Extend `StoreEngine\Classes\AbstractAddonSettings`, declare a `$settings_name`, and implement two methods: `get_default_settings()` and `get_settings_fields()`. Here is the real SEO addon's settings class (`addons/seo/settings.php`), trimmed:

```php
<?php
namespace StoreEngine\Addons\Seo;

use StoreEngine\Classes\AbstractAddonSettings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Settings extends AbstractAddonSettings {

	protected ?string $settings_name = 'seo';

	public function get_default_settings(): array {
		return [
			'mode'                      => 'auto',
			'schema_product_enabled'    => true,
			'schema_breadcrumb_enabled' => true,
			'og_enabled'                => true,
			'twitter_card_type'         => 'summary_large_image',
			'twitter_site'              => '',
			'default_share_image_id'    => 0,
			'org_name'                  => '',
			'org_logo_id'               => 0,
			'noindex_cart'              => true,
			'noindex_checkout'          => true,
			'noindex_account'           => true,
			'noindex_thankyou'          => true,
		];
	}

	public function get_settings_fields(): array {
		return [
			'mode'                      => 'string',
			'schema_product_enabled'    => 'boolean',
			'schema_breadcrumb_enabled' => 'boolean',
			'og_enabled'                => 'boolean',
			'twitter_card_type'         => 'string',
			'twitter_site'              => 'string',
			'default_share_image_id'    => 'number',
			'org_name'                  => 'string',
			'org_logo_id'               => 'number',
			'noindex_cart'              => 'boolean',
			'noindex_checkout'          => 'boolean',
			'noindex_account'           => 'boolean',
			'noindex_thankyou'          => 'boolean',
		];
	}
}
```

The class `use`s the `AbstractSingleton` trait through the base, so you always work with `Settings::init()`.

### `$settings_name`

`protected ?string $settings_name` is the storage key for the whole option array, following the StoreEngine convention (SEO stores everything under `seo`). If you leave it `null`, the base class derives it from the class slug — but declaring it explicitly is clearer and stable across refactors.

### `get_default_settings(): array`

Returns the complete default map, `key => value`. Every field your addon reads should have a default here. On `load_settings()` these defaults are merged *under* the stored values, so a newly added field is never missing even for stores that saved settings before you added it.

### `get_settings_fields(): array`

Returns a `key => type` map that tells the admin Settings UI how to treat each field. The types used in core are:

| Type | Meaning |
| --- | --- |
| `string` | Text value. |
| `boolean` | On/off toggle. |
| `number` | Numeric value (including attachment IDs like `org_logo_id`). |

The keys must match those in `get_default_settings()`. This map is what StoreEngine merges into the settings-fields payload the admin app consumes.

:::note[One key holds the whole addon]
All of an addon's settings live in a single option keyed by `$settings_name`. You read individual values by key through the reader below — you don't register each field as its own WordPress option.
:::

## Reading settings

### From the addon's own settings class

```php
$mode = Settings::init()->get_settings( 'mode' );          // default from get_default_settings()
$site = Settings::init()->get_settings( 'twitter_site', '' ); // explicit fallback
```

`get_settings( string $key, $default = null )` calls `load_settings()` (lazy, cached per request), returns the value or your `$default`, and passes it through the filter `storeengine/{settings_name}/get_settings` so other code can override reads.

### From anywhere in your codebase

The same works wherever you can reference the class:

```php
use StoreEngine\Addons\Seo\Settings;

$og_enabled = Settings::init()->get_settings( 'og_enabled' );
```

`load_settings( bool $reload = false )` populates the cache from `get_default_settings()` merged with the stored option; pass `true` to force a re-read after a programmatic save. Settings are also loaded on `init` (via a hook the base class registers) so translations are available.

## Persisting defaults

`save_default_settings(): void` writes your defaults to storage **only if nothing is stored yet**:

```php
public function save_default_settings(): void {
	if ( false === Helper::get_settings( $this->get_settings_name(), false ) ) {
		Base::save_settings( [ $this->get_settings_name() => $this->get_default_settings() ] );
	}
}
```

Call it from your addon's `addon_activation_hook()` so a freshly enabled addon has sane defaults:

```php
public function addon_activation_hook() {
	Settings::init()->save_default_settings();
}
```

There is also `update_settings_name( string $old_name )`, which migrates a stored option from an old key to the current `$settings_name` and deletes the old one — useful if you rename an addon.

## Auto-wired admin UI

You don't write any admin code to surface these settings. The base constructor calls `dispatch_hooks()`, which registers:

| Hook | Effect |
| --- | --- |
| `init` → `load_settings` | Loads settings early (translation-safe). |
| `storeengine/admin/settings_default_data` (filter) | Merges `get_default_settings()` under your `$settings_name`. |
| `storeengine/ajax/settings_fields` (filter) | Merges `get_settings_fields()` under your `$settings_name`. |

Because these hooks run in the constructor, simply calling `Settings::init()` from your addon's `init_addon()` is enough to register everything:

```php
public function init_addon() {
	Settings::init();
	// ...rest of your boot code...
}
```

## Save validation

By default settings save without extra validation. To validate on save, set the protected flag and override `validate_settings()`:

```php
class Settings extends AbstractAddonSettings {

	protected ?string $settings_name = 'my-feature';
	protected bool $validate_on_save = true;

	// get_default_settings(), get_settings_fields()...

	public function validate_settings( \WP_Error $errors, array $payload ): \WP_Error {
		if ( empty( $payload['api_key'] ) ) {
			$errors->add( 'my-feature-api_key', __( 'API key is required.', 'my-textdomain' ) );
		}
		return $errors;
	}
}
```

When `$validate_on_save` is `true`, the base class hooks `storeengine/ajax/validate_settings` and calls your `validate_settings()` with the accumulated `WP_Error` and the incoming payload. Important behavior baked into the base:

- **Your key is only validated when it's part of the save.** Saves from other settings tabs (General, Compliance, etc.) legitimately omit your key; those are skipped so you don't reject unrelated saves. Stored values are preserved regardless.
- If your key is present but empty, the base adds a `{settings_name}-settings_data` error before delegating, guarding against a corrupted payload.

Return the `WP_Error` (with or without added errors). Any error added blocks the save and surfaces in the admin UI.

## Reference

| Member | Kind | Purpose |
| --- | --- | --- |
| `$settings_name` | `?string` | Storage key for the addon's option array. |
| `$validate_on_save` | `bool` | When `true`, wires save validation. Default `false`. |
| `get_default_settings()` | abstract | Complete default `key => value` map. |
| `get_settings_fields()` | abstract | `key => type` map for the admin UI. |
| `get_settings( $key, $default )` | method | Read a single value (lazy-loads + filters). |
| `load_settings( $reload )` | method | Populate/refresh the per-request cache. |
| `save_default_settings()` | method | Persist defaults if none stored yet. |
| `update_settings_name( $old )` | method | Migrate a stored option to the current key. |
| `validate_settings( $errors, $payload )` | method | Override to validate on save. |
| `get_settings_name()` | method | Return the resolved `$settings_name`. |

## Related

- [Create your first addon](/addons/create-your-first-addon) — wire a settings class into `init_addon()`.
- [Addon architecture](/addons/architecture) — where settings sit in the lifecycle.
- [Settings REST endpoints](/rest-api/settings) — how the admin app reads and writes settings.
