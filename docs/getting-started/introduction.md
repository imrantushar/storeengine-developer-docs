---
title: "Introduction to StoreEngine Development"
description: "Developer introduction to StoreEngine 2.2.0, the table-backed WordPress eCommerce engine — what it is, who these docs serve, and what you can build with it."
sidebar_label: "Introduction"
keywords: [storeengine, wordpress ecommerce, storeengine developer docs, wordpress plugin development, ecommerce api, storeengine addons]
---

StoreEngine is a **table-backed eCommerce engine for WordPress** — a full commerce platform built by [Kodezen](http://kodezen.com) that powers payments, memberships, affiliates, subscriptions, and sales from a single plugin. These docs are the developer reference for extending, integrating with, and building on top of it.

This page orients you: what StoreEngine is from a developer's perspective, who the documentation is for, and what you can build.

## What StoreEngine is

StoreEngine ships in two plugins:

- **StoreEngine** (free) — the core engine and the majority of commerce features, distributed on WordPress.org.
- **StoreEngine Pro** — a companion plugin that requires the free plugin and adds advanced, licensed features.

Unlike classic WordPress commerce plugins that store everything in `wp_posts` and `wp_postmeta`, StoreEngine uses **custom database tables** (prefixed `wp_storeengine_*`) for high-volume, relational data such as orders, order items, carts, subscriptions, and payment tokens. Products and coupons remain custom post types (`storeengine_product`, `storeengine_coupon`), so they benefit from the familiar WordPress editing experience, while transactional data lives in a schema built for scale.

:::info Orders are not posts
Orders and subscriptions are **not** custom post types. They live in the `storeengine_orders` table and are discriminated by a `type` column. Query and manipulate them through the domain classes and models, not `WP_Query`. See [Data & Objects](/data/orders).
:::

Almost everything in StoreEngine — including core commerce features and payment gateways — ships as a toggleable **addon**. This keeps the runtime lean (only what a store enables is loaded) and gives developers a first-class extension surface. See the [Architecture Overview](/getting-started/architecture-overview).

## At a glance

| Property | Value |
| --- | --- |
| Current version | 2.2.0 |
| Requires PHP | 7.4+ |
| Requires WordPress | 6.5+ |
| License | GPL-3.0-or-later |
| Text domain | `storeengine` |
| Root namespace | `StoreEngine\` (PSR-4) |
| Author | Kodezen |
| Pro plugin namespace | `StoreEnginePro\` |
| REST namespace | `storeengine/v1` |

## Who these docs are for

These docs assume you are a developer comfortable with PHP, WordPress plugin development, and the WordPress hook system. They are written for people who want to:

- Build **addons** that add features to StoreEngine.
- Integrate external systems through the **REST API** (`storeengine/v1`).
- Register **custom payment gateways** or shipping/courier providers.
- **Override storefront templates** from a theme.
- Hook into the commerce lifecycle with StoreEngine's **actions and filters**.
- Read and write orders, products, and other domain objects programmatically.

If you are a store owner looking for setup and configuration help, the product documentation at [storeengine.pro](https://storeengine.pro) is a better starting point.

## What you can build

<div className="row">

- **Addons** — self-contained feature packages that register their own namespace, database schema, admin UI, and hooks. This is the primary way to extend StoreEngine. See [Building Addons](/addons/architecture).
- **REST integrations** — headless storefronts, mobile apps, POS clients, and server-to-server automation against the `storeengine/v1` API. See [REST API](/rest-api/overview).
- **Payment gateways** — plug new processors into the checkout flow via the gateway framework. See [Payment Gateways](/reference/payment-gateways).
- **Template overrides** — customize storefront markup by copying templates into `yourtheme/storeengine/`. See [Templates](/reference/templates).
- **Hook extensions** — react to and modify behavior through `storeengine/…` actions and filters. See [Hooks](/reference/hooks/actions).
- **WP-CLI automation** — script store operations. See [WP-CLI](/reference/wp-cli).

</div>

## Where to go next

| If you want to… | Start here |
| --- | --- |
| Understand how the pieces fit together | [Architecture Overview](/getting-started/architecture-overview) |
| Set up a local build | [Development Environment](/getting-started/development-environment) |
| Learn the codebase layout | [Plugin Structure](/getting-started/plugin-structure) |
| Understand the free/Pro split | [Free vs Pro](/getting-started/free-vs-pro) |
| Build your first addon | [Building Addons](/addons/architecture) |
| Call the API | [REST API](/rest-api/overview) |
| Work with orders and products | [Data & Objects](/data/orders) |

:::tip
New to the codebase? Read the four Getting Started pages in order, then jump into [Building Addons](/addons/architecture) — the addon framework is the concept that ties the whole plugin together.
:::
