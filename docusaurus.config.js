// @ts-check
// StoreEngine Developer Documentation — Docusaurus configuration
// Docs: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'StoreEngine Developer Docs',
  tagline: 'Build, extend, and integrate with StoreEngine & StoreEngine Pro',
  favicon: 'img/favicon.svg',

  // PNG + apple-touch fallbacks for browsers that don't render SVG favicons.
  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/img/favicon-32.png' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/img/favicon-16.png' },
    },
    {
      tagName: 'link',
      attributes: { rel: 'apple-touch-icon', sizes: '180x180', href: '/img/apple-touch-icon.png' },
    },
  ],

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
  onBrokenAnchors: 'warn',

  markdown: {
    // Parse `.md` as CommonMark (so `<id>` in route paths and `{…}` in prose
    // are treated as literal text, not JSX). `.mdx` files still use MDX.
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
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
          // No editUrl → the "Edit this page" link is omitted on every page.
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
        logo: {
          alt: 'StoreEngine Developer Docs',
          src: 'img/navbar-logo.svg',
          srcDark: 'img/navbar-logo-dark.svg',
          width: 153,
          height: 32,
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
            href: 'https://www.facebook.com/groups/academylmsteam',
            label: 'Community',
            position: 'right',
          },
          {
            href: 'https://community.kodezen.com/tickets',
            label: 'Support Ticket',
            position: 'right',
          },
          {
            href: 'https://storeengine.pro',
            label: 'storeengine.pro',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [],
        copyright: `Copyright © ${new Date().getFullYear()} StoreEngine by Kodezen LLC`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['php', 'bash', 'json', 'sql', 'diff', 'ini', 'yaml'],
      },
    }),
};

export default config;
