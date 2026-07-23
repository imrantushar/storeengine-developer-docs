---
title: "Integrating StoreEngine Into a Theme"
description: "Make a WordPress theme StoreEngine-compatible — template loading, theme overrides, product/archive headers and footers, content wrappers, the shop page, and the canvas template."
sidebar_label: "Theme Compatibility"
keywords:
  - storeengine theme integration
  - storeengine theme compatibility
  - wordpress ecommerce theme
  - storeengine templates
  - storeengine canvas template
---

This guide is for **theme developers** who want a WordPress theme to render StoreEngine's storefront — product archives, single products, cart, checkout, and the account dashboard — correctly and on-brand.

:::info[No `add_theme_support` needed]
Unlike some eCommerce plugins, StoreEngine has **no `add_theme_support( 'storeengine' )` opt-in**. There is no feature flag a theme declares to "take over" markup. Compatibility comes entirely from the **template system** (which your theme can override file-by-file) and, for classic themes, from providing product-scoped header/footer parts. If you were looking for a theme-support switch — there isn't one, and you don't need it.
:::

## How StoreEngine picks a template

StoreEngine splits its frontend into two kinds of pages.

### 1. Product post-type & taxonomy pages

Product archives and single products are driven by the `template_include` filter through `StoreEngine\Classes\TemplateLoader`. It maps the current query to a default template file:

| Condition | Default template |
| --- | --- |
| `is_singular( 'storeengine_product' )` | `single-product.php` |
| `is_post_type_archive( 'storeengine_product' )` | `archive-product.php` |
| `is_tax( 'storeengine_product_category' )` | `taxonomy-product-category.php` |
| `is_tax( 'storeengine_product_tag' )` | `taxonomy-product-tag.php` |

For each, the loader runs WordPress' `locate_template()` **first** — so a matching file in your theme wins — and only falls back to the plugin's `templates/` directory if the theme has none. The search list is filterable via `storeengine\frontend\template\loader_files`.

### 2. Shop, cart, checkout & dashboard pages

These are **ordinary WordPress pages** that hold StoreEngine shortcodes/blocks. On install, StoreEngine seeds them (filter `storeengine/store_page_contents`): a **Shop** page (slug `shop`), plus Cart, Checkout, Thank-You, and Dashboard pages prefilled with block markup such as:

```html
<!-- wp:storeengine/shortcode {"shortcode":"storeengine_checkout_form"} /-->
```

These pages render through the **canvas page template** (`storeengine-canvas.php`), a minimal full-width shell registered into the page-template dropdown. Helpers you can rely on:

```php
use StoreEngine\Utils\Helper;

Helper::is_shop();        // true on the product archive OR the configured Shop page
Helper::get_shop_url();   // filterable via 'storeengine/get_shop_url'
```

## Overriding templates from your theme

Every storefront template can be overridden by copying it into a `storeengine/` folder inside your theme:

```
yourtheme/
└── storeengine/
    ├── archive-product.php
    ├── single-product.php
    ├── cart/
    │   └── cart.php
    └── checkout/
        └── form.php
```

The resolver (`StoreEngine\Utils\Template`) looks for `yourtheme/storeengine/{template}.php` before the plugin default. The `storeengine/` prefix itself is filterable:

```php
// Change the theme sub-folder StoreEngine looks in (default: 'storeengine/').
add_filter( 'storeengine/template_path', fn() => 'shop/' );
```

For the full override mechanics, the template function reference, and the complete `templates/` directory map, see **[Templates](/reference/templates)**.

:::tip[Only override what you need]
Copy a template into your theme **only** when you must change its markup. Every file you copy is a file you now maintain against future StoreEngine updates. For most styling, CSS is enough — see **[Styling & CSS](/theme-integration/styling)**.
:::

## Headers, footers & content wrappers

StoreEngine's product templates call your theme's header and footer through wrapper functions rather than assuming a specific markup structure:

```php
storeengine_get_header();  // classic: get_header('product') → get_header()
storeengine_get_footer();  // classic: get_footer('product') → get_footer()
```

