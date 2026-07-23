---
title: "Blocks & the Shortcode Bridge"
description: "StoreEngine's shortcode-to-block bridge: the generic storeengine/shortcode block, the descriptor registry, registering your shortcode as a block, attribute types, and aBlocks mapping."
sidebar_label: "Blocks"
keywords: [storeengine, gutenberg blocks, shortcode block, storeengine_register_shortcode_block, block registry, ablocks, block descriptor]
---

StoreEngine does not ship a dozen bespoke Gutenberg blocks. Instead it ships one generic block — `storeengine/shortcode` — that can render **any** registered shortcode with real editor controls, driven by a descriptor registry. This works with only StoreEngine active (no page-builder dependency), and when [aBlocks](https://wordpress.org/plugins/ablocks/) is installed, styled native blocks layer on top with a one-click "Convert".

This page covers the block, the registry, and how to expose your own shortcode as a configurable block.

## The `storeengine/shortcode` block

Defined in `includes/blocks/block.json` (title "StoreEngine Shortcode", category `widgets`, `apiVersion` 3) and wired up by `StoreEngine\Blocks\Bridge` (`includes/blocks/bridge.php`). Its attributes:

| Attribute | Type | Purpose |
| --- | --- | --- |
| `shortcode` | string | Descriptor id, `owner/tag` (e.g. `storeengine/storeengine_products`). |
| `atts` | object | Key/value map of shortcode attributes. |
| `content` | string | Inner content for content-supporting shortcodes. |

On the server, `Bridge::render()` looks up the descriptor, rebuilds a **minimal** shortcode string (only non-default attributes, each coerced by its sanitize hint), and delegates to `do_shortcode()`. If the id has no registered descriptor, it still renders the bare tag, so the block works for any shortcode.

### Seeding a block into content

Use `Bridge::block()` to generate the block comment (the recommended replacement for a raw `[shortcode]`):

```php
use StoreEngine\Blocks\Bridge;

echo Bridge::block(
	'storeengine/storeengine_products',
	[ 'columns' => 4, 'per_page' => 8 ]
);
// => <!-- wp:storeengine/shortcode {"shortcode":"storeengine/storeengine_products","atts":{"columns":4,"per_page":8}} /-->
```

## The descriptor registry

`StoreEngine\Blocks\Registry` (singleton, `Registry::instance()`) is the single owner of every shortcode-block descriptor. The editor renders its picker and controls purely from this data, exposed to JS via `window.StoreEngineShortcodeBlock` and over REST at `GET /shortcode-block/v1/registry`.

Descriptors are **validated on registration** — a malformed descriptor is skipped (and logged under `WP_DEBUG`) rather than fataling the editor.

### Extension APIs

Register a descriptor in one of two ways. Call on an `init`-level hook, after the shortcode itself is added.

**Imperative** — the global function:

```php
add_action( 'init', function () {
	storeengine_register_shortcode_block( [
		'tag'      => 'my_product_grid',
		'owner'    => 'my-plugin',
		'title'    => __( 'My Product Grid', 'my-plugin' ),
		'category' => __( 'My Plugin', 'my-plugin' ),
		'icon'     => 'grid-view',
	] );
}, 20 );
```

**Declarative** — the filter (collected lazily, after all plugins load):

```php
add_filter( 'storeengine_shortcode_block_registry', function ( array $descriptors ) {
	$descriptors[] = [
		'tag'   => 'my_product_grid',
		'owner' => 'my-plugin',
		'title' => __( 'My Product Grid', 'my-plugin' ),
	];
	return $descriptors;
} );
```

## Descriptor fields

| Field | Required | Description |
| --- | --- | --- |
| `tag` | yes | The shortcode tag (without brackets). |
| `owner` | yes | Namespace/slug; descriptors are keyed by `owner/tag`, so two plugins can share a bare tag. |
| `title` | yes | Human label in the block picker. |
| `category` | no | Editor category (default: `ucfirst(owner)`). |
| `description` | no | Shown in the block inspector. |
| `icon` | no | Dashicon slug (default `shortcode`). |
| `keywords` | no | Array of search keywords. |
| `attributes` | no | Array of attribute definitions (see below). |
| `preview.mode` | no | `server` (default), `static`, or `none`. |
| `content.mode` | no | `plain` or `innerblocks` (for content-supporting shortcodes). |
| `ablocks_block` | no | Native `ablocks/*` block this converts to. |
| `ablocks_map` | no | Map of shortcode atts → aBlocks block attributes. |

## Attribute types

Attribute definitions need at least `name` and `label`. Valid `type` values (`Registry::TYPES`):

| Type | Notes |
| --- | --- |
| `text` | Single-line text. |
| `textarea` | Multi-line text. |
| `number` | Numeric input. |
| `range` | Slider — requires `min` and `max`. |
| `toggle` | Boolean (default `'false'`). |
| `select` | Dropdown — requires `options`. |
| `radio` | Radio group — requires `options`. |
| `color` | Color picker. |
| `post-select` | Post picker — requires `post_type`. |
| `taxonomy-select` | Term picker — requires `taxonomy`. |
| `csv` | Comma-separated values. |

Each attribute also supports `default`, `help`, `placeholder`, `required`, `group`, `sanitize`, and `depends_on` (`{ name, value }` for conditional display). The `sanitize` hint (`int`, `key`, `url`, `color`, `csv`, `text`) is applied server-side before the value enters the shortcode string; sensible defaults are derived from the type.

## Full descriptor example

This is how core registers the products grid (`includes/blocks/core-shortcodes.php`):

```php
storeengine_register_shortcode_block( [
	'tag'           => 'storeengine_products',
	'owner'         => 'storeengine',
	'title'         => __( 'Products', 'storeengine' ),
	'category'      => __( 'StoreEngine', 'storeengine' ),
	'icon'          => 'grid-view',
	'keywords'      => [ 'products', 'grid', 'shop' ],
	'ablocks_block' => 'ablocks/storeengine-products',
	'attributes'    => [
		[
			'name' => 'columns', 'label' => __( 'Columns', 'storeengine' ),
			'type' => 'range', 'default' => 3, 'min' => 1, 'max' => 6, 'step' => 1,
			'group' => __( 'Layout', 'storeengine' ), 'sanitize' => 'int',
		],
		[
			'name' => 'per_page', 'label' => __( 'Products per page', 'storeengine' ),
			'type' => 'number', 'default' => 9, 'min' => 1,
			'group' => __( 'Layout', 'storeengine' ), 'sanitize' => 'int',
		],
		[
			'name' => 'orderby', 'label' => __( 'Order by', 'storeengine' ),
			'type' => 'select', 'default' => 'date', 'sanitize' => 'key',
			'group' => __( 'Query', 'storeengine' ),
			'options' => [
				[ 'label' => __( 'Newest', 'storeengine' ), 'value' => 'date' ],
				[ 'label' => __( 'Title', 'storeengine' ), 'value' => 'title' ],
				[ 'label' => __( 'Price', 'storeengine' ), 'value' => 'price' ],
			],
		],
		[
			'name' => 'ids', 'label' => __( 'Specific product IDs', 'storeengine' ),
			'type' => 'csv', 'default' => '', 'sanitize' => 'csv',
			'group' => __( 'Query', 'storeengine' ),
		],
	],
] );
```

## aBlocks mapping

Core shortcodes declare an `ablocks_block` so that, when aBlocks is installed, the editor offers a one-click Convert from the generic block to a styled native block. The mappings core registers include:

| Shortcode | Native block |
| --- | --- |
| `storeengine_checkout_form` | `ablocks/storeengine-checkout-form` |
| `storeengine_products` | `ablocks/storeengine-products` |
| `storeengine_cart_list_table` | `ablocks/storeengine-cart-list` |
| `storeengine_cart_sub_total_table` | `ablocks/storeengine-cart-sub-table` |
| `storeengine_apply_coupon_form` | `ablocks/storeengine-coupon-form` |
| `storeengine_mini_cart` | `ablocks/storeengine-mini-cart` |
| `storeengine_login_form` | `ablocks/storeengine-login-form` |
| `storeengine_order_details` | `ablocks/storeengine-order-details` |

Provide `ablocks_map` to translate your shortcode attribute names onto the target block's attribute names.

## See also

- [Shortcodes](/reference/shortcodes) — the tags these blocks wrap.
- [Templates](/reference/templates) — what a shortcode renders.
- [Building Addons](/addons/architecture) — where a plugin registers its blocks.
