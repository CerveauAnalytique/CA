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
| CA7 Chat | UI and streaming route exist (`/api/ca/chat` to an Ollama `ca7` model). **It is not connected to customer data yet** |
| Data Connect | **Not built.** Only CSV-style export and the REST export exist. No SQL/REST/CSV/MQTT connectors |
| Data Storage | Catalog records only. No file/object storage for customer data |
| Data Intelligence (analysis, anomalies) | **Not built** |
| Automation | **Not built** |
| Camera Intelligence | **Not built.** The hero image is a dotted picture only |
| Pack limits and billing (subscriptions) | **Not built.** Pack is set by an admin in `users.plan` |

## Principles

- Never claim a feature that does not exist. The pricing page lists planned features; keep this table honest.
- Answers from CA7 Chat must come from the customer's data. If data is missing, say what is missing.
- Customer data is private: access control on every collection and endpoint, nothing public by default.
- Position CA7 as an AI data platform. Cameras and sensors are data sources.
