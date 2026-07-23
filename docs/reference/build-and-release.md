---
title: "Build & Release"
description: "Build StoreEngine locally and produce distributable zips: the webpack JS build, composer/Strauss PHP dependencies, the .distignore-driven zip, versioning, and the changelog."
sidebar_label: "Build & Release"
keywords: [storeengine, build, release, webpack, wp-scripts, strauss, composer, distignore, versioning, zip, dev_storeengine]
---

StoreEngine has a JavaScript build (webpack via `@wordpress/scripts`), a PHP dependency step (Composer with Strauss namespace-prefixing), and a distributable-zip step driven by `.distignore`. The free (`storeengine`) and Pro (`storeengine-pro`) plugins have **parallel** build setups with the same tooling. This page covers building both.

:::note
Dev JS source lives in `dev_storeengine/`; the compiled output ships in `assets/` (e.g. `assets/build/`). Only the built `assets/` are shipped — `dev_storeengine/` is excluded from the zip.
:::

## Prerequisites

- **Node** — the version pinned in `.nvmrc` (`nvm use`).
- **Composer** and PHP 7.4+.
- **rsync** and **zip** (for `build.sh`).

## JavaScript build

Scripts are in `package.json`, built on `@wordpress/scripts` (webpack under the hood).

```bash
npm install          # install JS dependencies

npm start            # dev: watch + rebuild (wp-scripts start)
npm run build        # production build (wp-scripts build) → assets/build/
```

Supporting scripts: `npm run generate-icons` (icon font), `npm run wp:pot` (regenerate the translation template), and the lint/format commands covered in [Coding standards](/reference/coding-standards).

## PHP dependencies + Strauss prefixing

PHP dependencies are managed by Composer (`composer.json`). To avoid conflicts when another plugin bundles the same libraries, third-party packages are **prefixed** into the `StoreEngine\` namespace using **Strauss** (`vendor/prefixed/`, namespace prefix `StoreEngine\`, class prefix `StoreEngine_`, constant prefix `STOREENGINE_`).

Strauss runs automatically after `composer install` / `composer update` via the `post-install-cmd` / `post-update-cmd` hooks (which download `strauss.phar` if missing and re-dump the autoloader). Convenience scripts:

```bash
composer run dev      # install ALL deps, including dev (composer install)
composer run build    # production deps only:
                      #   composer install --no-dev --optimize-autoloader --classmap-authoritative
composer run update   # update production deps + reprefix
```

Action Scheduler and the StoreEngine WordPress SDK are excluded from Strauss copying (they self-prefix or must keep their namespace). Pro uses the same setup with the `StoreEnginePro\` prefix.

:::warning Ship the vendor directory whole
When packaging, ship `vendor/` wholesale after a `--no-dev` install rather than excluding the directory. Marking the vendor *directory* as ignored can drop `vendor/autoload.php` under some archiving paths and fatally break the plugin.
:::

## Producing a distributable zip

There are two equivalent paths.

### `build.sh` (fast bash builder)

`build.sh` copies a clean tree (honoring `.distignore`), runs a production Composer install for a slim `vendor/`, strips Composer metadata, and writes a max-compression zip to `~/Desktop` by default.

```bash
./build.sh                 # → ~/Desktop/storeengine.zip
./build.sh --npm           # run `npm run build` first
./build.sh --no-composer   # use vendor/ as-is (skip composer install)
./build.sh --out /tmp      # override output directory
./build.sh --name foo      # override output file name (no .zip)
```

### `build-tools/build.mjs` (cross-platform Node builder)

The `dist` scripts run the Node build kit, which reads `build.config.json` to sequence the JS build, Composer step, POT generation, and zip. It works on macOS, Linux, and Windows.

```bash
npm run dist        # full build → ../storeengine.{version}.zip
npm run dist:zip    # zip step only (skip rebuild)
npm run dist:dev    # dev build variant
```

`build.config.json` declares the enabled steps and tool versions:

```json
{
  "slug": "storeengine",
  "zipName": "{slug}.{version}.zip",
  "outputDir": "..",
  "steps": { "js": true, "composer": true, "strauss": false, "pot": true, "zip": true },
  "js": { "install": "auto", "buildScript": "build" },
  "composer": { "command": "composer run build" },
  "pot": { "command": "npm run wp:pot" },
  "autoDownloadTools": true,
  "toolVersions": { "wpCli": "2.12.0", "strauss": "0.19.3" }
}
```

## What `.distignore` excludes

`.distignore` is the single source of truth for what stays out of the shipped zip. It removes development-only files and directories, including: `dev_storeengine/`, `assets/scss`, `assets/icon-src`, `node_modules`, `build.sh` / `build-tools` / `build.config.json`, `composer.json` / `composer.lock`, `package.json` / lockfiles, `webpack.config.js`, all lint/format configs (`phpcs.xml`, `.eslintrc.js`, `.prettierrc.*`, `.editorconfig`, `.nvmrc`), `tests`, `.git*`, `.github`, `.claude` / `openspec` / `AGENTS.md`, `*.zip` / `*.map`, and doc/QA files. It also trims heavy vendor sub-paths such as bundled font TTFs.

## Versioning and changelog

The version is defined in three places that must stay in sync for a release:

| Location | Field |
| --- | --- |
| `storeengine.php` (plugin header) | `Version:` |
| `storeengine.php` (constant) | `define( 'STOREENGINE_VERSION', ... )` |
| `readme.txt` | `Stable tag:` |
| `package.json` | `"version"` |

The current free and Pro versions are both `2.2.0`; Pro additionally declares `STOREENGINE_PRO_VERSION` and a `STOREENGINE_PRO_MIN_CORE_VERSION` it requires from the free core.

Release notes live in `changelog.txt` (WordPress `== Changelog ==` format), grouped by **Added / Improved / Fixed** under a dated version heading, with the customer-facing summary mirrored into `readme.txt`. Add your entry as part of the PR (see [Coding standards](/reference/coding-standards)).

## Building Pro

`storeengine-pro` mirrors this exactly — its own `build.sh`, `build.config.json` (slug `storeengine-pro`), `.distignore`, and identical `npm run build` / `composer run build` / `npm run dist` scripts. Build it the same way; it produces `../storeengine-pro.{version}.zip`.

## See also

- [Coding standards](/reference/coding-standards) — lint, analysis, and PR workflow.
- [Free vs Pro](/getting-started/free-vs-pro) — the two build targets.
- [Development environment](/getting-started/development-environment) — local setup.
