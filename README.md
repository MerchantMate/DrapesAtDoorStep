# DrapesAtDoorstep

A static, responsive sample website for a saree business that brings sarees directly to customers’ homes. The homepage explains the home-visit service and directs enquiries to the merchant’s Instagram account, [@soupujithas](https://www.instagram.com/soupujithas/). Visits are arranged directly with the merchant; the website does not submit or confirm bookings.

The project is intentionally buildless so it can be opened directly or deployed with no framework, package manager, or server required.

## Run locally

Open `index.html` in a browser, or start a tiny local server:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000> from inside this folder.

## Project map

- `index.html` — page structure and sample copy/products
- `styles.css` — responsive layout, visual system, and CSS artwork
- `script.js` — mobile navigation and product filters
- `assets/favicon.svg` — lightweight brand favicon

## Before launch

Replace sample prices, product names, and CSS artwork with the merchant’s real product details and photos. The merchant owns the photos on @soupujithas and has approved reuse, but no Instagram images have been imported yet. Use original image files supplied by the merchant if Instagram access is unavailable.

Confirm service areas, visit availability, and any charges with the merchant before adding those details to the site. Add a verified WhatsApp number or email if the merchant wants another enquiry channel.

## GitHub Pages

This repository can be published directly from the root folder using GitHub Pages. In the repository settings, choose **Pages → Deploy from a branch → main → / (root)**. The included `.nojekyll` file keeps the deployment simple.
