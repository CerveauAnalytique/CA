# Going live

## Environment variables (see `../.env.example`)

| Variable | What it is |
|---|---|
| `DATABASE_URL`, `PAYLOAD_SECRET` | PostgreSQL and the Payload secret (also signs the private admin link) |
| `NEXT_PUBLIC_SERVER_URL` | `https://cloud.ca7.io` (needed for payment redirects, webhooks, hreflang and the sitemap) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_ADDRESS` | Outgoing e-mail (password resets). Without `SMTP_HOST` Payload tries to create a test account over the internet |
| `STRIPE_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe card payments |
| `MOLLIE_API_KEY`, `NEXT_PUBLIC_MOLLIE_ENABLED=true` | Mollie (iDEAL, Bancontact, ...) |
| `CA7_API_URL`, `CA7_MODEL` | Ollama-compatible server with the `ca7` model (see `../ai/ca7/README.md`) |
| `CA7_CHAT_LIMIT_ANON`, `CA7_CHAT_LIMIT_USER` | Chat requests per 10 minutes for visitors / logged-in customers |
| `MARKETPLACE_API_URL`, `NEXT_PUBLIC_MARKETPLACE_WEB_URL` | The Marketplace API and web app (CerveauAnalytique/Marketplace) |
| `CA7_CLOUD_HOST`, `CA7_CHAT_HOSTS` | Domains (defaults below) |
| `ADMIN_GATE=off` | Turns the hidden admin link off (used by the e2e tests) |

## Domains

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
