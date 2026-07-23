---
title: "Shortcode Reference"
description: "Every StoreEngine shortcode: the full tag list, purpose, and attribute tables for products, add-to-cart, login, checkout, order details, coupons, and more."
sidebar_label: "Shortcodes"
keywords: [storeengine, shortcodes, storeengine_products, storeengine_add_to_cart, storeengine_checkout_form, storeengine_login_form, storeengine_dashboard]
---

StoreEngine ships a full set of storefront shortcodes covering product listings, single-product parts, cart, checkout, order confirmation, account/login, and the customer dashboard. They are registered on load by `StoreEngine\Shortcode::init()` → `dispatch_shortcode()`, with one class per tag under `includes/shortcode/`.

Most shortcodes are attribute-less region markers that render a `templates/shortcode/*` template; a handful (products, add-to-cart, login) take attributes documented below. Every shortcode is also available as an editor block — see [Blocks](/reference/blocks).

## All shortcodes

| Tag | Purpose |
| --- | --- |
| `storeengine_products` | Product grid, filterable by ids, category, tag, price type. |
| `storeengine_products_sidebar` | Sidebar filter widget for the products archive. |
| `storeengine_products_archive` | The full products archive layout. |
| `storeengine_archive_header_filter` | Sort/filter header bar for the archive. |
| `storeengine_single_product` | Complete single-product layout. |
| `storeengine_single_product_gallery` | Product image gallery only. |
| `storeengine_single_product_summary` | Product summary (title, price, add-to-cart). |
| `storeengine_single_product_description` | Long product description. |
| `storeengine_single_product_comments` | Product comments block. |
| `storeengine_single_product_reviews` | Product reviews block. |
| `storeengine_single_product_cart_notice` | "Added to cart" notice on the product page. |
| `storeengine_product_description` | Standalone product description by id. |
| `storeengine_add_to_cart` | Add-to-cart / direct-checkout button for a product. |
| `storeengine_mini_cart` | Header mini-cart widget. |
| `storeengine_cart_list_table` | Cart line-items table. |
| `storeengine_cart_sub_total_table` | Cart totals (subtotal, shipping, total). |
| `storeengine_apply_coupon_form` | Coupon-code input + apply button. |
| `storeengine_proceed_to_checkout` | "Proceed to checkout" button. |
| `storeengine_continue_shopping` | "Continue shopping" link. |
| `storeengine_checkout_form` | The full checkout form. |
| `storeengine_order_summary` | Order summary panel on checkout. |
| `storeengine_order_details` | Order details, read from the `order_hash` query var. |
| `storeengine_order_downloads` | Downloadable files for an order. |
| `storeengine_order_billing_address` | Order billing address block. |
| `storeengine_order_shipping_address` | Order shipping address block. |
| `storeengine_thankyou_order_info` | Order-received (thank-you) summary. |
| `storeengine_thankyou_payment_instructions` | Gateway payment instructions on the thank-you page. |
| `storeengine_login_form` | Front-end login form. |
| `storeengine_dashboard` | Customer account dashboard. |

## `[storeengine_products]`

Renders a paginated product grid. Query attributes accept comma-separated term/post IDs.

| Attribute | Default | Description |
| --- | --- | --- |
| `ids` | `''` | Comma-separated product IDs to include (`post__in`). |
| `exclude_ids` | `''` | Comma-separated product IDs to exclude. |
| `category` | `''` | Category term IDs to include. |
| `cat_not_in` | `''` | Category term IDs to exclude. |
| `tag` | `''` | Tag term IDs to include. |
| `tag_not_in` | `''` | Tag term IDs to exclude. |
| `course_level` | `''` | Filter by course level (integration-specific). |
| `price_type` | `''` | Filter by price type. |
| `orderby` | *setting* | `date`, `title`, `modified` (falls back to `ID`). |
| `order` | `DESC` | `ASC` or `DESC`. |
| `count` | `12` | Products per page (defaults to the archive setting when set). |
| `column_per_row` | `3` | Grid columns on desktop. |
| `has_pagination` | `false` | Whether to render pagination. |

```text
[storeengine_products category="12,15" count="8" column_per_row="4" orderby="title"]
```

The query is filterable via `storeengine_products_shortcode_args`.

## `[storeengine_add_to_cart]`

