# Going live

## Environment variables (see `../.env.example`)

| Variable | What it is |
|---|---|
| `DATABASE_URL`, `PAYLOAD_SECRET` | PostgreSQL and the Payload secret (also signs the private admin link and encrypts stored credentials). In Docker, `DATABASE_URL` in `.env` points the backend to an outside database such as Neon; empty uses the `db` container. Every server that uses the same database needs the same `PAYLOAD_SECRET` |
| `NEXT_PUBLIC_SERVER_URL` | `https://cloud.ca7.io` (needed for payment redirects, webhooks, hreflang and the sitemap) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_ADDRESS` | Outgoing e-mail (password resets). Without `SMTP_HOST` Payload tries to create a test account over the internet |
| `STRIPE_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe card payments |
| `MOLLIE_API_KEY`, `NEXT_PUBLIC_MOLLIE_ENABLED=true` | Mollie (iDEAL, Bancontact, ...) |
| `CA7_API_URL`, `CA7_MODEL` | Ollama-compatible server with the `ca7` model (see `../ai/ca7/README.md`) |
| `CA7_CHAT_LIMIT_ANON`, `CA7_CHAT_LIMIT_USER` | Chat requests per 10 minutes for visitors / logged-in customers |
| `MARKETPLACE_API_URL`, `NEXT_PUBLIC_MARKETPLACE_WEB_URL` | The Marketplace API and web app (CerveauAnalytique/Marketplace) |
| `CA7_CLOUD_HOST`, `CA7_CHAT_HOSTS` | Domains (defaults below) |
| `OPENREMOTE_URL`, `DIFY_URL`, `AIRBYTE_URL`, `THINGSBOARD_URL` | Addresses of the platform tools (`platform/README.md`) |
| `CA7_OIDC_PRIVATE_KEY`, `CA7_OIDC_CLIENTS` | CA7 as login provider for the tools (`platform/SSO.md`) |
| `CA7_CRON_SECRET` | Secret for `POST /api/ca/sync`, called by a scheduler |
| `ADMIN_GATE=off` | Turns the hidden admin link off (used by the e2e tests) |

## Front end and backend

The backend (this repo's Next.js) has **no website**: it is the API and the admin panel. The website is the Flutter app: build it and host the static files
(any web server with a fallback to `index.html`). Backend variables: `CA7_APP_URL` (address of the app) and `CA7_APP_ORIGINS` (the same, for CORS).

## Domains (the old Next.js routing is replaced)

The host routing described below now lives in the Flutter app (`Env.chatHosts`, `Env.cloudHost`). Point `ca7.io`, `ca7.nl`, `ca7.be` and `cloud.ca7.io` at the Flutter build.

Point all four domains (and their `www.` versions) at the same app, with HTTPS certificates for each:

| Domain | Shows |
|---|---|
| `cloud.ca7.io` | The whole site: account and settings, shop, pricing, docs, API keys, hidden admin |
| `ca7.io`, `ca7.nl`, `ca7.be` | The CA7 chat. Every other page redirects to `cloud.ca7.io`. `ca7.nl` and `ca7.be` start in Dutch |

Logins live on `cloud.ca7.io`, so the chat on the other domains uses the visitor limit. Other hosts (localhost, preview URLs) show everything.
The proxy must pass the `Host` header and `X-Forwarded-Proto`. Logic: `src/proxy.ts`, `src/lib/hosts.ts`.

## Database

`src/migrations/` holds the migration for a **new, empty** database. In production it runs when the site starts
(`prodMigrations`), or run it yourself: `pnpm payload migrate`.
Future schema changes: `pnpm payload migrate:create <name>` and commit the files.
A database that was created by the dev server (schema push) cannot take this migration (Payload asks to wipe it, which blocks a build); start production on an empty database.
Set `PAYLOAD_SKIP_MIGRATIONS=1` to build or start against a development database without running them.

## Admin panel

`/admin` is hidden. The first account becomes admin; after that an admin opens it through
Account settings > Open admin panel (`/{name}/ad/{token}`).

## Known limits

- The shop prices are in USD (`priceInUSD` is used in many places). iDEAL and Bancontact need EUR, so Mollie works for
  card/PayPal-type methods in USD only until the shop is moved to EUR.
- The chat rate limit is per server instance. Use a shared store (Redis) when you run several instances.
- Frontend e2e tests (`tests/e2e/frontend.e2e.spec.ts`) need an empty database and Stripe test keys; admin tests need an empty database too.

## Updating the server

**GitHub (recommended):** every push to the `phylena` branch runs `.github/workflows/deploy.yml`. GitHub builds only the part that
changed (backend and/or website) into an image on `ghcr.io`, and the server pulls it and restarts. A website change is
live in a few minutes. Needs two repository secrets: `DEPLOY_HOST` (`ec2-user@…`) and `DEPLOY_KEY` (the SSH key). The
server keeps its own `~/ca7/.env` with the secrets and `DATABASE_URL`; GitHub never sees it.

**From a laptop:** `./deploy.sh` builds what changed since the last deploy (one build at a time), copies only changed
website files with rsync and uploads the backend image only when backend code changed. Settings in `.deploy.env`
(`DEPLOY_HOST`, `DEPLOY_KEY`), which is not in git.

Both use the small backend image (Next.js `standalone`, `NEXT_OUTPUT=standalone` in the Dockerfile) and a website build
without the WebAssembly dry run.

## Domain and HTTPS

The `proxy` service (Caddy, profile `https`) serves the site on a domain with a free certificate that renews itself.
In the server's `.env`: `DOMAIN=platform.phylena.com`, `COMPOSE_PROFILES=https`, `WEB_PORT=127.0.0.1:8081` and
`PUBLIC_URL=https://platform.phylena.com`. The domain's A record must point to the server, and ports 80 and 443 must be
open. Only the domain gets the site: the bare IP address and other names get no answer (`deploy/Caddyfile`).
