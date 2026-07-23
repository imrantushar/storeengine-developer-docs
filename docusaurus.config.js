// @ts-check
// StoreEngine Developer Documentation — Docusaurus configuration
// Docs: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'StoreEngine Developer Docs',
  tagline: 'Build, extend, and integrate with StoreEngine & StoreEngine Pro',
  favicon: 'img/favicon.ico',

  // Future flags — opt into Docusaurus v4 behaviour early.
  future: {
    v4: true,
    faster: true,
  },

  // Production URL and base path. The site is served from the subdomain root.
  url: 'https://developer.storeengine.pro',
  baseUrl: '/',

  // GitHub Pages deployment config.
  organizationName: 'imrantushar',
  projectName: 'storeengine-developer-docs',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  onBrokenAnchors: 'warn',

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // Serve docs at the site root — this is a docs-only site.
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/imrantushar/storeengine-developer-docs/tree/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/storeengine-social-card.svg',
      metadata: [
        {
          name: 'keywords',
          content:
            'storeengine, storeengine pro, wordpress ecommerce, storeengine api, storeengine rest api, storeengine hooks, storeengine addon development, wordpress ecommerce developer docs',
        },
        { name: 'author', content: 'Kodezen' },
      ],
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: 'StoreEngine Developers',
        logo: {
          alt: 'StoreEngine',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Guides',
          },
          {
            type: 'docSidebar',
            sidebarId: 'restApiSidebar',
            position: 'left',
            label: 'REST API',
          },
          {
            type: 'docSidebar',
            sidebarId: 'referenceSidebar',
            position: 'left',
            label: 'Reference',
          },
          {
            href: 'https://storeengine.pro',
            label: 'storeengine.pro',
            position: 'right',
          },
          {
            href: 'https://github.com/imrantushar/storeengine-developer-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting Started', to: '/getting-started/introduction' },
              { label: 'Building Addons', to: '/addons/architecture' },
              { label: 'REST API', to: '/rest-api/overview' },
              { label: 'Hooks Reference', to: '/reference/hooks/actions' },
            ],
          },
          {
            title: 'StoreEngine',
            items: [
              { label: 'Website', href: 'https://storeengine.pro' },
              { label: 'Blog', href: 'https://storeengine.pro/blog/' },
              {
                label: 'WordPress.org',
                href: 'https://wordpress.org/plugins/storeengine/',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/imrantushar/storeengine-developer-docs',
              },
              { label: 'X / Twitter', href: 'https://twitter.com/StoreEngineTeam' },
              { label: 'YouTube', href: 'https://www.youtube.com/@StoreEngine' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} StoreEngine by Kodezen. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['php', 'bash', 'json', 'sql', 'diff', 'ini', 'yaml'],
      },
    }),
};

export default config;
