# CA7: product plan

**CA7 — the AI brain for business data.**

CA7 is an AI data platform for companies. Companies connect their own data, devices and systems to one AI platform,
and then analyze, question and automate on top of it. Smart cameras and sensors are **one of the data sources**,
not the whole company.

## Positioning (decision)

| | CA7 Smart Camera | **CA7 AI Data Platform** (chosen) |
|---|---|---|
| What | AI camera that analyzes images, detects objects, raises alerts | Companies connect data, sensors, cameras, databases and APIs to one AI platform |
| Typical use | Parking, warehouses, production, security, traffic | Analyze data, detect anomalies, ask questions, automate |
| Start cost | High | Lower |
| Hardware | Often needed | Not required |
| Scaling | Hardware + software | Mostly software |
| Subscription | Possible | Very suitable |

CA7 grows into an AI, data and IoT infrastructure company without tying up money in hardware, production, stock and logistics.
**The camera becomes a product module of CA7, not the whole company.**

## Product modules

| Module | What the customer does |
|---|---|
| **Data Connect** | Connect databases, APIs, IoT devices, sensors and cameras |
| **AI Models** | Use existing AI models or build their own on company data |
| **Data Intelligence** | AI finds patterns, anomalies and trends |
| **CA7 Chat** | Ask questions to their own data |
| **Data Storage** | Store datasets, logs, sensor information and other data |
| **Automation** | Let AI take actions based on events and data |
| **Camera Intelligence** | Add smart cameras as an extra module (later, when there are concrete customers) |
| **API** | Let other apps and systems talk to CA7 |

### Example

A logistics company connects 30 cameras, 12 sensors and its warehouse system to CA7. The owner asks:
*"How many pallets were processed today, how many trucks are still waiting, and are there temperature deviations?"*
CA7 gets the data from the connected systems, analyzes it and answers **based on the data that is available**.

## Packs

| Pack | Price | For |
|---|---|---|
| Free | EUR 0 | Testing, developers |
| Hobby | EUR 20 / month (incl. VAT) | Makers and small projects |
| Pro | EUR 99 to 199 / month (excl. VAT, depends on usage; shown as "from EUR 99") | Small businesses |
| Business | EUR 500 / month (excl. VAT) | Teams and companies |
| Enterprise | from EUR 1,500 / month (excl. VAT) | Larger organisations |

Prices and limits live in `src/lib/plans.ts`. The limits on the pricing page are working assumptions, not yet enforced.

## Build order

1. **3 to 5 good connectors:** SQL, REST API, CSV and IoT/MQTT.
2. **CA7 Chat that gives demonstrably reliable answers on company data** (answers only from available data, with the source shown).
3. **Data analysis, anomaly detection and automation.**
4. **CA7 Smart Camera** as its own product module, once there are concrete customers and use cases.

## Status

What exists in this repository today, and what does not:

| Module | Status |
|---|---|
| Website, pricing, languages (7), payments (Stripe, Mollie), accounts | Built |
| API keys, data export (`/api/ca/export`), downloadable sync tool | Built |
| AI Models and Datasets catalog (admin-managed) | Built (a catalog; no model training or hosting yet) |
| CA7 Chat | UI and streaming route (`/api/ca/chat` to an Ollama `ca7` model). Pro and up: gets statistics of the customer's own sources as context (`src/app/(app)/api/ca/chat/route.ts`). Not a full retrieval system: it sees summaries, not raw rows |
| Data Connect | **Built (first version):** REST API (with private-address protection), CSV upload, push API for IoT, MQTT bridges and scripts (`/api/ca/ingest`). **Not built:** SQL databases and direct MQTT. Settings: `/dashboard/connect` |
| Data Storage | Catalog records only. No file/object storage for customer data |
| Data Intelligence | **Built (first version):** statistics, trend and unusual values (3 standard deviations, Pro and up) per field: `/dashboard/intelligence`, `/api/ca/insights`. No forecasting or machine-learning models yet |
| Automation | **Built (first version, Business and up):** rules on a field (greater, less, equals, unusual) that send an e-mail or call a webhook when new data arrives: `/dashboard/automation` |
| Camera Intelligence | **Preview.** A desktop agent (`desktop/ca7-camera-agent`) reads camera snapshots and sends movement scores as data. **Not built:** recognising people or objects, RTSP, a graphical app, installers |
| Platform tools (OpenRemote, Dify, Airbyte, ThingsBoard, TimescaleDB) | **Install scripts, status page, one CA7 login for ThingsBoard and OpenRemote (OIDC provider, tested with a simulated client), and OpenRemote/ThingsBoard as Data Connect sources (tested with a fake server)** (`platform/`, `/dashboard/platform`, Enterprise and admins). **Not run or tested here** (no Docker in the build environment), no real tool tried, Dify and Airbyte have no OIDC login, Airbyte/Dify not wired to CA7 data. See `platform/README.md` and `platform/SSO.md` |
| Profile settings (name, username, e-mail, language, password) | Built: `/dashboard/settings` |
| Content pages from the database (`site-pages`), smart search | Built; shown by the Flutter app. The Next.js pages still hold their own copy of the text |
| Marketing banner above the navbar | Built: admin panel > Globals > Marketing banner (on/off, text, link, color, closable); shown on the website and in the Flutter app |
| Pack limits and billing | **Built:** limits are enforced (`src/lib/limits.ts`: data sources, API calls per month, stored records, chat per 10 minutes, automation). Hobby and Pro by card through Stripe subscriptions (`/api/ca/billing/*`, needs `STRIPE_SECRET_KEY` and the webhook `STRIPE_WEBHOOKS_SIGNING_SECRET`). Business and Enterprise are by invoice: an admin sets `users.plan`. Not built: Mollie subscriptions, VAT handling, limits for AI models and file storage (records are the storage measure) |

## Principles

- Never claim a feature that does not exist. The pricing page lists planned features; keep this table honest.
- Answers from CA7 Chat must come from the customer's data. If data is missing, say what is missing.
- Customer data is private: access control on every collection and endpoint, nothing public by default.
- Position CA7 as an AI data platform. Cameras and sensors are data sources.
