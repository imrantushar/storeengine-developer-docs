---
title: "WP-CLI Commands"
description: "The wp storeengine command family: list and delete orders, move a customer's data between users, run backups, and manage licenses from the terminal."
sidebar_label: "WP-CLI"
keywords: [storeengine, wp-cli, wp storeengine, order cli, account move, license cli, backup, wordpress cli]
---

StoreEngine registers a `wp storeengine` command namespace when WP-CLI is available. Commands are wired up in `StoreEngine\Cli::register_cli_commands()` on the `cli_init` hook (`includes/cli.php`), with the subcommand classes under `includes/cli/`.

The registered top-level commands are `order`, `account`, `backup`, and — only when the license-management addon is active — `license`.

## `wp storeengine order`

Manage orders from the terminal (`includes/cli/order.php`).

### `order list`

List orders, most recent first.

| Option | Default | Description |
| --- | --- | --- |
| `--status=<status>` | *(all)* | Filter by status: `pending`, `processing`, `completed`, `on_hold`, `cancelled`, `refunded`, `failed`. |
| `--limit=<limit>` | `10` | Max orders to list. Use `-1` for all. |

```bash
wp storeengine order list --status=completed --limit=50
```

Outputs a table of `ID`, `Status`, `Type`, `Total`, `Currency`, `Customer ID`, `Date`.

### `order delete`

Delete one order, or all orders matching a filter. Requires either `--id` or `--status`.

| Option | Default | Description |
| --- | --- | --- |
| `--id=<id>` | — | Order ID to delete, or `all` for every order. |
| `--status=<status>` | — | Delete all orders with this status. |
| `--force` | `false` | Skip the confirmation prompt. |
| `--skip-trash` | `false` | Delete directly from the database (bypass trash). |

```bash
wp storeengine order delete --id=123
wp storeengine order delete --status=cancelled --force
wp storeengine order delete --id=all --skip-trash --force
```

Without `--force` you are asked to confirm before deletion; a progress bar tracks the run.

## `wp storeengine account`

### `account move`

Transfer a customer's StoreEngine data — orders, subscriptions, licenses, and related records — from one WordPress user to another. The move is **additive and non-destructive**: neither user account is deleted, only record ownership changes. Requires both `--from` and `--to`.

| Option | Default | Description |
| --- | --- | --- |
| `--from=<id>` | — | Source user ID (data moves **from** here). |
| `--to=<id>` | — | Target user ID (data moves **to** here). |
| `--dry-run` | `false` | Show what would move without changing anything. |
| `--yes` | `false` | Skip the confirmation prompt. |

```bash
# Preview the transfer first.
wp storeengine account move --from=12 --to=34 --dry-run

# Perform it.
wp storeengine account move --from=12 --to=34 --yes
```

A dry run prints a per-entity row count and the total that would move. The real run confirms (unless `--yes`) then reports the number of records transferred.

## `wp storeengine backup`

Backup commands are provided by `StoreEngine\Backup\Cli`. Run `wp help storeengine backup` for the available subcommands and options on your install.

## `wp storeengine license`

:::note Requires the addon
The `license` command is only registered when the **license-management** addon is active. If it is off, `wp storeengine license` is unavailable.
:::

Manage software licenses (`includes/cli/license.php`).

| Subcommand | Options | Description |
| --- | --- | --- |
| `license list` | `--status`, `--limit` | List licenses, optionally filtered by status. |
| `license sync-activations` | `--id=<id>\|all` | Recount/reconcile activation records for one or all licenses. |
| `license delete` | `--id`, `--status`, `--force` | Delete licenses by ID or status. |
| `license heal-keys` | `--id`, `--dry-run`, `--yes` | Repair malformed/missing license keys. |
| `license regenerate` | `--id=<id>` (comma list), `--yes` | Regenerate one or more license keys. |

```bash
wp storeengine license list --status=active --limit=100
wp storeengine license sync-activations --id=all
wp storeengine license heal-keys --dry-run
wp storeengine license regenerate --id=45,46,47 --yes
```

## See also

- [Orders](/data/orders) — the order objects the `order` command operates on.
- [Subscriptions](/data/subscriptions) — records moved by `account move`.
- [Free vs Pro](/getting-started/free-vs-pro) — where license management lives.
