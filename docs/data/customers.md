---
title: "The Customer Object"
description: "StoreEngine's Customer object — load a customer by WordPress user id, read profile and billing/shipping details, aggregate order totals and spend, and persist address changes."
sidebar_label: "Customers"
keywords: [storeengine, customer object, billing address, shipping address, total spent, customer api, wp_user]
---

A customer is a WordPress user enriched with commerce data — billing/shipping addresses and order aggregates. StoreEngine wraps this in `StoreEngine\Classes\Customer`.

## Loading a customer

Construct with a WordPress user id and call `get()` to hydrate. Passing `0` (the default) yields a blank/guest customer.

```php
use StoreEngine\Classes\Customer;

$customer = new Customer( get_current_user_id() );
$customer->get();   // load stored data

echo $customer->get_display_name();
echo $customer->get_email();
```

The second constructor argument, `bool $in_session`, ties the customer to the current front-end session (used during checkout for guests):

```php
$customer = new Customer( 0, true ); // session-backed guest customer
```

:::note No global accessor
There is no `storeengine_get_customer()` global — instantiate `Customer` directly with the user id.
:::

## Profile getters

| Method | Returns |
| --- | --- |
| `get_id()` | WordPress user id. |
| `get_wp_user()` | The underlying `WP_User` (nullable). |
| `get_email()` | Account email. |
| `get_full_name()` | First + last name. |
| `get_display_name()` | Display name. |
| `get_total_orders()` | Number of orders placed. |
| `get_total_spent()` | Lifetime spend. |

```php
$orders = $customer->get_total_orders();
$spent  = $customer->get_total_spent();
$user   = $customer->get_wp_user();     // ?WP_User
```

## Billing and shipping

Individual field getters follow the `get_billing_*` / `get_shipping_*` convention:

```php
$country  = $customer->get_billing_country();
$postcode = $customer->get_shipping_postcode();
$phone    = $customer->get_billing_phone();
```

Set a whole location at once, or set individual fields, then `save()`:

```php
// set_billing_location( string $country, string $state = '', string $postcode = '', string $city = '' )
$customer->set_billing_location( 'US', 'CA', '94016', 'San Francisco' );
$customer->set_shipping_location( 'US', 'CA', '94016', 'San Francisco' );

// individual setters also exist: set_billing_first_name(), set_shipping_address_1(), etc.

$customer->save();  // persist changes
```

Seed the billing address from the store's base location:

```php
$customer->set_billing_address_to_base();
$customer->save();
```

## Persisting

`save()` writes any pending profile/address changes back to storage. Always call it after mutating a customer:

```php
$customer->set_billing_phone( '+1 555 0100' );
$customer->save();
```

## See also

- [Orders](/data/orders) — orders reference the customer's user id.
- [Subscriptions](/data/subscriptions) — subscriptions belong to a customer.
- [REST API › Customers](/rest-api/customers) — the customer HTTP API.
- [REST API › Me](/rest-api/me) — the current-customer storefront endpoint.
