---
title: "Setting Up a StoreEngine Development Environment"
description: "Step-by-step local setup for StoreEngine: prerequisites, cloning, npm and Composer installs, building assets, activating free and Pro, and coding standards."
sidebar_label: "Dev Environment"
keywords: [storeengine development, wordpress plugin setup, npm install, composer install, webpack build, wpcs, vipcs, storeengine local development]
---

This guide walks you through building StoreEngine locally from source — installing dependencies, compiling assets, activating the free and Pro plugins, and running the linters. It assumes a working local WordPress site (Herd, Local, `wp-env`, or any LAMP/LEMP stack).

## Prerequisites

| Tool | Requirement | Notes |
| --- | --- | --- |
| WordPress | 6.5+ | A local install you can drop plugins into. |
| PHP | 7.4+ | Matches the plugin's `Requires PHP`. |
| Node.js | via [nvm](https://github.com/nvm-sh/nvm) | The repo ships a `.nvmrc`; run `nvm use`. |
| Composer | optional but recommended | Manages Strauss-prefixed PHP dependencies. |
| WP-CLI | optional but recommended | Handy for activation and store scripting. |

:::note Node version
The pinned Node version lives in `.nvmrc`. On Linux/macOS, `nvm use` reads it automatically. On Windows, nvm does not read `.nvmrc` — run `nvm use <version>` explicitly, and prefer Git Bash for parity with the shell commands below.
:::

## 1. Clone into `wp-content/plugins`

Clone the free plugin into your WordPress install's plugins directory:

```bash
git clone git@github.com:storeengine/storeengine.git wp-content/plugins/storeengine
cd wp-content/plugins/storeengine
```

If you have Pro access, clone it alongside the free plugin:

```bash
git clone git@github.com:storeengine/storeengine-pro.git wp-content/plugins/storeengine-pro
```

## 2. Select the Node version

```bash
nvm use
```

## 3. Install JavaScript dependencies

```bash
npm install
```

## 4. Install PHP dependencies (optional)

Composer pulls in the vendored, Strauss-prefixed PHP dependencies. The plugin ships a working `vendor/` in distributed builds, but for development from a fresh clone:

```bash
composer install
```

## 5. Build the assets

StoreEngine compiles JavaScript with Webpack. Start the compiler:

```bash
npm start
```

:::warning No dev server
`npm start` compiles the JavaScript bundles — it does **not** launch a hot-reloading dev server. Re-run it (or use a watch task) after editing source. For a one-off production build, use the build script described in [Source vs built assets](#source-vs-built-assets).
:::

## 6. Activate the plugins

Activate **StoreEngine** (free) first, then **StoreEngine Pro** — Pro declares `Requires Plugins: storeengine` and will not run without the free plugin active.

With WP-CLI:

```bash
wp plugin activate storeengine
wp plugin activate storeengine-pro
```

Or from **Plugins → Installed Plugins** in wp-admin. On first activation, the installer creates the `wp_storeengine_*` tables and registers default options; a setup redirect walks you through initial configuration.

:::info Pro licensing
Pro addons are gated behind Pro being **active and licensed**. In development you can activate the plugin to load its code, but licensed features validate a license key at runtime. See [Free vs Pro](/getting-started/free-vs-pro).
:::

## Source vs built assets

Know where code lives versus where it runs:

| Location | Contents |
| --- | --- |
| `dev_storeengine/` | JavaScript/React **source** (what you edit). |
| `assets/` | **Built** bundles emitted by Webpack (what WordPress enqueues). |
| `webpack.config.js` | Webpack configuration. |
| `build.sh`, `build.config.json`, `build-tools/` | Produce distributable zips. |

Edit source under `dev_storeengine/`, run `npm start` to recompile into `assets/`, and never hand-edit built files in `assets/` — they are overwritten on the next build.

To produce a distributable zip, use the build script:

```bash
./build.sh
```

## Coding standards and linting

StoreEngine follows the WordPress coding standards for PHP and standard JS tooling.

- **PHP** — [WPCS](https://github.com/WordPress/WordPress-Coding-Standards) and [VIPCS](https://github.com/Automattic/VIP-Coding-Standards), configured in `phpcs.xml`:

  ```bash
  ./vendor/bin/phpcs        # report violations
  ./vendor/bin/phpcbf       # auto-fix what it can
  ```

- **JavaScript** — ESLint and Prettier per the repo config; run through the project's npm scripts (see `package.json`).

:::tip Git merge driver
The repo recommends configuring the "theirs" merge driver to smooth conflict resolution during rebases: `git config merge.theirs.driver true`.
:::

## Where to go next

- [Plugin Structure](/getting-started/plugin-structure) — learn the directory layout you just cloned.
- [Building Addons](/addons/architecture) — scaffold your first addon.
- [WP-CLI](/reference/wp-cli) — automate store setup and testing.
