---
title: "Storefront Auth API"
description: "Public StoreEngine REST endpoints for storefront authentication — sign in and set the WP auth cookie, register a customer account, and the two-step forgot/reset password flow."
sidebar_label: "Storefront Auth"
keywords: [storeengine rest api, storefront login api, customer registration, forgot password, reset password, wp_signon, headless login]
---

The Storefront Auth controller (`api/storefront-auth.php`, base `auth`) mirrors StoreEngine's storefront login, registration, and password-reset forms over REST. It calls WordPress core primitives, so behavior is identical whether a shopper submits the classic form or a JS/headless client hits these routes.

## Authentication

All four routes are **public** (`__return_true`), except registration, which is additionally gated by WordPress's "Anyone can register" setting.

:::info[Same-origin only for the cookie session]
`POST /auth/login` sets the standard WordPress auth cookie via `wp_signon()`. That cookie can only be set for the same origin — you cannot establish a cookie session cross-origin. Cross-origin headless storefronts should authenticate with [Application Passwords](/rest-api/authentication#application-passwords-external-clients) instead. Protect same-origin calls with the WP REST nonce (`X-WP-Nonce`).
:::

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| <span class="api-method api-method--post">POST</span> | `/auth/login` | Sign in; sets the WP auth cookie |
| <span class="api-method api-method--post">POST</span> | `/auth/register` | Create a customer account (+ auto-login) |
| <span class="api-method api-method--post">POST</span> | `/auth/forgot-password` | Request a reset email |
| <span class="api-method api-method--post">POST</span> | `/auth/reset-password` | Finalize the reset with key + login |

All paths are relative to `/wp-json/storeengine/v1`.

## POST /auth/login

`POST /wp-json/storeengine/v1/auth/login`

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `username` | string | yes | Username or email. |
| `password` | string | yes | |
| `remember` | boolean | no | Persistent session. Default `false`. |
| `redirect_to` | string (uri) | no | Post-login redirect. Defaults to the dashboard (or wp-admin for admins). |

```bash
curl -X POST https://your-store.example/wp-json/storeengine/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: $NONCE" --cookie-jar cookies.txt \
  -d '{ "username": "ada@example.com", "password": "secret", "remember": true }'
```

On success the WP auth cookie is issued and the response is:

```json
{
  "message": "You have logged in successfully. Redirecting...",
  "redirect_url": "https://your-store.example/dashboard/",
  "user": { "id": 12, "display_name": "Ada Lovelace", "email": "ada@example.com" }
}
```

Bad credentials return `storeengine_auth_failed` (401). A stale auth cookie is cleared before each attempt so a failed login never leaves the previous session in place.

## POST /auth/register

`POST /wp-json/storeengine/v1/auth/register`

Creates a `storeengine_customer` account. Returns `storeengine_registration_closed` (403) if site registration is disabled.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string (email) | yes | Must be unique (`storeengine_register_email_taken`, 409). |
| `password` | string | yes | Minimum length filterable via `storeengine/auth/min_password_length` (default 8). |
| `first_name` | string | no | |
| `last_name` | string | no | |
| `auto_login` | boolean | no | Default `true`; sign the new user in immediately. |

The username is derived from the email local-part (dedup'd with a numeric suffix), matching the auto-create-on-checkout flow. Registration fires `storeengine/checkout/customer_created`, so the welcome email is sent on REST signup too. Success returns `{ message, redirect_url, user: { id, email, login } }`.

## POST /auth/forgot-password

`POST /wp-json/storeengine/v1/auth/forgot-password`

| Param | Type | Required |
| --- | --- | --- |
| `email` | string (email) | yes |

Triggers `retrieve_password()`, sending the branded reset email. To prevent account enumeration, the response is **always** generic regardless of whether the email matches an account:

```json
{ "message": "If an account exists with that email, a reset link is on its way." }
```

## POST /auth/reset-password

`POST /wp-json/storeengine/v1/auth/reset-password`

Finalizes the reset using the `key` and `login` from the emailed link.

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `key` | string | yes | Reset key from the email. |
| `login` | string | yes | Username from the email. |
| `password` | string | yes | Subject to the same minimum-length filter. |

An invalid or expired link returns `storeengine_reset_expired` (410). Success fires WordPress's `password_reset` action and returns `{ message, redirect_url }`.

## Related

- [Authentication](/rest-api/authentication) — the full auth model and headless options.
- [Me API](/rest-api/me) — the account dashboard the shopper lands on after login.
