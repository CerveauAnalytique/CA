# CA7 Intelligence (AI): architecture

Smart search, recommendations, personal offers, "running low?" suggestions and an AI shopping assistant (a local Qwen model through Ollama; see `DEPLOYMENT.md`).
Everything the AI wants to show is checked by the **Compliance Engine** first. The engine is plain code (no AI): it works when the model is down.

```
customer ──> /api/ca/ai/*  ──> engine.ts (ranking, assistant) ──> compliance.ts ──> answer
                                  │                                   │
                          Postgres (orders, products)        ai-decisions (log, traces)
```

| Part | File |
|---|---|
| Compliance Engine (prices, stock, discounts, consent) | `src/lib/ai/compliance.ts` |
| Ranking, recommendations, running low, assistant | `src/lib/ai/engine.ts` |
| Routes | `src/app/(app)/api/ca/ai/*` |
| Smart search | `src/lib/search.ts`, `GET /api/search` |
| Admin | Dashboard → AI Control Center; admin panel group *AI Control Center* |
| Tests | `tests/int/ai.compliance.int.spec.ts` |

## Compliance Engine

Policy rules (`ai-policy-rules`, editable): `price_match` (correct), `stock_match` (correct), `discount_valid` (block), `max_discount_percent` (block, default 30),
`consent_required` (block), `no_unknown_products` (block). Each can be switched off or set to **block**, **correct** (replace with the real data) or **log**.
Proposals (a list of products with claims) and answer text (prices and "in stock" claims next to a product name) are both checked. A blocked answer is replaced by a safe message.
Every check is stored in `ai-decisions` with a trace (violations, no personal data).

## Ranking

`score = popularity × w1 + bought-together × w2 + own history × w3`, weights from the active ranking version (global *AI settings*). Own history is used **only** when the customer opted in (`users.aiConsent`).
Sponsored placements multiply the score and are always labelled `sponsored: true`. Out-of-stock products are never recommended. Roll back by switching the active version.

## Privacy

Personal data (order history) is used only after opt-in (Dashboard → Profile). The trace holds no personal data. The assistant receives the shop catalog, never customer data.

## Not built yet

Embeddings / semantic search, a learned ranking model, DeepSeek as a second model, A/B tests, scheduled retraining. The "recommendation job" only checks and records the run.
