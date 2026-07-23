---
title: "Extending the REST API"
description: "Add custom StoreEngine REST endpoints — build a controller on AbstractRestApiController, extend native CPT routes, use the schema and permission filters, and support batch operations."
sidebar_label: "Extending the API"
keywords: [storeengine rest api, custom rest endpoint, abstractrestapicontroller, rest filters, batch items, permission callback, extend rest api]
---

There are two ways to add to the StoreEngine REST API: register a **new controller** in the `storeengine/v1` namespace, or **extend the existing routes** through filters. This page covers both, plus permission best practices and batch support.

## Pattern 1: a custom controller

Extend `AbstractRestApiController`, set a `$rest_base`, and register your routes on `rest_api_init`. Extending the base class gives you batch support, pagination helpers, meta include/exclude, and `_links` for free.

```php
<?php
namespace MyPlugin\Api;

use StoreEngine\API\AbstractRestApiController;
use StoreEngine\Utils\Helper;
use WP_REST_Request;
use WP_REST_Server;

class Wishlist extends AbstractRestApiController {

    protected $rest_base = 'wishlist';

    public static function init(): void {
        $self = new self();
        add_action( 'rest_api_init', [ $self, 'register_routes' ] );
    }

    public function register_routes(): void {
        register_rest_route( $this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_items' ],
                'permission_callback' => [ $this, 'permissions_check' ],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'create_item' ],
                'permission_callback' => [ $this, 'permissions_check' ],
                'args'                => [
                    'product_id' => [ 'type' => 'integer', 'required' => true, 'minimum' => 1 ],
                ],
            ],
        ] );
    }

    public function permissions_check() {
        // Admin gate — returns a filterable WP_Error when the user lacks the cap.
        return Helper::check_rest_user_cap( 'manage_options' );
    }

    public function get_items( WP_REST_Request $request ) {
        return rest_ensure_response( [ /* … */ ] );
    }

    public function create_item( WP_REST_Request $request ) {
        $product_id = (int) $request->get_param( 'product_id' );
        // …persist…
        return rest_ensure_response( [ 'added' => true, 'product_id' => $product_id ] );
    }
}
```

Because `$this->namespace` is inherited (`storeengine/v1`), your route is served at `/wp-json/storeengine/v1/wishlist`. Call `Wishlist::init()` from your addon's boot code. (If you are contributing to core, add the controller to the list in `StoreEngine\API::init()` in `includes/api.php`.)

### Choosing a permission callback

Pick the gate that matches the audience:

| Audience | Callback |
| --- | --- |
| Admins | `Helper::check_rest_user_cap( 'manage_options' )` |
| A specific capability | `Helper::check_rest_user_cap( 'edit_storeengine_products' )` |
| Any logged-in customer | check `is_user_logged_in()`, else return a `401` `WP_Error` |
| Public / guest | `'__return_true'` |

Using `Helper::check_rest_user_cap()` (rather than a raw `current_user_can()`) means your route participates in the `storeengine/rest_user_capability` filter and returns the standard `storeengine_rest_forbidden_context` error shape. Always enforce per-resource ownership inside the handler for customer-scoped data, and prefer returning `404` over `403` for not-owned resources to avoid leaking existence.

### Returning errors

Return a `WP_Error` with a `status` in its data so clients get the right HTTP code:

```php
return new WP_Error(
    'myplugin_wishlist_not_found',
    __( 'Wishlist item not found.', 'my-plugin' ),
    [ 'status' => 404 ]
);
```

## Pattern 2: extend native CPT routes {#extending-native-cpt-routes}

[Products](/rest-api/products) and [coupons](/rest-api/coupons) are native custom post types served by core controllers. Do not re-register them — hook their filters instead.

```php
// Add a computed field to every product response.
add_filter( 'rest_prepare_storeengine_product', function ( $response, $post, $request ) {
    $data = $response->get_data();
    $data['in_stock'] = get_post_meta( $post->ID, '_stock_status', true ) === 'instock';
    $response->set_data( $data );
    return $response;
}, 10, 3 );

// React after a product is created or updated.
add_action( 'rest_insert_storeengine_product', function ( $post, $request, $creating ) {
    // persist your custom fields from $request…
}, 10, 3 );

// Validate a coupon payload before it is saved.
add_filter( 'rest_pre_insert_storeengine_coupon', function ( $prepared, $request ) {
    // return a WP_Error to reject, or the (possibly modified) $prepared post.
    return $prepared;
}, 10, 2 );
```

## Filter-based extension points

Beyond per-object CRUD filters, StoreEngine exposes hooks to reshape shared behavior:

| Filter | What it does |
| --- | --- |
| `storeengine/rest_{object_type}_schema` | Add or change properties on a controller's item schema. |
| `storeengine/rest_user_capability` | Override the permission decision returned by `check_rest_user_cap()`. |
| `storeengine/rest_batch_items_limit` | Change the batch item cap (default 100), per rest base. |
| `storeengine/cart/snapshot` | Enrich the [cart snapshot](/rest-api/cart#the-cart-snapshot). |
| `storeengine/checkout/state_snapshot` | Enrich the [checkout state](/rest-api/checkout#get-checkoutstate). |
| `storeengine/checkout/publishable_key_auth` | Install headless publishable/embed-key authentication. |
| `storeengine/rest/me/menu_items` | Add items to the [customer dashboard menu](/rest-api/me#menu). |

Extend a schema like so:

```php
add_filter( 'storeengine/rest_shop_order_schema', function ( $properties ) {
    $properties['gift_message'] = [
        'description' => __( 'Optional gift message.', 'my-plugin' ),
        'type'        => 'string',
        'context'     => [ 'view', 'edit' ],
    ];
    return $properties;
} );
```

## Headless auth for your own routes

To make a cross-origin, publishable-key-authenticated route like cart/checkout, implement the `storeengine/checkout/publishable_key_auth` filter to validate the incoming key (the Embeddable/Instant Checkout addon does exactly this). The filter receives `null` and the request, and should return `true`, a `WP_Error`, or leave `null` to signal "no handler." See [Authentication](/rest-api/authentication#headless-publishable--embed-key).

## Batch support

Any collection controller that extends `AbstractRestApiController` can offer bulk operations by registering a `/batch` route pointing at the inherited `batch_items()` handler:

```php
register_rest_route( $this->namespace, '/' . $this->rest_base . '/batch', [
    [
        'methods'             => WP_REST_Server::EDITABLE,
        'callback'            => [ $this, 'batch_items' ],
        'permission_callback' => [ $this, 'permissions_check' ],
        'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
    ],
    'schema' => [ $this, 'get_public_batch_schema' ],
] );
```

`batch_items()` fans out `create`/`update`/`delete` arrays to your controller's own `create_item()`, `update_item()`, and `delete_item()` methods (each with its own permission check), enforces the 100-item limit, and returns a per-item result or error. See [Taxes batch](/rest-api/taxes#putpatch-taxesbatch) for a live example.

## Related

- [Overview](/rest-api/overview) — the two registration mechanisms.
- [Authentication](/rest-api/authentication) — permission tiers and error shapes.
- [Addon architecture](/addons/architecture) — where to boot your controller.
- [Actions](/reference/hooks/actions) · [Filters](/reference/hooks/filters)
