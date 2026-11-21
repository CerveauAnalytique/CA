# Agents

Read this first if you are an AI assistant (or a new developer) working on this repository.

## What CA7 is

**CA7: the AI brain for business data.** An AI data platform for companies: they connect databases, REST APIs,
CSV files, IoT devices, sensors and cameras to one platform, then analyze the data, ask questions to it,
build their own AI models and automate. Smart cameras are **one data source and an optional module**
(Camera Intelligence), not the whole product. Do not position or describe CA7 as only a camera company.

Full plan, packs, build order and an honest status table: **[docs/PRODUCT.md](docs/PRODUCT.md)**. Keep that table up to date.

## What to build next (in this order)

1. **Data Connect:** 3 to 5 good connectors: SQL, REST API, CSV and IoT/MQTT. A connector has a configuration (credentials,
   stored encrypted, never returned to the browser), a sync/read function, a schema description and access control per customer.
2. **CA7 Chat on company data:** the chat (`src/components/Chat/ChatCa7.tsx`, `src/app/(app)/api/ca/chat/route.ts`) must answer
   **only from the customer's connected data**, say which source an answer came from, and say what is missing when data is
   not available. It must never invent numbers. Test it with questions whose answer is known.
3. **Data Intelligence and Automation:** analysis, anomaly detection, and actions triggered by events and data.
4. **Camera Intelligence** as a separate module, only when there are concrete customers and use cases.

Also open: billing for the packs (subscriptions via Mollie/Stripe, and setting `users.plan` automatically), enforcing pack
limits, EUR prices in the shop, and a proper file/object storage for customer data.

## Rules

- **Be honest about what exists.** Never describe a feature as available if it is not built. Update the status table in `docs/PRODUCT.md`
  when you build something.
- **Customer data is private.** Every collection and endpoint needs access control. Nothing is public by default.
- **Secrets stay out of git.** Use environment variables; document new ones in `.env.example` and `docs/DEPLOY.md`.
- **Every text a visitor sees goes through `t()` / `tr()`** (see `docs/I18N.md`). `pnpm test:int` fails when a translation is missing.
  Add the text in all six translation files.
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
