---
title: "Payments API"
description: "StoreEngine REST endpoints for payment gateway and method metadata — read the methods available for a context, list all gateways as admin, and fetch payment details for an order."
sidebar_label: "Payments"
keywords: [storeengine rest api, payments api, payment gateways, payment methods, gateway metadata, order payment]
---

The Payment controller (`api/payment.php`, base `payment`) exposes payment gateway and method metadata. It is not where you charge a card — that happens through the [Checkout API](/rest-api/checkout). Creating a payment directly here is deprecated; the endpoint exists to *read* payment/gateway data.

## Authentication

Mixed, per route:

- `GET /payment` and `POST /payment` — order-scoped: the request must carry a valid `order_id` resolving to a real order.
- `GET /payment/all` — admin (`manage_options`).
- `GET /payment/<id>` — admin (`manage_options`).

## Routes

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| <span class="api-method api-method--get">GET</span> | `/payment` | Payment/gateway data for a context | Order-scoped |
| <span class="api-method api-method--post">POST</span> | `/payment` | Deprecated — returns an error | Order-scoped |
| <span class="api-method api-method--get">GET</span> | `/payment/all` | All gateways | `manage_options` |
| <span class="api-method api-method--get">GET</span> | `/payment/<id>` | Payment detail for an order | `manage_options` |

All paths are relative to `/wp-json/storeengine/v1`.

## GET /payment

`GET /wp-json/storeengine/v1/payment?order_id=1187`

Returns the payment data for the given order context. The permission check requires the `order_id` to resolve to an existing order, so this route is usable in the payment flow without full admin rights. The handler resolves the id from any of `id`, `order`, `order_id`, `payment`, or `payment_id`; a request with none returns `invalid-request` (400).

## POST /payment

`POST /wp-json/storeengine/v1/payment`

**Deprecated.** Returns `endpoint_is_deprecated` (400) directing you to the checkout workflow. Use [`POST /checkout/place`](/rest-api/checkout#post-checkoutplace) or [`POST /checkout/pay-order`](/rest-api/checkout#post-checkoutpay-order) instead.

## GET /payment/all

`GET /wp-json/storeengine/v1/payment/all`

Admin-only. Returns all registered payment gateways (available and unavailable) with their metadata — useful for building a settings or reporting UI. Supports the standard collection parameters.

```bash
curl https://your-store.example/wp-json/storeengine/v1/payment/all \
  -u "admin:APPLICATION_PASSWORD"
```

## GET /payment/&lt;id&gt;

`GET /wp-json/storeengine/v1/payment/<id>`

Admin-only. Returns the payment/order detail for the given id. Accepts the `context` parameter.

## Related

- [Checkout API](/rest-api/checkout) — where payments are actually created and settled.
- [Payment Methods API](/rest-api/payment-methods) — saved cards / tokenization.
- [Settings API — payment gateways](/rest-api/settings#payment-gateways) — configure gateways.
- [Payment gateways reference](/reference/payment-gateways)
