# CA7

CA7 helps companies turn IoT and company data into answers: save data from devices and sensors,
build your own AI models, share datasets through one API, and support your teams.

Built with [Payload CMS](https://payloadcms.com) and Next.js 16 (App Router), PostgreSQL and Tailwind CSS 4.

## What is in it

| Area | What it does |
|---|---|
| **Home** (`/`) | IoT / company-data landing page with the dotted camera that follows the pointer |
| **AI Models, Datasets** (`/models`, `/datasets`) | Catalog managed in the admin panel (Payload collections `ai-models`, `datasets`) |
| **CA7 chat** (`/chat-ca7`) | Streaming chat for the `ca7` model (Qwen via Ollama, see [`ai/ca7`](ai/ca7/README.md)) |
| **Shop** (`/shop`, `/products`) | Apps from the Marketplace API, and hardware/products from Payload |
| **Pricing** (`/pricing`) | Free, Hobby (EUR 20, incl. VAT) and Company (EUR 500, excl. VAT) packs |
| **Dashboard** (`/dashboard`) | Logged-in customers: API key, data export, downloadable sync tool |
| **Payments** | Stripe (cards) and Mollie (iDEAL, Bancontact, ...) |
| **Languages** | en, nl, de, fr, es, pl, ar (right-to-left), language codes in the address: [docs/I18N.md](docs/I18N.md) |
| **Admin panel** | Hidden behind a private per-admin link: Account settings > Open admin panel |

## Quick start

Needs Node 22, pnpm and PostgreSQL.

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL, PAYLOAD_SECRET, ...
pnpm dev                    # http://localhost:3000
```

The first account that registers becomes admin. Without `SMTP_HOST` set, Payload tries to create a test mail
account over the internet; for local work set `SMTP_HOST=localhost`.

## Scripts

| Command | |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Run, build, serve |
| `pnpm test:int` | Integration tests (translations, admin link, rate limit, API) |
| `pnpm test:e2e` | Playwright tests (need an empty database) |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after changing collections |
| `pnpm payload migrate` | Run database migrations (`src/migrations`) |

## Documentation

- [Going live](docs/DEPLOY.md): environment variables, migrations, hidden admin, known limits
- [Languages and translations](docs/I18N.md)
- [CA7 model](ai/ca7/README.md)

## Project layout

```
src/app/(app)/        Website pages and API routes (/api/ca/*)
src/app/(payload)/    Payload admin panel
src/collections/      Payload collections (users, products, ai-models, datasets, ...)
src/components/       UI components
src/i18n/             Languages, translations (translations/<code>.ts)
src/lib/              Admin link, plans, rate limiting, Marketplace client
src/payments/mollie/  Mollie adapter for the ecommerce plugin
src/proxy.ts          Language redirects and the hidden admin gate
ai/ca7/               Recipe for the CA7 model (Ollama)
public/               Dotted icons, logos and payment badges
tests/                Integration and e2e tests
```

## License

No license file yet. Add one before publishing.
