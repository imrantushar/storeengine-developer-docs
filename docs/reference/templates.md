---
title: "Template System & Overrides"
description: "Override any StoreEngine storefront template from your theme: the locate_template search order, the yourtheme/storeengine/ path, template functions, hooks, filters, and debug mode."
sidebar_label: "Templates"
keywords: [storeengine, templates, template override, theme override, locate_template, get_template, storeengine template_path, template hooks]
---

Every storefront view StoreEngine renders — the checkout form, cart tables, single-product parts, emails, dashboard, notices — is a PHP template file loaded through a small locator layer in `StoreEngine\Utils\Template` (`includes/utils/template.php`). Because the locator checks your theme before it falls back to the plugin, you can override any template by copying it into your theme, exactly like WooCommerce.

This page covers the search order, the override path, the template functions, and the hooks and filters that let you intercept template loading.

## How templates are located

The defaults live in the plugin's `templates/` directory. The locator resolves a template name against three candidates, in priority order:

1. `yourtheme/{template_path}{template_name}` — e.g. `yourtheme/storeengine/checkout/form.php`
2. `yourtheme/{template_name}` — e.g. `yourtheme/checkout/form.php`
3. `storeengine/templates/{template_name}` — the bundled default (fallback)

`{template_path}` defaults to `storeengine/` and is filterable (see [`storeengine/template_path`](#filters)). The first file that exists wins, so a theme copy always beats the plugin default.

:::tip Override path
To override a template, copy the default file from the plugin's `templates/` directory into **`yourtheme/storeengine/{template-name}.php`**, keeping the same sub-path. For example, override the checkout form by copying `templates/checkout/form.php` to `yourtheme/storeengine/checkout/form.php`.
:::

### Category and tag templates

Template names containing `storeengine_product_category` or `storeengine_product_tag` are normalized from underscores to dashes before lookup (e.g. `storeengine_product_category` → `storeengine-product-category`), so archive templates for those taxonomies resolve to dash-cased theme files.

## Worked example: overriding the checkout form

Say you want to add a trust badge above the checkout form fields.

1. Locate the default in the plugin: `wp-content/plugins/storeengine/templates/checkout/form.php`.
2. Copy it — preserving the sub-directory — to your theme:

```bash
mkdir -p wp-content/themes/your-theme/storeengine/checkout
cp wp-content/plugins/storeengine/templates/checkout/form.php \
   wp-content/themes/your-theme/storeengine/checkout/form.php
```

3. Edit the theme copy. It now takes priority over the plugin default on every checkout render:

```php
<?php
// yourtheme/storeengine/checkout/form.php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="my-theme-trust-badge">
	<?php esc_html_e( 'Secure checkout — 256-bit SSL', 'your-theme' ); ?>
</div>
<?php
// ...keep the rest of the original template markup below.
```

Because templates receive their data through `extract()`, the same variables the plugin passed (`$order`, `$products`, `$cart_sub_total`, etc.) are already in scope in your copy — do not re-declare them.

:::warning Keep overrides in sync
A theme override is a full copy, frozen at the plugin version you copied it from. When StoreEngine updates a default template, your copy will not pick up the change. Re-diff your overrides after major updates.
:::

## Template functions

All methods are static on `StoreEngine\Utils\Template`.

| Method | Purpose |
| --- | --- |
| `get_template( $template_name, $args = [], $template_path = '', $default_path = '' )` | Locate and `include` a template. Extracts `$args` into scope, fires the before/after hooks. Echoes output. |
| `get_template_content( $template_name, $args = [], $template_path = '', $default_path = '' )` | Same as `get_template()` but buffers and **returns** the rendered string. Result passes through the `storeengine/template/get_content` filter. |
| `locate_template( $template_name, $template_path = '', $default_path = '' )` | Resolve a template file path (theme override wins). Returns the located path. |
| `get_template_part( $slug, $name = '' )` | Load a `{slug}-{name}.php` / `{slug}.php` part (theme-overridable). |
| `template_path()` | Returns the theme sub-path, default `storeengine/` (filterable). |
| `plugin_path()` | Returns the plugin root path (filterable). |

### Rendering a template from your code

```php
use StoreEngine\Utils\Template;

// Echoes the located template with $args extracted into scope.
Template::get_template( 'shortcode/apply-coupon-form.php', [
	'placeholder'  => __( 'Coupon Code', 'my-plugin' ),
	'button_label' => __( 'Apply', 'my-plugin' ),
] );

// Or capture the markup as a string.
$html = Template::get_template_content( 'shortcode/apply-coupon-form.php', $args );
```

`get_template()` guards against a caller passing an `action_args` key (it is reserved and stripped with a `_doing_it_wrong()` notice), and uses `extract( $args, EXTR_SKIP )` so template variables can never clobber globals.

### `get_template_part()` resolution

`get_template_part( $slug, $name )` looks for, in order:

1. `yourtheme/{slug}-{name}.php`
2. `yourtheme/storeengine/{slug}-{name}.php`
3. `storeengine/templates/{slug}-{name}.php`
4. then, if none found, `yourtheme/{slug}.php` / `yourtheme/storeengine/{slug}.php`

The resolved path passes through the `storeengine/get_template_part` filter before it is loaded with `load_template()`.

## Hooks and filters

### Action hooks

`get_template()` fires two actions around the `include`, both receiving `$template_name`, `$template_path`, `$located`, `$args`:

```php
add_action( 'storeengine/before_template_part', function ( $name, $path, $located, $args ) {
	if ( 'checkout/form.php' === $name ) {
		// Runs immediately before the checkout form is included.
	}
}, 10, 4 );

add_action( 'storeengine/after_template_part', function ( $name, $path, $located, $args ) {
	// Runs immediately after the template is included.
}, 10, 4 );
```

### Filters

| Filter | Signature | Purpose |
| --- | --- | --- |
| `storeengine/template_path` | `( $path )` | The theme sub-directory (default `storeengine/`). |
| `storeengine/plugin_path` | `( $path )` | The plugin root path used as the default template dir. |
| `storeengine/locate_template` | `( $template, $template_name, $template_path )` | Final say on the resolved path. |
| `storeengine/get_template` | `( $template, $template_name, $args, $template_path, $default_path )` | Swap the file `get_template()` includes (validated to exist). |
| `storeengine/get_template_part` | `( $template, $slug, $name )` | Swap the file `get_template_part()` loads. |
| `storeengine/template/get_content` | `( $rendered, $template_name, $args, $template_path, $default_path )` | Filter the buffered string from `get_template_content()`. |

Point a template at a file inside your own plugin using `storeengine/get_template`:

```php
add_filter( 'storeengine/get_template', function ( $template, $template_name ) {
	if ( 'checkout/form.php' === $template_name ) {
		$custom = plugin_dir_path( __FILE__ ) . 'templates/checkout-form.php';
		if ( file_exists( $custom ) ) {
			return $custom;
		}
	}
	return $template;
}, 10, 2 );
```

## Debug mode

Define the constant `STOREENGINE_TEMPLATE_DEBUG_MODE` as `true` to **bypass theme overrides** and always load the plugin defaults. This is useful when diagnosing whether a rendering bug comes from a stale theme override or the plugin itself.

```php
// wp-config.php
define( 'STOREENGINE_TEMPLATE_DEBUG_MODE', true );
```

## The `templates/` directory map

The bundled defaults are grouped by area:

| Directory | Contents |
| --- | --- |
| `archive/` | Product archive: pagination, "no products", loop wrappers. |
| `loop/` | Product loop parts (card, price, add-to-cart button). |
| `single-product/` | Single product page parts (gallery, summary, tabs, reviews). |
| `cart/` | Cart page tables and totals. |
| `checkout/` | Checkout form and its fragments. |
| `frontend-dashboard/` | Customer account/dashboard endpoints. |
| `email/` | Transactional email templates and partials. |
| `global/` | Shared wrappers, quantity input, breadcrumbs. |
| `notice/` | Success / error / info notices. |
| `shortcode/` | Templates rendered by the [shortcodes](/reference/shortcodes). |
| `membership/` | Membership addon views. |
| `multi-vendor/` | Multi-vendor storefront and vendor dashboard. |
| `affiliate/` | Affiliate dashboard and registration. |
| `block-templates/` | Full-site-editing block template HTML. |
| `page-content/` | Default content for auto-created pages. |
| `catalog-mode/` | Catalog-mode (browse-only) overrides. |
| `integrations/` | Templates for third-party integrations. |

## See also

- [Shortcodes](/reference/shortcodes) — the shortcodes that render `templates/shortcode/*`.
- [Blocks](/reference/blocks) — surfacing shortcode-backed templates as editor blocks.
- [Actions](/reference/hooks/actions) and [Filters](/reference/hooks/filters) — the full hook reference.
