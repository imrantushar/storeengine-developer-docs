---
title: "Styling & CSS"
description: "Style the StoreEngine storefront from your theme — CSS custom properties, the frontend stylesheet handle, dynamic :root theming, layout classes, and enqueuing assets alongside StoreEngine."
sidebar_label: "Styling & CSS"
keywords:
  - storeengine css
  - storeengine custom properties
  - storeengine theme styling
  - storeengine frontend style
  - storeengine dynamic css
---

StoreEngine's storefront is themeable almost entirely with CSS. Before overriding template markup, reach for these styling hooks first.

## The frontend stylesheet

StoreEngine enqueues its storefront CSS from `StoreEngine\Assets` on `wp_enqueue_scripts`:

| Handle | What it is |
| --- | --- |
| `storeengine-frontend-style` | Main storefront stylesheet (`assets/build/frontend.css`), versioned by file mtime |
| `storeengine-frontend-icon` | Icon font |
| `storeengine-frontend-scripts` | Storefront JavaScript |

Because your theme's stylesheet loads and cascades over these, you can target StoreEngine's layout classes directly. To guarantee your overrides load **after** StoreEngine's, declare the handle as a dependency:

```php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'mytheme-storeengine',
		get_theme_file_uri( 'assets/storeengine.css' ),
		[ 'storeengine-frontend-style' ], // load after StoreEngine
		wp_get_theme()->get( 'Version' )
	);
}, 20 );
```

## CSS custom properties (the fast path)

StoreEngine injects a `:root { … }` block of custom properties inline after its stylesheet, populated from store settings. **Overriding these variables re-themes the storefront without touching a single template.** The core tokens:

```css
:root {
	--storeengine-primary-color: #008dff;
	--storeengine-secondary-color: #eae8fa;
	--storeengine-text-color: #2c3135;
	--storeengine-subtitle-color: #646c73;
	--storeengine-input-text-color: #434a51;
	--storeengine-placeholder-color: #8e949a;
	--storeengine-border-color: #dedede;
	--storeengine-background-color: #fafafa;
}
```

To align the storefront with your theme's palette, redeclare them at a selector that wins the cascade:

```css
/* yourtheme/assets/storeengine.css */
:root {
	--storeengine-primary-color: #7c3aed; /* your brand accent */
	--storeengine-text-color: #111827;
	--storeengine-border-color: #e5e7eb;
}
```

### Changing tokens in PHP

The injected `:root` block is filterable, so a theme or addon can set token values programmatically (for example, reading from a customizer or theme.json setting):

```php
add_filter( 'storeengine/dynamic_css_root_properties', function ( array $props ) {
	$props['--storeengine-primary-color'] = get_theme_mod( 'accent_color', '#008dff' );
	return $props;
} );
```

## Layout classes

StoreEngine's template wrappers use a small, stable set of class names you can style against. It does **not** add custom `body_class()` or `post_class()` entries, so target these container classes instead:

| Class | Where |
| --- | --- |
| `.storeengine-products` | Product archive / listing wrapper |
| `.storeengine-container` | Centered content container |
| `.storeengine-row` / `.storeengine-col-*` | The storefront grid |
| `.storeengine-single-product` | Single-product wrapper |
| `.storeengine-canvas` | Cart / checkout / dashboard canvas pages |

Example — widen the container to match your theme and tighten the grid gap:

```css
.storeengine-container { max-width: var(--wp--style--global--content-size, 1140px); }
.storeengine-row { gap: 1.5rem; }
```

## Enqueuing scripts & assets alongside StoreEngine

If your theme or child plugin needs to run behavior on storefront pages, hook StoreEngine's asset lifecycle rather than enqueuing blindly on every page:

| Hook | Type | Use |
| --- | --- | --- |
| `storeengine/enqueue_frontend_scripts` | action | Enqueue your own storefront assets when StoreEngine enqueues its own |
| `storeengine/assets/after_frontend_scripts` | action | Run right after StoreEngine registers its frontend scripts |
| `storeengine/frontend_scripts_data` | filter | Add data to the localized script payload |

```php
add_action( 'storeengine/enqueue_frontend_scripts', function () {
	wp_enqueue_script(
		'mytheme-shop',
		get_theme_file_uri( 'assets/shop.js' ),
		[ 'storeengine-frontend-scripts' ],
		wp_get_theme()->get( 'Version' ),
		true
	);
} );
```

## Dark mode & FSE styling

For block themes, StoreEngine's storefront lives inside your theme's block templates (see **[Theme Compatibility](/theme-integration/making-a-theme-compatible)**), so `theme.json` color and spacing presets cascade naturally. Combine `theme.json` presets with the `--storeengine-*` custom properties above for a fully token-driven storefront.

## Related

- **[Theme Compatibility](/theme-integration/making-a-theme-compatible)** — templates, wrappers, headers/footers, FSE.
- **[Templates](/reference/templates)** — overriding storefront markup.
- **[Hooks: Filters](/reference/hooks/filters)** — the full filter reference.
