---
title: "StoreEngine Plugin Structure"
description: "Annotated directory map of the StoreEngine free and Pro plugins, the addons convention, and a reference table of the key entry files developers touch."
sidebar_label: "Plugin Structure"
keywords: [storeengine directory structure, plugin structure, storeengine includes, storeengine addons, storeengine entry files, wordpress plugin layout]
---

This page is a map of the StoreEngine codebase — the top-level directories of the free plugin, the Pro plugin's layout, the `addons/` convention both share, and the handful of entry files you will open most often.

## Free plugin (`storeengine/`)

The plugin's PHP lives under `includes/`, with build source under `dev_storeengine/`, compiled output under `assets/`, and storefront markup under `templates/`.

```text
storeengine/
├── storeengine.php          # Main file: plugin header + `final class StoreEngine` singleton
├── includes/                # All PHP (PSR-4 under the StoreEngine\ namespace)
├── addons/                  # Toggleable feature packages (see the addons convention)
├── templates/               # Storefront templates (theme-overridable)
├── assets/                  # Built JS/CSS (emitted by Webpack — do not hand-edit)
├── dev_storeengine/         # JS/React source (what you edit)
├── i18n/languages/          # Translation files (text domain: storeengine)
├── vendor/                  # Composer dependencies (Strauss-prefixed)
├── webpack.config.js        # Webpack config
├── build.sh                 # Distributable-zip build script
├── build.config.json        # Build configuration
├── build-tools/             # Build helpers
└── phpcs.xml                # WPCS + VIPCS ruleset
```

### `includes/` directory map

| Path | Purpose |
| --- | --- |
| `autoload.php` | PSR-4 autoloader (`StoreEngine\Autoload`); addons register their namespace here. |
| `addons.php` / `addons/` | Addon framework: the loader (`\StoreEngine\Addons`) and its supporting classes. |
| `admin/` | wp-admin screens, menus, and settings UI. |
| `ai/` | AI feature scaffolding shared by AI-powered features. |
| `ajax/` (`ajax.php`) | `admin-ajax` handlers. |
| `api/` (`api.php`) | REST controllers under the `storeengine/v1` namespace. |
| `assets.php` | Asset registration and enqueue logic. |
| `backup/` | Backup/export routines. |
| `blocks/` | Gutenberg block bridge that wraps shortcodes as blocks. |
| `classes/` | Domain and abstract classes (Order, Cart, Product, Customer, `AbstractAddon`, etc.). |
| `cli/` (`cli.php`) | WP-CLI commands (`account`, `license`, `order`, …). |
| `compatibility/` | Interop shims for themes and other plugins. |
| `database/` | `create-*.php` table schemas for the `wp_storeengine_*` tables. |
| `frontend/` (`frontend.php`) | Storefront controllers and rendering. |
| `hooks/` (`hooks.php`) | Registration of StoreEngine's own `storeengine/…` actions and filters. |
| `integrations/` (`integrations.php`) | Third-party service integrations. |
| `interfaces/` | Shared interfaces/contracts. |
| `models/` | Data-mapper models over the custom tables. |
| `payment-gateways/` (`payment-gateways.php`) | Gateway framework and base classes (namespace `StoreEngine\Payment\Gateways`). |
| `post/` (`post.php`) | Custom post types (`storeengine_product`, `storeengine_coupon`) and taxonomies. |
| `schedule.php` / `schedules/` | Cron scheduling and scheduled jobs. |
| `shipping/` | Shipping zones, methods, and calculation. |
| `shortcode/` (`shortcode.php`) | Storefront shortcodes. |
| `traits/` | Reusable PHP traits. |
| `utils/` | Helpers and utilities — `Helper`, `Template`, formatting, and constants. |
| `installer.php` | Table creation and version upgrades on activation. |
| `action-queue.php` | Deferred/background action processing. |

## Pro plugin (`storeengine-pro/`)

Pro mirrors the free plugin's conventions on a smaller footprint. It contributes features exclusively as addons and leans on the free plugin's autoloader, schema-sync, and settings systems.

```text
storeengine-pro/
├── storeengine-pro.php      # Plugin header (Requires Plugins: storeengine) + bootstrap
├── includes/
│   ├── addons.php           # StoreEnginePro\Addons loader (storeengine_pro/addons/loader_args)
│   └── …                    # Pro-specific supporting classes (StoreEnginePro\ namespace)
├── addons/                  # Pro feature packages (abandoned-cart, pos, returns, …)
├── assets/                  # Built Pro assets
└── i18n/languages/          # Pro translations (text domain: storeengine-pro)
```

The Pro loader registers each addon's `StoreEnginePro\Addons\*` namespace with the **free** plugin's autoloader and defers schema syncing to the core manager. See [Free vs Pro](/getting-started/free-vs-pro) for the loader and gating details.

## The `addons/` convention

Both plugins store features as self-contained addons under `addons/{slug}/`. Each addon has a main class that extends `\StoreEngine\Classes\AbstractAddon` and is wired in through the loader map:

```text
addons/{slug}/
├── {ClassName}.php          # Main addon class (extends AbstractAddon; provides init()/run())
├── classes/                 # Addon domain classes
├── api/                     # Addon REST controllers (optional)
├── database/                # Addon table schemas (optional)
└── assets/ …                # Addon-specific assets (optional)
```

The loader (`storeengine/addons/loader_args` for free, `storeengine_pro/addons/loader_args` for Pro) maps a slug to a class name; on load, StoreEngine registers `StoreEngine\Addons\{ClassName}` (or `StoreEnginePro\Addons\{ClassName}`) to the addon directory, calls `init()` then `run()`, and — if the addon is active — includes it in schema syncing. See [Building Addons](/addons/architecture) for a full walkthrough.

:::note[Addon autoload path rewrite]
The core autoloader special-cases addon namespaces: paths resolving under `includes/addons/` are rewritten to the top-level `addons/` directory, so addon classes live at `addons/{slug}/` while sharing the `StoreEngine\Addons\` namespace.
:::

## Key entry files

Start here when tracing how a subsystem boots:

| File | Role |
| --- | --- |
| `storeengine.php` | Plugin header and the `StoreEngine` singleton — the composition root. |
| `includes/addons.php` | `\StoreEngine\Addons` — loads and schema-syncs addons. |
| `includes/api.php` | `\StoreEngine\API` — registers all `storeengine/v1` REST controllers. |
| `includes/hooks.php` | Registers StoreEngine's `storeengine/…` actions and filters. |
| `includes/database.php` | Orchestrates the `create-*.php` table schemas. |
| `includes/utils/helper.php` | `\StoreEngine\Utils\Helper` — the workhorse utility (addon status, store context, page checks). |

## Where to go next

- [Architecture Overview](/getting-started/architecture-overview) — how these directories collaborate at runtime.
- [Building Addons](/addons/architecture) — scaffold an addon that follows this convention.
- [Templates](/reference/templates) — override anything in `templates/` from your theme.
