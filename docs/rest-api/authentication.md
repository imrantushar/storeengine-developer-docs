---
title: "Authentication & Permissions"
description: "How to authenticate against the StoreEngine REST API — cookie plus nonce, Application Passwords, capability gates, the logged-in customer tier, public routes, and the headless publishable/embed-key flow."
sidebar_label: "Authentication"
keywords: [storeengine rest api, wordpress authentication, application passwords, x-wp-nonce, publishable key, embed key, rest capability, manage_options]
---

StoreEngine does not invent its own token system. Authentication rides on standard WordPress mechanisms, and each controller then applies a per-route permission check. This page covers every tier — from fully public storefront routes to `manage_options`-gated admin routes — and the headless publishable-key flow used by embedded checkout.

Pick your mechanism by client type:

| Client | Mechanism |
| --- | --- |
| Same-origin JS on the storefront/admin | Cookie + `X-WP-Nonce` |
| External server / script | Application Passwords (HTTP Basic) |
| Cross-origin headless storefront (cart/checkout) | Publishable / embed key header |
| Storefront login form | `POST /auth/login` sets the WP auth cookie |

## Cookie + nonce (same-origin)

When your code runs on a page WordPress rendered (a storefront template, a block, or a wp-admin screen), the logged-in auth cookie is already present. To satisfy the REST API's CSRF check, send a nonce in the `X-WP-Nonce` header. WordPress exposes one to enqueued scripts via `wpApiSettings.nonce` (or your own `wp_localize_script` payload).

```js
const res = await fetch('/wp-json/storeengine/v1/me', {
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.wpApiSettings.nonce,
  },
  credentials: 'same-origin',
});
const me = await res.json();
```

`credentials: 'same-origin'` ensures the cookie is sent. Without a valid nonce, an otherwise authenticated request is treated as logged-out.

## Application Passwords (external clients)

For server-to-server integrations, use WordPress [Application Passwords](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/) over HTTPS with HTTP Basic auth. A user generates an application password under **Users → Profile → Application Passwords**, and you send it as the Basic-auth credential:

```bash
curl https://your-store.example/wp-json/storeengine/v1/order \
  -u "admin:xxxx xxxx xxxx xxxx xxxx xxxx"
```

The user's capabilities determine what the credential can do — an application password belonging to a shop manager can hit `manage_options`-gated routes; one belonging to a customer can only reach the logged-in `me` tier. Application Passwords require HTTPS; WordPress refuses to issue them on non-SSL sites.

## Permission tiers

### Admin routes — capability gates

Admin controllers (orders, customers, taxes, shipping, settings, subscriptions, analytics) call `Helper::check_rest_user_cap( 'manage_options' )`. If the current user is not logged in or lacks the capability, the call returns a `WP_Error`:

- **Code:** `storeengine_rest_forbidden_context`
- **Status:** `401` when logged out, `403` when logged in but under-privileged (via `rest_authorization_required_code()`).

The required capability is filterable per request through `storeengine/rest_user_capability`, so you can widen or narrow admin access without editing controllers.

### Product & coupon routes — CPT capabilities

Because [products](/rest-api/products) and [coupons](/rest-api/coupons) are native custom post types, they use WordPress's capability map rather than `manage_options`:

| Action | Product capability | Coupon capability |
| --- | --- | --- |
| Edit one | `edit_storeengine_product` | `edit_storeengine_coupon` |
| Read one | `read_storeengine_product` | `read_storeengine_coupon` |
| Delete one | `delete_storeengine_product` | `delete_storeengine_coupon` |
| Edit collection | `edit_storeengine_products` | `edit_storeengine_coupons` |
| Publish | `publish_storeengine_products` | `publish_storeengine_coupons` |

The auxiliary product stock and inventory routes (`/products/<id>/stock-adjust`, `/inventory/*`) gate on the broad `edit_storeengine_products` capability.

### Logged-in customer tier ("me")

The `me`, `me/subscriptions`, and `payment-methods` controllers require only that a user is signed in — they call `is_user_logged_in()` and resolve everything from `get_current_user_id()`. No special capability is needed. When logged out, they return:

- **Code:** `storeengine_rest_not_logged_in`
- **Status:** `401`

Per-resource ownership is enforced inside each handler (a customer can only see their own orders, downloads, and tokens), and a not-owned resource returns `404` rather than `403` to avoid leaking existence.

### Public routes

Cart, checkout, mini-cart, the `auth/*` endpoints, and `GET /logs` allow guests (`permission_callback => '__return_true'`). Guest carts and guest checkout are first-class; the cart and checkout controllers additionally accept a publishable key for cross-origin use (below).

## Headless publishable / embed key

Same-origin cookie + nonce cannot work across origins — you cannot read a WordPress nonce or send its cookie from another domain. For cross-origin headless storefronts, the [Cart](/rest-api/cart) and [Checkout](/rest-api/checkout) controllers accept a publishable/embed key sent as a header (or a `pk` query param):

| Header | Used by |
| --- | --- |
| `X-StoreEngine-Embed-Key` | Checkout (preferred) |
| `X-StoreEngine-Pk` | Cart, and legacy checkout |
| `pk` (query param) | Either, as a fallback |

When a key is present, the controller delegates the permission decision to the `storeengine/checkout/publishable_key_auth` filter, which the Embeddable / Instant Checkout addon installs. The filter returns `true` (allow), a `WP_Error` (deny), or `null` (no handler). If it returns `null` — meaning the addon is not active — the request is rejected:

- **Cart:** `storeengine_cart_pk_unsupported` (401)
- **Checkout:** `storeengine_checkout_pk_unsupported` (401)

```bash
curl https://your-store.example/wp-json/storeengine/v1/cart \
  -H "X-StoreEngine-Pk: pk_live_xxxxxxxxxxxxx"
```

The checkout controller also emits CORS headers (`Access-Control-Allow-Origin`, and the allowed `X-StoreEngine-Embed-Key` / `X-StoreEngine-Pk` / `X-WP-Nonce` headers) — but only when the addon's origin allow-list matched the request. The same-origin path (no key, nonce instead) keeps working unchanged, and guests are always allowed on the public flow.

## Storefront login

`POST /auth/login` calls `wp_signon()` and sets the standard WordPress auth cookie, so a same-origin headless frontend can obtain a normal cookie session without going through `wp-login.php`. `POST /auth/register` is gated by WordPress's "Anyone can register" setting. See [Storefront Auth](/rest-api/storefront-auth) for the full flow.

## Error shape {#error-shape}

Every failed request returns a serialized `WP_Error`. The HTTP status comes from the error's `data.status`:

```json
{
  "code": "storeengine_rest_forbidden_context",
  "message": "Sorry, insufficient permission.",
  "data": {
    "status": 403
  }
}
```

Validation failures typically use `422`, missing resources `404`, auth failures `401`/`403`, and payload-too-large batches `413`. Always branch on `code` (stable) rather than parsing `message` (translatable).
