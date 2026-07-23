---
title: "Addon Database Tables"
description: "Give a StoreEngine addon custom tables: implement get_db_version and install_tables, version with a constant, and let the central schema manager sync on change."
sidebar_label: "Database Tables"
keywords: [storeengine, addon development, custom tables, dbdelta, database schema, storeengine addons]
---

When an addon needs relational storage beyond post meta, it can own **custom database tables**. StoreEngine gives addons a versioned, self-syncing installer: you declare a schema version, implement the installer, and a central manager reruns it automatically whenever the version changes — no per-addon `init` hook, no manual migration wiring.

This page covers the mechanism and the pattern, using the affiliate addon as the reference. For the addon itself, see [Create your first addon](/addons/create-your-first-addon).

## When you need this

Not every addon needs tables. Several core addons — webhooks, for example — store data in a **custom post type** instead and never touch this API. Reach for custom tables when you have high-volume, relational, or query-heavy data that doesn't fit `wp_posts`/`wp_postmeta` (the same reason StoreEngine keeps orders in `storeengine_orders`). See [Database schema](/data/database-schema).

If your addon has no tables, do nothing — `AbstractAddon::get_db_version()` returns `''` and the schema manager skips you.

## The two methods

An addon owns tables by overriding two methods from `AbstractAddon`:

```php
public function get_db_version(): string {
	return STOREENGINE_AFFILIATE_DB_VERSION;
}

public function install_tables(): void {
	Database::init();
}
```

| Method | Contract |
| --- | --- |
| `get_db_version(): string` | Return the current schema version. Empty string means "no tables" and the manager ignores the addon. |
| `install_tables(): void` | Run the `dbDelta` calls that create/upgrade the tables. **Must be idempotent.** |

## Declare a version constant

Define the version in `define_constants()` so a single edit drives re-installs. From `addons/affiliate/affiliate.php`:

```php
public function define_constants() {
	define( 'STOREENGINE_AFFILIATE_VERSION', '1.0' );
	// Bump on any schema change under affiliate/database/ to trigger a
	// re-sync via the central Addons schema manager.
	define( 'STOREENGINE_AFFILIATE_DB_VERSION', '1.1' );
	define( 'STOREENGINE_AFFILIATE_DIR_PATH', STOREENGINE_ADDONS_DIR_PATH . 'affiliate/' );
	// ...other constants...
}
```

Keep the **plugin version** and the **DB version** separate. The DB version only changes when the *schema* changes; you can ship many releases without bumping it.

## How the central schema manager works

Table syncing is driven by one option and one method, so no addon registers its own migration hook.

- **Option `storeengine_addons_db_version`** (constant `Addons::DB_VERSION_OPTION`) stores a map of `slug => installed-version`.
- On `init` (priority `4`), `Addons::sync_addon_schemas()` runs and delegates to the reusable static `Addons::sync_schema_for( $addons )`.

`sync_schema_for()` compares each **active** addon's `get_db_version()` against the stored map and, on a mismatch, calls `install_tables()` and records the new version. The map is written once at the end:

```php
public static function sync_schema_for( array $addons ): void {
	$stored  = (array) get_option( self::DB_VERSION_OPTION, [] );
	$changed = false;

	foreach ( $addons as $slug => $addon ) {
		if ( ! $addon instanceof AbstractAddon ) {
			continue;
		}

		$declared = $addon->get_db_version();
		if ( '' === $declared ) {
			continue; // No tables of its own.
		}

		if ( isset( $stored[ $slug ] ) && $stored[ $slug ] === $declared ) {
			continue; // Already up to date.
		}

		$addon->install_tables();
		$stored[ $slug ] = $declared;
		$changed         = true;
	}

	if ( $changed ) {
		update_option( self::DB_VERSION_OPTION, $stored, true );
	}
}
```

Consequences worth knowing:

- **Only active addons sync.** A disabled addon isn't in the loaded set, so its tables aren't touched.
- **Bumping the version constant re-runs `install_tables()`** on the next request — this is how you ship a schema migration.
- **Pro reuses the same machinery.** The Pro loader calls `\StoreEngine\Addons::sync_schema_for()` with its own addon instances, writing into the same `storeengine_addons_db_version` option. See [Registration and gating](/addons/registration-and-gating).

:::tip Also install on activation
The schema manager handles version-driven syncing, but many addons also call their installer from `addon_activation_hook()` so tables exist the moment the addon is switched on — before the next `init` sync. The affiliate addon does exactly this:

