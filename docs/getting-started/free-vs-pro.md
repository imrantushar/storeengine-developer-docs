---
title: "StoreEngine Free vs Pro for Developers"
description: "How the StoreEngine free/Pro split works for developers: shared addon framework, Pro's dependency on free, its loader filter, schema-sync reuse, and addon gating."
sidebar_label: "Free vs Pro"
keywords: [storeengine pro, storeengine free vs pro, addon gating, is_active_storeengine_pro, storeengine licensing, storeengine pro addons, storeengine addon framework]
---

StoreEngine ships as two plugins — the free **StoreEngine** and the paid **StoreEngine Pro** — but from a developer's perspective they are one system. Both are addon-based, Pro depends on free, and Pro reuses the free plugin's autoloader, addon loader, schema-sync, and settings machinery. This page explains the split and how features are gated.

## One framework, two plugins

Everything in StoreEngine — in both plugins — is an **addon**. Pro does not fork or replace the free engine; it registers additional addons into the same framework. That means:

- The **free** plugin owns the engine: the singleton bootstrap, autoloader, addon loader, REST layer, data layer, and the schema-sync manager.
- The **Pro** plugin contributes features only, as addons under its own `addons/` directory, and delegates the heavy lifting back to free.

Pro's plugin header declares the dependency explicitly:

```php
/**
 * Plugin Name: StoreEngine Pro
 * Requires Plugins: storeengine
 * …
 */
```

WordPress will not let Pro activate unless the free plugin is active, and Pro's code assumes free's classes are loadable.

## How Pro registers its addons

Pro mirrors the free loader with its own filter. `StoreEnginePro\Addons::addons_loader()` builds a slug → class map through `storeengine_pro/addons/loader_args`, then for each addon:

```php
$addons = apply_filters( 'storeengine_pro/addons/loader_args', [
    'membership'         => 'Membership',
    'subscription'       => 'Subscription',
    'installment-plan'   => 'InstallmentPlan',
    // …
] );

foreach ( $addons as $addon_name => $addon_class_name ) {
    $addon_root_path = STOREENGINE_PRO_ADDONS_DIR_PATH . $addon_name . '/';
    $addon_namespace = 'StoreEnginePro\\Addons\\' . $addon_class_name;

    // Register the Pro addon's namespace with the FREE plugin's autoloader.
    Autoload::get_instance()->add_namespace_directory( $addon_namespace, $addon_root_path );

    $class = $addon_namespace . '\\' . $addon_class_name;
    $class = $class::init();
    $class->run();
}
```

Two things to note:

1. Pro addons extend the **free** plugin's `\StoreEngine\Classes\AbstractAddon` — the same base class free addons use.
2. Pro registers its namespaces with the **free** plugin's `Autoload::get_instance()` — there is one autoloader for both plugins.

## Shared schema-sync and settings

Pro addons participate in the **same** schema-versioning system as free addons. Both share the single `storeengine_addons_db_version` option, and the core manager `\StoreEngine\Addons::sync_schema_for()` compares each active addon's `get_db_version()` against it and reruns `install_tables()` on a mismatch. Pro simply hands its active addons to that manager:

```php
// Pro addons share the core's single `storeengine_addons_db_version` option;
// the core manager (\StoreEngine\Addons::sync_schema_for) drives the upgrade.
add_action( 'init', [ $this, 'sync_addon_schemas' ], 4 );
```

The admin settings system is shared too, so Pro addons register their options and toggles through the same surfaces free addons use — a store owner enables and disables Pro addons in the same UI.

## How "Pro" gating works

A feature being "Pro" means two things, both required at runtime:

1. Its addon **lives in the Pro plugin** (`storeengine-pro/addons/{slug}/`).
2. It is **gated behind Pro being active and licensed**.

The gate is `\StoreEngine\Utils\Helper::get_addon_active_status()`. Pass `$is_pro = true` for Pro features and it short-circuits to `false` unless Pro is active:

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

Guard Pro-only code paths with the Pro flag so they degrade cleanly when Pro is absent:

```php
use StoreEngine\Utils\Helper;

if ( Helper::get_addon_active_status( 'installment-plan', true ) ) {
    // Safe: only runs when Pro is active AND the addon is enabled.
}
```

:::warning Active is not the same as licensed
`get_addon_active_status()` confirms Pro is present and the addon is enabled. Licensed Pro features additionally validate a license key at runtime. In development you can load Pro's code by activating the plugin, but license-gated behavior may remain inactive until a valid license is applied.
:::

## Addon reference: free vs Pro

Several slugs appear in **both** plugins (for example `membership`, `subscription`, `multi-vendor`, `funnel-builder`, `ai`, `inventory`/`inventory-pro`, `seeder`). In those cases the free addon provides the baseline and the Pro addon extends it — enabling Pro unlocks the advanced surface of the same feature.

| Free addons (`storeengine/addons/`) | Pro addons (`storeengine-pro/addons/`) |
| --- | --- |
| affiliate | abandoned-cart |
| ai | advanced-coupon |
| brand | ai |
| catalog-mode | cost-profit |
| couriers | dropshipping |
| csv | dynamic-pricing |
| email | fraud-shield |
| embeddable-checkout | funnel-builder |
| eu-compliance | installment-plan |
| eu-vat | inventory-pro |
| funnel-builder | license-management |
| gdpr | membership |
| instant-checkout | multi-vendor |
| inventory | order-bumps |
| invoice | pos |
| membership | returns |
| migration-tool | role-permission |
| multi-currency | seeder |
| multi-vendor | subscription |
| paddle | suppliers |
| paypal | verification |
| razorpay | |
| seeder | |
| seo | |
| stripe | |
| subscription | |
| webhooks | |

:::info Payment gateways are free addons
The bundled payment gateways — Stripe, PayPal, Razorpay, and Paddle — ship as **free** addons. Adding a new gateway does not require Pro; see [Payment Gateways](/reference/payment-gateways).
:::

## Where to go next

- [Building Addons](/addons/architecture) — build an addon for either plugin using this shared framework.
- [Architecture Overview](/getting-started/architecture-overview) — how the addon framework fits the whole engine.
- [Plugin Structure](/getting-started/plugin-structure) — where free and Pro code live on disk.
