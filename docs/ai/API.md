# CA7 Intelligence API

Base: `https://cloud.ca7.io`. Logged-in calls use the session cookie or `Authorization: JWT <token>`. Errors: `{ "error": "..." }`.

| Method and path | Who | What |
|---|---|---|
| `GET /api/search?q=` | anyone | Smart search over products, pages, docs, research, blog, AI models, datasets. `results`, `suggestion` |
| `GET /api/ca/ai/recommend?products=1,2` | anyone | `{ items: [{ id, title, price, score, reason, sponsored }], version, decision }`. Personal only with consent |
| `GET /api/ca/ai/offers` | anyone | Bundles; a discount appears only when the rule `bundle_discount_percent` exists and is under `max_discount_percent` |
| `GET /api/ca/ai/running-low` | logged in | Things bought repeatedly and due again. `{ needsConsent: true }` without consent |
| `POST /api/ca/ai/assistant` | anyone (limited) | `{ messages: [{role, content}] }` → `{ text, decision, offline }` |
| `GET / POST /api/ca/ai/consent` | logged in | `{ consent: boolean }` |
| `GET / POST /api/ca/ai/admin` | admin | Control Center data; actions `flag`, `version`, `job` |

Limits: assistant 10 per 10 min for visitors, 40 for customers; recommendations 60 per minute per address. Everything is switched off by its feature flag (`503` or `disabled: true`).