So a **classic theme** integrates by (optionally) providing product-scoped parts — `header-product.php` / `footer-product.php` — and StoreEngine falls back to your standard `header.php` / `footer.php` if they're absent. There is nothing to hook; just make sure your header/footer output a sane container that the storefront can live inside.

### Wrapper & section action hooks

The product templates fire these actions so you can inject markup without copying the whole template. Note that StoreEngine does **not** register a default content-`<div>` on the `before/after_main_content` hooks — the wrapper markup (`storeengine-products`, `storeengine-container`, `storeengine-row`) is baked into the template files — so these hooks are yours to use:

| Hook | Fires |
| --- | --- |
| `storeengine/templates/before_main_content` | Before the main content block (arg: template name) |
| `storeengine/templates/after_main_content` | After the main content block (StoreEngine attaches upsell rendering here) |
| `storeengine/templates/archive_product_header` | Top of the product archive |
| `storeengine/templates/archive_product_content` | Archive product loop area |
| `storeengine/templates/single_product_content` | Single-product content area |
| `storeengine/templates/after_product_loop` | After the archive loop (pagination, etc.) |

Example — add a full-width banner above every product archive:

```php
add_action( 'storeengine/templates/archive_product_header', function () {
	echo '<div class="my-theme-shop-banner">Free shipping over $50</div>';
} );
```

### Sidebar

The archive sidebar is rendered on `storeengine/templates/archive_product_sidebar`, and its position is a **store setting**, not a theme decision:

```php
Helper::get_settings( 'product_archive_sidebar_position', 'right' ); // 'left' | 'right' | 'none'
```

Single-product sidebar widgets render on `storeengine/templates/single_product_sidebar_widgets` (price, add-to-cart form, categories, tags).

## Block (FSE) themes

For block themes, StoreEngine ships **block templates** in `templates/block-templates/*.html` and injects them into the Site Editor via the `get_block_templates` / `pre_get_block_file_template` hooks (it does not use WP 6.7's `register_block_template()`). Shipped templates include:

```
archive-storeengine_product.html
single-storeengine_product.html
taxonomy-storeengine_product_category.html
taxonomy-storeengine_product_tag.html
cart-storeengine.html
checkout-storeengine.html
thankyou-storeengine.html
store-dashboard-storeengine.html
```

Each is plain block markup composing core blocks with StoreEngine shortcode blocks, e.g.:

```html
<!-- wp:template-part {"slug":"header"} /-->
<!-- wp:shortcode -->[storeengine_products_archive]<!-- /wp:shortcode -->
<!-- wp:template-part {"slug":"footer"} /-->
```

**A block theme overrides these the standard FSE way** — add a template of the same slug under your theme's `templates/` directory and it takes precedence. StoreEngine detects block themes via `Helper::is_fse_theme()` and, in FSE mode, renders the header/footer through `block_header_area()` / `block_footer_area()` (gated by `storeengine/templates/is_allow_block_theme_header` and `..._footer`).

## Integration checklist

- [ ] Product archive and single product render inside your theme's header/footer without layout breakage.
- [ ] (Classic) Optionally add `header-product.php` / `footer-product.php` for a storefront-specific chrome.
- [ ] Cart, Checkout, and Dashboard pages (canvas template) display full-width and unobstructed.
- [ ] Your theme's content width accommodates the `storeengine-container` / `storeengine-row` grid.
- [ ] Brand colors applied via CSS custom properties — see **[Styling & CSS](/theme-integration/styling)**.
- [ ] (FSE) Storefront block templates resolve, and any theme overrides load from `yourtheme/templates/`.

## Related

- **[Styling & CSS](/theme-integration/styling)** — CSS custom properties, enqueue handles, and dynamic theming.
- **[Templates](/reference/templates)** — the full template override reference.
- **[Shortcodes](/reference/shortcodes)** & **[Blocks](/reference/blocks)** — what the storefront pages are built from.
- **[Hooks: Actions](/reference/hooks/actions)** — every template action hook.