```php
public function addon_activation_hook() {
	Database::init();
	AffiliateSettings::save_settings();
	Helper::flush_rewire_rules();
}
```
Because `install_tables()` is idempotent, running it in both places is safe.
:::

## A real `install_tables()` pattern

The affiliate addon keeps its installer thin — `install_tables()` calls a `Database` class that fans out to one `up()` method per table. From `addons/affiliate/database.php`:

```php
namespace StoreEngine\Addons\Affiliate;

use StoreEngine\Addons\Affiliate\Database\{
	CreateAffiliate,
	CreateCommission,
	CreateReferral,
	CreateReferralTrack,
	CreateAffiliateReport
};
use StoreEngine\Utils\Helper;

class Database {
	public static function init() {
		$self = new self();
		$self->create_initial_custom_table();
	}

	public static function create_initial_custom_table() {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		global $wpdb;
		$prefix          = $wpdb->prefix . Helper::DB_PREFIX;
		$charset_collate = $wpdb->get_charset_collate();

		CreateAffiliate::up( $prefix, $charset_collate );
		CreateReferral::up( $prefix, $charset_collate );
		CreateReferralTrack::up( $prefix, $charset_collate );
		CreateCommission::up( $prefix, $charset_collate );
		CreateAffiliateReport::up( $prefix, $charset_collate );
	}
}
```

Each `up()` runs a single `dbDelta` call. From `addons/affiliate/database/create-affiliate.php`:

```php
namespace StoreEngine\Addons\Affiliate\Database;

class CreateAffiliate {
	public static function up( $prefix, $charset_collate ) {
		$table_name = $prefix . 'affiliates';
		$sql = "CREATE TABLE IF NOT EXISTS {$table_name} (
			`affiliate_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
			`user_id` BIGINT(20) UNSIGNED NOT NULL,
			`commission_type` ENUM('percentage', 'flat') NOT NULL,
			`commission_rate` INT(3) UNSIGNED NOT NULL,
			`status` ENUM('active', 'inactive', 'pending') NOT NULL,
			`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (`affiliate_id`),
			UNIQUE KEY `user_id` (`user_id`)
		) $charset_collate;";

		dbDelta( $sql );
	}
}
```

Note the conventions:

- **Table prefix.** `$wpdb->prefix . Helper::DB_PREFIX` yields the StoreEngine-namespaced prefix (e.g. `wp_storeengine_`), so the table lands at `wp_storeengine_affiliates`.
- **`$charset_collate`** from `$wpdb->get_charset_collate()` matches the site's charset.
- **`require_once ABSPATH . 'wp-admin/includes/upgrade.php'`** makes `dbDelta()` available — it isn't loaded on the front end by default.

## `dbDelta` and idempotency rules

`install_tables()` runs whenever the version changes and (usually) on activation, so it must be safe to run repeatedly. `dbDelta()` is designed for this, but it's picky about SQL formatting:

- **One field per line**, exactly two spaces between the column name and its type. `dbDelta` parses your SQL with a regex, and sloppy whitespace produces silently wrong diffs.
- Put **`PRIMARY KEY`** with two spaces after `KEY` and wrap the column in parentheses: `PRIMARY KEY  (id)`.
- Give every **`KEY`/`UNIQUE KEY`** an explicit index name.
- **Don't use `IF NOT EXISTS`** as a substitute for correctness — `dbDelta` compares the described schema against the live table and only applies differences. (The affiliate example above uses `CREATE TABLE IF NOT EXISTS`, which is harmless, but rely on `dbDelta`'s diffing, not on the guard, for upgrades.)
- Keep column and key definitions stable between versions; to change a column, edit its line and bump the DB version so `dbDelta` alters it.

:::warning Idempotency is a hard requirement
`install_tables()` may be called on every activation and after every version bump. Never put one-shot side effects (inserting seed rows unconditionally, dropping data) directly in it. Guard any data seeding so re-running is a no-op.
:::

## Other table-owning addons

The affiliate addon is one example. Others that own custom tables and follow the same pattern include `couriers`, `multi-vendor`, `embeddable-checkout`, `eu-compliance`, and `funnel-builder`. Browse their `database/` directories for more `dbDelta` examples.

## Related

- [Database schema](/data/database-schema) — StoreEngine's core tables and conventions.
- [Registration and gating](/addons/registration-and-gating) — how active addons are collected for schema syncing.
- [Create your first addon](/addons/create-your-first-addon) — where the table methods fit.
