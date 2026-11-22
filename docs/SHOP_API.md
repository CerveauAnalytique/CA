# Shop and API gateway

## Demo shop
`CA7_DEMO_SHOP=1` (in `.env`) puts five demo products in an **empty** shop when the backend starts (no images needed).
Or run it once by hand: `pnpm tsx scripts/seed-shop.ts`. Real products: admin panel → Products.
The shop in the app: `/en/shop` → product → cart → checkout (card via Mollie; orders show under Dashboard → Orders).

## API gateway: `/api/ca/v1`
One address for your shop, data and account. Create a key in **Dashboard → API**, then:

```bash
curl https://YOUR-DOMAIN/api/ca/v1/me -H "Authorization: users API-Key <key>"
```

| Method | Path | Does |
|---|---|---|
| GET | `/api/ca/v1` | Lists the endpoints (no key needed) |
| GET | `/me` | Your pack, limits and usage this month |
| GET | `/products?q=&limit=&page=` | Shop products |
| GET | `/products/{slug}` | One product with description and images |
| GET | `/orders` | Your own orders |
| GET | `/sources` | Your data sources |
| GET | `/records?source=&since=&limit=&page=` | Your records, newest first |
| POST | `/records` | `{"source": 1, "records": [{...}]}` (max 1000 per call) |

Every call counts against the monthly API calls of your pack (402 when used up); a missing or wrong key gives 401 and is logged by the security monitoring.
Records can only be written to your own sources and respect the storage limit. The Dashboard → API page has a **Run** button per endpoint.
Tests: `tests/int/gateway.int.spec.ts`.
