# Agents

Read this first if you are an AI assistant (or a new developer) working on this repository.

## What CA7 is

**CA7: the AI brain for business data.** An AI data platform for companies: they connect databases, REST APIs,
CSV files, IoT devices, sensors and cameras to one platform, then analyze the data, ask questions to it,
build their own AI models and automate. Smart cameras are **one data source and an optional module**
(Camera Intelligence), not the whole product. Do not position or describe CA7 as only a camera company.

Full plan, packs, build order and an honest status table: **[docs/PRODUCT.md](docs/PRODUCT.md)**. Keep that table up to date.

## What exists now and what is next (details: the status table in `docs/PRODUCT.md`)

Built in a first version: pack limits (`src/lib/limits.ts`) and Stripe billing, Data Connect (REST, CSV, push API), Data Intelligence
(statistics, trend, unusual values), Automation (e-mail, webhook), CA7 Chat with data context (Pro and up), camera desktop agent preview.
All settings pages live in `/dashboard/*`.

Build next, in this order:

1. **Data Connect:** SQL databases (credentials encrypted, read-only, never returned to the browser) and direct MQTT. Keep the
   private-address check (`assertPublicUrl` in `src/lib/connect.ts`) on everything the server fetches for a customer.
2. **CA7 Chat on company data:** today the model only gets statistics. Make it answer from the customer's rows, say which source an
   answer came from and what is missing. It must never invent numbers. Test with questions whose answer is known.
3. **Data Intelligence:** forecasting and own AI models per customer; more than one statistic (not only mean and 3 sigma).
4. **Camera Intelligence:** object and person recognition, RTSP, a graphical desktop app with installers (the agent in
   `desktop/ca7-camera-agent` only measures movement).
5. **Billing:** Mollie subscriptions, VAT, plan changes between Hobby and Pro, limits for AI models and file storage.

## Architecture: Flutter front end, Next.js backend

- **Front end = Flutter** (`flutter_app/`): the whole website (web, Android, iOS). All pages, texts, design and logic for visitors are there.
- **Backend = Next.js + Payload** (`src/`): only the API (`/api/*`, `/api/ca/*`), the admin panel (`/admin`) and the database. It serves **no pages**:
  every other address redirects to the app (`CA7_APP_URL`). Do not add pages or React components here.
- A new feature = a backend route or collection here **and** the screens in `flutter_app/`. Plans and limits exist in both
  (`src/lib/limits.ts` and `flutter_app/lib/features/dashboard/limits.dart`, `features/pricing/plans.dart`); translations are exported with
  `flutter_app/tool_export_translations.mjs`. Status and remaining gaps: `docs/FLUTTER_MIGRATION.md`.

## Rules

- **Be honest about what exists.** Never describe a feature as available if it is not built. Update the status table in `docs/PRODUCT.md`
  when you build something.
- **Customer data is private.** Every collection and endpoint needs access control. Nothing is public by default.
- **Secrets stay out of git.** Use environment variables; document new ones in `.env.example` and `docs/DEPLOY.md`.
- **Texts a visitor sees** are English in the Flutter code and translated by `src/i18n/translations/*.ts` (keyed by the English text, exported to the app). Add a translation in all six files; `pnpm test:int` checks they match.
- **Schema changes need a migration:** `pnpm payload migrate:create <name>`, commit the files, then `pnpm generate:types`.
- **Keep the design:** light, quiet, lots of white; blue dotted art (`public/icons`, `public/nav`, the camera and wordmark); the site
  stays inside the 1280px container; works in dark mode and right-to-left (use `ms-`/`me-`/`ps-`/`pe-`/`text-start`, not left/right).
- Run `pnpm test:int` and `pnpm build` before you push.

## Where things are

See "Project layout" in [README.md](README.md). Pack prices and limits: `src/lib/plans.ts`. Languages and the hidden admin
panel: `docs/I18N.md`, `docs/DEPLOY.md`.

## Payload CMS

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.
