---
title: "Coding Standards & Contributing"
description: "StoreEngine's coding standards: WordPress + VIP PHP standards via phpcs, ESLint and Prettier for JS, EditorConfig, the pinned Node version, and the pull-request workflow."
sidebar_label: "Coding Standards"
keywords: [storeengine, coding standards, phpcs, wpcs, eslint, prettier, editorconfig, contributing, pull request]
---

StoreEngine follows the WordPress coding standards for PHP and the WordPress/Prettier stack for JavaScript, enforced by linters that run locally and in CI. This page covers the tooling and the contribution workflow so a patch passes review the first time.

## PHP: WPCS + PHP_CodeSniffer

PHP is checked with **PHP_CodeSniffer** against a ruleset built on the WordPress Coding Standards (`phpcs.xml`). The ruleset composes `WordPress-Core`, `WordPress-Docs`, `WordPress-Extra`, `WordPress.Security`, `WordPress.DB`, and `WordPress.WP.I18n` (text domain `storeengine`), plus `PHPCompatibility` / `PHPCompatibilityWP` for cross-version safety, targeting **PHP 7.4+**.

Notable house rules from `phpcs.xml`:

- **Tabs for indentation** (4-width); spaces are disallowed for indent.
- **Short array syntax** (`[]`) is allowed — the long-syntax requirement is disabled.
- No closing `?>` tag at end of files; no BOM.
- `goto` and `eval()` are hard errors.
- Line soft-limit of 120 chars (warn, not error).
- Unix line endings (`\n`).
- Excluded from scanning: `vendor/`, `node_modules/`, `assets/`, `library/`, `dev_storeengine/`, and `tests/` (for some comment sniffs).

Composer exposes the lint/format scripts (`composer.json`):

```bash
# Report violations (phpcs) across includes, addons, templates.
composer lint

# Auto-fix what can be fixed (phpcbf).
composer format

# Write a full report to phpcs.log.
composer lint:log
```

### Static analysis

The repo also runs **PHPStan** (`szepeviktor/phpstan-wordpress`):

```bash
composer analyze   # phpstan analyse --memory-limit=3048M .
```

## JavaScript: ESLint + Prettier

JS/TS is linted with **ESLint** on top of `@wordpress/eslint-plugin` and **Prettier** using `@wordpress/prettier-config` (`.eslintrc.js`, `.prettierrc.js`). TypeScript files additionally extend `@typescript-eslint/recommended`.

Scripts (`package.json`, powered by `@wordpress/scripts`):

```bash
npm run lint:js        # ESLint
npm run lint:js:fix    # ESLint with --fix
npm run lint:css       # Stylelint
npm run format         # wp-scripts format (Prettier)
```

Project-specific ESLint tweaks include disabling `camelcase` (WordPress uses snake_case in many API payloads) and registering globals such as `jQuery` and `StoreEngineGlobal`.

## EditorConfig

`.editorconfig` unifies indentation across editors:

| File type | Indent |
| --- | --- |
| PHP | tabs, width 4 |
| JS | spaces, size 2 (K&R braces) |
| TS/TSX | spaces, size 2 |
| CSS/SCSS | spaces, size 4 |
| YAML/JSON/NEON | spaces, size 2 |

Global rules: UTF-8, LF line endings, insert final newline, trim trailing whitespace (except Markdown). `.txt` files use CRLF.

## Node version

The Node version is pinned in `.nvmrc`. Use `nvm` to match it before installing dependencies:

```bash
nvm use        # reads .nvmrc (currently Node v24.x)
npm install
```

Check your toolchain against the project's engine requirements with `npm run check-engines`.

## Contribution / PR workflow

1. **Fork and branch.** Create a feature branch off the current working branch (never commit directly to the default branch).
2. **Match the standards.** Run `composer lint` / `composer format` for PHP and `npm run lint:js` / `npm run format` for JS before committing. CI runs the same checks.
3. **Analyze.** Run `composer analyze` (PHPStan) for non-trivial PHP changes.
4. **Test.** Where applicable, run the test suites: `npm run test:unit`, `npm run test:e2e`, and the PHP integration tests via `npm run test:integration` (wp-env). Pro integration tests: `npm run test:integration:pro`.
5. **Add a changelog entry.** Update `changelog.txt` (and `readme.txt` where relevant) with an Added / Improved / Fixed line describing the user-facing effect.
6. **Open the PR** against the upstream repository with a clear description; ensure lint, analysis, and tests are green.

## See also

- [Build & release](/reference/build-and-release) — producing distributable zips.
- [Development environment](/getting-started/development-environment) — local setup.
- [Building Addons](/addons/architecture) — where most contributions land.
