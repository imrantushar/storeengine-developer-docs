# StoreEngine Developer Documentation

Source for the official **StoreEngine & StoreEngine Pro** developer documentation,
published to **[developer.storeengine.pro](https://developer.storeengine.pro)**.

Built with [Docusaurus](https://docusaurus.io/) and deployed to GitHub Pages via GitHub Actions.

## What's inside

- **Guides** — getting started, architecture, building addons, working with data objects
- **REST API** — the full `storeengine/v1` reference (cart, checkout, orders, products, subscriptions, payments…)
- **Reference** — hooks & filters, templates, shortcodes, blocks, WP-CLI, payment gateways, Pro addons

## Local development

Requires **Node.js 20+** (see `.nvmrc`).

```bash
nvm use            # or: nvm install 20
npm install
npm start          # dev server with hot reload at http://localhost:3000
```

## Build

```bash
npm run build      # static output in ./build
npm run serve      # preview the production build locally
```

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and publishes it to GitHub Pages. The custom domain is set via `static/CNAME`
(`developer.storeengine.pro`).

One-time setup in the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**,
then add the `developer.storeengine.pro` DNS `CNAME` record pointing to `imrantushar.github.io`.

## Contributing

Docs live in `docs/`. Sidebars are defined in `sidebars.js`. Site config is in `docusaurus.config.js`.

---

Made by [StoreEngine](https://storeengine.pro) · Kodezen