Renders an add-to-cart or direct-checkout button for a specific product. `product_id` is required; an invalid `variation_id` returns an error string.

| Attribute | Default | Description |
| --- | --- | --- |
| `product_id` | `null` | **Required.** The product to add. |
| `price_id` | `null` | Specific price/plan ID. |
| `variation_id` | `0` | Variation ID (validated against the product). |
| `label` | `''` | Custom button label. |
| `direct_checkout` | `'true'` | If truthy, skip cart and go straight to checkout. |
| `quantity` | `1` | Initial quantity. |
| `show_quantity` | `'false'` | Show a quantity input. |
| `disabled` | `'false'` | Render the button disabled. |
| `price_display` | `'radio'` | How multiple prices are shown (`radio`, etc.). |
| `button_display` | `'yes'` | Whether to show the button. |
| `icon` | `''` | Icon class to render on the button. |
| `icon_position` | `'left'` | `left` or `right`. |
| `dummy` | `false` | Render a non-functional preview (editor use). |

```text
[storeengine_add_to_cart product_id="42" price_id="7" show_quantity="true" label="Buy now"]
```

## `[storeengine_login_form]`

Front-end login form. All labels are translatable and overridable per instance. It routes registration to StoreEngine's in-dashboard register endpoint rather than `wp-login.php`.

| Attribute | Default | Description |
| --- | --- | --- |
| `form_title` | `Log In into your Account` | Heading above the form. |
| `username_label` | `Username or Email Address` | Username field label. |
| `username_placeholder` | `Username or Email Address` | Username field placeholder. |
| `password_label` | `Password` | Password field label. |
| `password_placeholder` | `Password` | Password field placeholder. |
| `remember_label` | `Remember me` | Remember-me checkbox label. |
| `login_button_label` | `Log in Now` | Submit button label. |
| `reset_password_label` | `Reset password` | Lost-password link label. |
| `show_logged_in_message` | `true` | Show a message instead of the form when already logged in. |
| `register_url` | *register endpoint* | Where the "register" link points. |
| `login_redirect_url` | *dashboard page* | Redirect after successful login. |
| `logout_redirect_url` | *current page* | Redirect after logout. |

## `[storeengine_order_details]`

Renders the details of an order. It reads the order key from the `order_hash` query string; when there is no matching order (direct visit, preview, or editor render) it falls back to sample content.

| Attribute | Default | Description |
| --- | --- | --- |
| `dummy` | `false` | Force sample/preview content regardless of `order_hash`. |

```text
[storeengine_order_details]
```

`[storeengine_order_downloads]` accepts the same single `dummy` attribute.

## `[storeengine_apply_coupon_form]`

Renders the coupon input and apply button.

| Attribute | Default | Description |
| --- | --- | --- |
| `placeholder` | `Coupon Code` | Input placeholder. |
| `button_label` | `Apply` | Apply button label. |

## `[storeengine_single_product_summary]`

Renders the summary block (title, price, add-to-cart) for a product.

| Attribute | Default | Description |
| --- | --- | --- |
| `product_id` | `0` | Product to render. Falls back to the current post ID (`get_the_ID()`). |

## Attribute-less shortcodes

The remaining tags — `storeengine_checkout_form`, `storeengine_order_summary`, `storeengine_cart_list_table`, `storeengine_cart_sub_total_table`, `storeengine_mini_cart`, `storeengine_proceed_to_checkout`, `storeengine_continue_shopping`, `storeengine_thankyou_order_info`, `storeengine_thankyou_payment_instructions`, `storeengine_order_billing_address`, `storeengine_order_shipping_address`, `storeengine_dashboard`, and the single-product part tags — take no attributes. They render their corresponding `templates/shortcode/*` file using the current cart/order/product context. Override their markup by [copying the template into your theme](/reference/templates#worked-example-overriding-the-checkout-form).

## Using shortcodes as blocks

Every shortcode above is registered as an editor block descriptor and can be inserted through the generic `storeengine/shortcode` block with full editor controls — no raw `[shortcode]` typing required. See [Blocks](/reference/blocks) for the bridge and for registering your own shortcode as a block.

## See also

- [Templates](/reference/templates) — override what a shortcode renders.
- [Blocks](/reference/blocks) — the shortcode → block bridge.
