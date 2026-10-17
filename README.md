# DrapesAtDoorstep

A responsive saree storefront with a home-visit enquiry form and an optional AI FAQ assistant. The merchant brings sarees directly to customers’ homes and confirms each visit personally.

The frontend is buildless HTML/CSS/JavaScript. A small Python backend emails enquiries and handles AI requests. Enquiries live in the merchant’s Gmail inbox; there is no customer database or merchant dashboard in this version.

## Run locally

Use Python 3.11+ from the project root:

```bash
python3 -m backend.app
```

Then visit <http://localhost:8000>. No dependencies are needed for local development or backend tests. Without credentials, the form and AI submission controls are disabled with an Instagram fallback; the preset FAQ buttons still work. They are labelled as quick answers, not AI replies.

Opening `index.html` directly or using GitHub Pages still displays the storefront, but email and AI need the backend connection described below.

## Configure Gmail enquiries

The default recipient is `nagendraprasad.bv@gmail.com`. Change `MERCHANT_EMAIL` whenever the business account is ready. The sending account is separate (`SMTP_USER`) and can initially be the same Gmail address.

| Email header | Value |
| --- | --- |
| From | DrapesAtDoorstep enquiries, using the authenticated `SMTP_USER` address |
| To | `MERCHANT_EMAIL` |
| Reply-To | The customer’s validated email address |

Create a local `.env` from `.env.example` with your editor, or set the variables directly in your hosting provider’s environment/secret settings. Never put secrets in `config.js` or commit `.env`.

- `MERCHANT_EMAIL`: the inbox receiving enquiries.
- `SMTP_USER`: the Gmail account that sends the messages.
- `SMTP_PASSWORD`: a Google app password for that sending account, without spaces; not the normal account password. App passwords require 2-Step Verification and may be unavailable for some accounts. If unavailable, use an OAuth-based mail integration instead of weakening account security. [Google’s setup instructions](https://support.google.com/accounts/answer/185833).
- `SMTP_HOST` / `SMTP_PORT`: default to `smtp.gmail.com` / `465`, with TLS and certificate verification. [Gmail SMTP documentation](https://developers.google.com/workspace/gmail/imap/imap-smtp).
- `BUSINESS_TIMEZONE`: defaults to `Asia/Kolkata`, used to reject past visit dates. Time entered by the customer is the preferred local time at the visit address, not an appointment slot.
- `ALLOWED_ORIGINS`: comma-separated frontend origins (scheme + host + optional port; no URL paths).

To load a trusted local `.env` in Bash before starting the server:

```bash
set -a
. ./.env
set +a
python3 -m backend.app
```

Submitting the form only shows success after SMTP accepts the email. That is not a guarantee of inbox placement or a confirmed visit. Check the inbox and spam folder during a live smoke test. No automatic customer email is sent; use Reply in Gmail to respond.

## Configure optional AI chat

Set `OPENAI_API_KEY` on the backend. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and can be changed to a compatible Responses API model available to your account. API usage needs its own configured billing; this is not a customer ChatGPT login.

The [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) receives chat messages and the confirmed facts in `backend/business-facts.txt`. Update that file when the merchant supplies coverage, fees, hours, or other policies. Sample catalogue prices are explicitly excluded as reliable business facts. The assistant is instructed to hand unknown questions to the merchant; it cannot book visits, send emails, or access the Gmail inbox.

Form details are never automatically included in AI requests. Chat is held in page memory, with only the last eight messages sent as context. Reloading clears it. API calls use `store: false`, which disables response storage for later API retrieval; it does not promise zero retention by the provider. The widget discloses AI use and asks users to keep contact/address details in the enquiry form.

## Deploy the dynamic site

The backend requires a host that supports Python and outbound TLS connections to Gmail SMTP and OpenAI. GitHub stores the code, but **GitHub Pages cannot execute this backend**. The simplest production layout serves the frontend and backend together on one HTTPS origin.

```bash
python3 -m pip install -r requirements.txt
gunicorn -c gunicorn.conf.py backend.app:app
```

Configure environment variables through the host’s secret settings. Set `ALLOWED_ORIGINS` to the actual public origin. Keep `PORT` as supplied by the host (default `8000`). The local `wsgiref` preview server is not the production server.

If hosting the frontend separately, set the public `apiBaseUrl` in `config.js` to the backend’s HTTPS origin. For the existing Pages preview, the allowed origin is `https://merchantmate.github.io` (without `/DrapesAtDoorStep/`). Keep credentials on the backend only. Use commercial hosting for the live business; see [GitHub Pages usage limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

Built-in limits allow five enquiries and twenty AI requests per source IP per hour, capped globally at sixty enquiries and one hundred AI requests per hour per process. Run the supplied single-worker configuration; before scaling, move counters and retry deduplication to a shared store. Limits reset on restart and are not a billing guarantee. Behind a reverse proxy, clients may share its IP because untrusted forwarding headers are ignored; use the host’s rate-limiting controls for accurate per-client limits. Configure an API project spending limit as well.

Successful enquiry retries with the same request ID are deduplicated for one hour while the process is running. This is not durable exactly-once delivery: a process restart or SMTP connection loss after acceptance can still cause duplicates. No enquiry bodies or chat content are written to application logs or disk by this app; Gmail stores the delivered enquiries.

Before enabling for customers, test one enquiry with a real sending account, verify Reply-To, and check the chat against the merchant’s confirmed answers. This repository’s automated tests mock both providers and never send real messages.

## Project map

- `index.html` — page structure and sample copy/products
- `styles.css` — responsive layout, visual system, and CSS artwork
- `script.js` — mobile navigation and product filters
- `services.js` — enquiry form, service readiness, and chat widget
- `config.js` — public backend URL only
- `backend/app.py` — validation, SMTP delivery, AI API, and static-file allowlist
- `backend/business-facts.txt` — confirmed facts used by the AI assistant
- `.env.example` — server configuration template (no credentials)
- `tests/` — provider-mocked checks
- `assets/favicon.svg` — lightweight brand favicon

## Verify

```bash
python3 -m unittest discover -s tests -v
node --test tests/services.test.cjs
node --check script.js
node --check services.js
git diff --check
```

## Before launch

Replace sample prices, product names, and CSS artwork with the merchant’s real product details and photos. The merchant owns the photos on @soupujithas and has approved reuse, but no Instagram images have been imported yet. Use original image files supplied by the merchant if Instagram access is unavailable.

Confirm service areas, visit availability, and any charges with the merchant before adding those details to the site. Add a verified WhatsApp number or email if the merchant wants another enquiry channel.

## Design guidance

Interface refinements use [Emil Kowalski’s design engineering guidance](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) as a reference, without a runtime dependency or global skill installation. Keep the home-visit enquiry prominent and the collection easy to browse on phones. Use restrained interaction feedback, respect reduced-motion settings, and keep every action available to keyboard and touch users.

## GitHub Pages

This repository can be published directly from the root folder using GitHub Pages. In the repository settings, choose **Pages → Deploy from a branch → main → / (root)**. The included `.nojekyll` file keeps the deployment simple.
