// @ts-check
// Sidebar definitions for the StoreEngine Developer Docs.
// Three top-level sidebars power the three navbar tabs: Guides, REST API, Reference.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/architecture-overview',
        'getting-started/development-environment',
        'getting-started/plugin-structure',
        'getting-started/free-vs-pro',
      ],
    },
    {
      type: 'category',
      label: 'Building Addons',
      collapsed: false,
      items: [
        'addons/architecture',
        'addons/create-your-first-addon',
        'addons/settings-api',
        'addons/database-tables',
        'addons/registration-and-gating',
        'addons/dependencies',
      ],
    },
    {
      type: 'category',
      label: 'Data & Objects',
      collapsed: false,
      items: [
        'data/database-schema',
        'data/post-types-and-taxonomies',
        'data/orders',
        'data/products',
        'data/cart',
        'data/customers',
        'data/coupons',
        'data/subscriptions',
        'data/order-statuses',
        'data/recipes',
      ],
    },
  ],

  restApiSidebar: [
    'rest-api/overview',
    'rest-api/authentication',
    {
      type: 'category',
      label: 'Storefront Endpoints',
      collapsed: false,
      items: [
        'rest-api/cart',
        'rest-api/checkout',
        'rest-api/me',
        'rest-api/me-subscriptions',
        'rest-api/payment-methods',
        'rest-api/storefront-auth',
      ],
    },
    {
      type: 'category',
      label: 'Admin Endpoints',
      collapsed: false,
      items: [
        'rest-api/orders',
        'rest-api/products',
        'rest-api/coupons',
        'rest-api/customers',
        'rest-api/subscriptions',
        'rest-api/payments',
        'rest-api/shipping',
        'rest-api/taxes',
        'rest-api/settings',
        'rest-api/analytics-and-logs',
      ],
    },
    'rest-api/extending',
  ],

  referenceSidebar: [
    {
      type: 'category',
      label: 'Hooks',
      collapsed: false,
      items: ['reference/hooks/actions', 'reference/hooks/filters'],
    },
    {
      type: 'category',
      label: 'Frontend',
      collapsed: false,
      items: [
        'reference/templates',
        'reference/shortcodes',
        'reference/blocks',
      ],
    },
    'reference/wp-cli',
    'reference/payment-gateways',
    'reference/pro-addons',
    {
      type: 'category',
      label: 'Contributing',
      collapsed: true,
      items: ['reference/coding-standards', 'reference/build-and-release'],
    },
  ],
};

export default sidebars;
