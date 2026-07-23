---
title: "Pro Addon Catalog"
description: "The StoreEngine Pro addon catalog: what each addon does, how Pro addons load via the loader_args filter, and which features extend a free counterpart."
sidebar_label: "Pro Addons"
keywords: [storeengine pro, pro addons, subscription, membership, multi-vendor, funnel-builder, license-management, storeengine addons]
---

StoreEngine Pro is a companion plugin (`storeengine-pro`) that layers premium features onto the free core using the **same** addon framework — each Pro feature is a toggleable addon that boots only when enabled. Some Pro addons are brand-new features; others extend a free counterpart that ships a base implementation in core.

This page catalogs the Pro addons, explains how they load, and flags the free/Pro overlaps. For the framework itself, see [Addon architecture](/addons/architecture); for the split, see [Free vs Pro](/getting-started/free-vs-pro).

## The catalog

| Addon (slug) | What it does |
| --- | --- |
| `subscription` | Recurring billing: plans, trials, renewals, and subscription management. *(extends free)* |
| `membership` | Content/product access tied to plans and levels. *(extends free)* |
| `installment-plan` | Split a purchase into scheduled installment payments. |
| `license-management` | Software license keys, activations, and the `wp storeengine license` CLI. |
| `abandoned-cart` | Detect abandoned carts and trigger recovery flows. |
| `order-bumps` | One-click add-ons offered at checkout. |
| `funnel-builder` | Sales funnels with upsells/downsells and offer pages. *(extends free)* |
| `inventory-pro` | Advanced stock control plus back-in-stock / restock notifications. |
| `cost-profit` | Track per-product cost and report profit margins. |
| `pos` | Point-of-sale interface for in-person selling. |
| `returns` | RMA / returns and refund request workflow. |
| `suppliers` | Supplier records and purchasing. |
| `multi-vendor` | Marketplace: vendor accounts, storefronts, commissions, payouts. *(extends free)* |
| `dropshipping` | Route orders to dropship suppliers. |
| `fraud-shield` | Fraud scoring and risk rules on orders. |
| `verification` | Buyer/age/identity verification gating. |
| `dynamic-pricing` | Quantity/role/rule-based dynamic pricing. |
| `ai` | AI-assisted commerce features. *(extends free)* |
| `role-permission` | Granular store-role and capability management. |
| `advanced-coupon` | Extended coupon rules beyond the core coupon engine. |
| `seeder` | Generate demo/sample data. *(extends free)* |

## How Pro addons load

Pro addons are registered in `StoreEnginePro\Addons` (`includes/addons.php`). `addons_loader()` builds a `slug => ClassName` map behind the `storeengine_pro/addons/loader_args` filter, then for each entry registers the addon namespace with the autoloader and calls `init()->run()`:

```php
$addons = apply_filters( 'storeengine_pro/addons/loader_args', [
	'membership'         => 'Membership',
	'subscription'       => 'Subscription',
	'installment-plan'   => 'InstallmentPlan',
	'license-management' => 'LicenseManagement',
	// ...
] );

foreach ( $addons as $slug => $class ) {
	$namespace = 'StoreEnginePro\\Addons\\' . $class;
	Autoload::get_instance()->add_namespace_directory( $namespace, $addon_root_path );
	( $namespace . '\\' . $class )::init()->run();
}
```

Each Pro addon class extends the same `StoreEngine\Classes\AbstractAddon` base as core addons, so it participates in the shared active-status gate, schema-sync, and settings pipeline. Only enabled addons sync their schema. Add or replace entries through the `storeengine_pro/addons/loader_args` filter to register your own Pro-tier addon.

:::note[Requires the free core]
StoreEngine Pro declares a minimum core version (`STOREENGINE_PRO_MIN_CORE_VERSION`) and cannot run without the free StoreEngine plugin active — it consumes core's addon framework, schema manager, and settings API.
:::

## Free / Pro overlap

Several features have a base implementation in free core that the Pro addon extends rather than replaces — activating the Pro plugin enriches the same addon. These include **subscription**, **membership**, **multi-vendor**, **funnel-builder**, **ai**, and **seeder**. In these cases the free addon provides the schema and baseline UI; the Pro addon registers additional handlers, admin screens, and gated capabilities under the same slug.

Because both plugins share core's addon registry and settings-sync, there is no duplicate option storage or double registration — the Pro addon hooks into the existing free addon's lifecycle.

## See also

- [Free vs Pro](/getting-started/free-vs-pro) — the feature-by-feature split.
- [Addon architecture](/addons/architecture) and [Registration & gating](/addons/registration-and-gating) — the shared framework.
- [WP-CLI](/reference/wp-cli) — the `license` command that ships with the license-management addon.
