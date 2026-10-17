# DrapesAtDoorstep

A static, responsive sample website for a saree business. The project is intentionally buildless so it can be opened directly or deployed to GitHub Pages with no framework, package manager, or server required.

## Run locally

Open `index.html` in a browser, or start a tiny local server:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000> from inside this folder.

## Project map

- `index.html` — page structure and sample copy/products
- `styles.css` — responsive layout, visual system, and CSS artwork
- `script.js` — mobile navigation, product filters, and newsletter demo state
- `assets/favicon.svg` — lightweight brand favicon

## Before launch

Replace the sample email address, sample prices, product names, and CSS artwork with the business’s final identity, real product photos, inventory, shipping policy, and social links. The newsletter form is a front-end demo only; connect it to a mailing-list provider before collecting real addresses.

## GitHub Pages

This repository can be published directly from the root folder using GitHub Pages. In the repository settings, choose **Pages → Deploy from a branch → main → / (root)**. The included `.nojekyll` file keeps the deployment simple.
