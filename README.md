# CA7

**CA7: the AI brain for business data.**

CA7 is an AI data platform for companies. Companies connect their own data, devices and systems
(databases, REST APIs, CSV files, IoT devices, sensors and cameras) to one AI platform, and then
analyze it, ask questions to it, build their own AI models and automate on top of it.

Smart cameras and sensors are **one of the data sources**, not the whole product. A smart camera
becomes an optional module (Camera Intelligence), added when there are concrete customers.

> Example: a logistics company connects 30 cameras, 12 sensors and its warehouse system.
> The owner asks: *"How many pallets were processed today, how many trucks are still waiting, and are
> there temperature deviations?"* CA7 gets the data from the connected systems, analyzes it and answers
> based on the data that is available.

## What CA7 is made of

| Module | |
|---|---|
| **Data Connect** | Connect databases, APIs, IoT devices, sensors and cameras |
| **AI Models** | Use existing AI models or build your own on company data |
| **Data Intelligence** | Patterns, anomalies and trends |
| **CA7 Chat** | Ask questions to your own data |
| **Data Storage** | Datasets, logs, sensor information and other data |
| **Automation** | AI takes actions based on events and data |
| **Camera Intelligence** | Smart cameras as an extra module (later) |
| **API** | Other apps and systems talk to CA7 |

Packs: Free (EUR 0), Hobby (EUR 20), Pro (EUR 99 to 199), Business (EUR 500), Enterprise (from EUR 1,500).
Full plan, status and build order: **[docs/PRODUCT.md](docs/PRODUCT.md)**.

## Where the project stands

The website, accounts, pricing, seven languages, Stripe and Mollie payments, the AI Models and Datasets
catalog, API keys and data export are built. First versions are built of: **pack billing and limits** (Hobby and Pro by card,
limits enforced), **Data Connect** (REST, CSV, push API for IoT), **Data Intelligence** (statistics, trends, unusual values),
**Automation** (e-mail and webhook, Business pack), **CA7 Chat with your data** (Pro and up) and a **Camera Intelligence desktop
agent** (movement only). Everything is in the dashboard (settings) at `/dashboard`.
**Not built yet:** SQL and direct MQTT connectors, person/object recognition, RTSP and a graphical desktop app, Mollie subscriptions.
The next steps are listed in `AGENTS.md`.

For AI assistants and new developers working on this repository: read [AGENTS.md](AGENTS.md) first.

## Built with

[Payload CMS](https://payloadcms.com) and Next.js 16 (App Router), PostgreSQL and Tailwind CSS 4.

## What is in the website

| Area | What it does |
|---|---|
| **Home** (`/`) | Landing page: the AI brain for business data, with the dotted camera that follows the pointer |
| **AI Models, Datasets** (`/models`, `/datasets`) | Catalog managed in the admin panel (Payload collections `ai-models`, `datasets`) |
| **CA7 chat** (`/chat-ca7`) | Streaming chat for the `ca7` model (Qwen via Ollama, see [`ai/ca7`](ai/ca7/README.md)) |
| **Shop** (`/shop`, `/products`) | Apps from the Marketplace API, and hardware/products from Payload |
| **Pricing** (`/pricing`) | Free, Hobby, Pro, Business and Enterprise packs (`src/lib/plans.ts`) |
| **Dashboard** (`/dashboard`) | Logged-in customers: API key, data export, downloadable sync tool |
| **Payments** | Stripe (cards) and Mollie (iDEAL, Bancontact, ...) |
| **Languages** | en, nl, de, fr, es, pl, ar (right-to-left), language codes in the address: [docs/I18N.md](docs/I18N.md) |
| **Admin panel** | Hidden behind a private per-admin link: Account settings > Open admin panel |

## Flutter app

`flutter_app/` is the same front end in Flutter (web, Android, iOS), using this backend. It is a partial migration: see
[docs/FLUTTER_MIGRATION.md](docs/FLUTTER_MIGRATION.md) and [flutter_app/README.md](flutter_app/README.md).

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

- [Product plan and status](docs/PRODUCT.md)
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
