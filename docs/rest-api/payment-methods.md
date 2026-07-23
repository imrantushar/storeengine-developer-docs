---
title: "Payment Methods API"
description: "StoreEngine REST endpoints for saved payment methods — add a tokenized card, create a gateway SetupIntent without a cart, delete a saved token, and set the default payment method."
sidebar_label: "Payment Methods"
keywords: [storeengine rest api, payment methods api, saved cards, setup intent, tokenization, stripe setup intent, default payment method]
---

The Payment Methods controller (`api/payment-methods.php`, base `payment-methods`) backs the storefront "Add a payment method" form and the dashboard's saved-card list. It replaces the legacy admin-ajax saved-payment-method handler.

This controller is for **adding and creating setup intents**. To *list* saved tokens, use [`GET /me/payment-methods`](/rest-api/me#saved-payment-methods).

## Authentication

Logged-in only (cookie + `X-WP-Nonce`, or Application Passwords). Logged-out requests return `storeengine_payment_methods_login_required` (401). Token operations additionally check that the token belongs to the current user.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--post">POST</span> | `/payment-methods` | Add a saved payment method |
| <span class="api-method api-method--post">POST</span> | `/payment-methods/setup-intent` | Create a SetupIntent (no cart/order) |
| <span class="api-method api-method--delete">DELETE</span> | `/payment-methods/<token_id>` | Delete a saved token |
| <span class="api-method api-method--post">POST</span> | `/payment-methods/<token_id>/default` | Mark a token as default |

All paths are relative to `/wp-json/storeengine/v1`.

## POST /payment-methods

`POST /wp-json/storeengine/v1/payment-methods`

Adds a payment method through the gateway's own `add_payment_method()` flow.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `payment_method` | string | yes | Gateway id (e.g. `stripe`). |
| `payment_payload` | object | no | Gateway-specific data (e.g. a confirmed SetupIntent / payment-method id). |
| `fields` | object | no | Additional form fields the gateway's `validate_fields()` expects. |

The gateway must support `add_payment_method` or `tokenization`, otherwise `storeengine_payment_methods_unsupported` (422). The controller pipes `fields` and `payment_payload` into the request superglobals so legacy gateway code paths keep working, then calls `validate_fields()` and `add_payment_method()`. The response is the gateway's result.

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/payment-methods \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: $NONCE" --cookie "$WP_COOKIES" \
  -d '{ "payment_method": "stripe", "payment_payload": { "payment_method_id": "pm_123" } }'
```

## POST /payment-methods/setup-intent

`POST /wp-json/storeengine/v1/payment-methods/setup-intent`

Creates a gateway SetupIntent to save a card **without** a cart or order — the dashboard "Add payment method" form. (The [checkout intent endpoint](/rest-api/checkout#post-checkoutpayment-intentgateway_id) requires a populated cart and draft order; this one bypasses both.)

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `payment_method` | string | yes | Currently only `stripe` is supported. |
| `return_url` | string | no | Where the gateway should return after confirmation. |

Non-Stripe gateways return `storeengine_payment_methods_setup_unsupported` (422); an inactive Stripe addon returns `storeengine_payment_methods_stripe_inactive` (422). Success:

```json
{ "client_secret": "seti_..._secret_...", "intent_id": "seti_123", "mode": "setup" }
```

The typical flow: call this endpoint, confirm the SetupIntent client-side with the gateway SDK, then `POST /payment-methods` with the resulting payment-method id in `payment_payload`.

## DELETE /payment-methods/&lt;token_id&gt;

`DELETE /wp-json/storeengine/v1/payment-methods/<token_id>`

Deletes a saved token owned by the current user. A token that does not exist or belongs to someone else returns `storeengine_payment_methods_invalid_token` (404). Returns `{ deleted: true, token_id }`.

## POST /payment-methods/&lt;token_id&gt;/default

`POST /wp-json/storeengine/v1/payment-methods/<token_id>/default`

Marks a token as the user's default. Same ownership check. Returns `{ default: true, token_id }`.

## Related

- [Me API — saved payment methods](/rest-api/me#saved-payment-methods) — list and default via the dashboard controller.
- [Checkout API](/rest-api/checkout) — pay with a saved or new method.
- [Payments API](/rest-api/payments) — gateway/method metadata.
