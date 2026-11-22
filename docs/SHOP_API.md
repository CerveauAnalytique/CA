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
| POST | `/orders` | `{"items":[{"product":1,"quantity":2}],"billingAddress":{...}}`: checks price and stock, makes a cart, starts a Mollie payment and returns `checkoutUrl`. The order exists once the customer has paid; then it shows under `GET /orders` |
| GET | `/sources` | Your data sources |
| GET | `/records?source=&since=&limit=&page=` | Your records, newest first |
| POST | `/records` | `{"source": 1, "records": [{...}]}` (max 1000 per call) |

Every call counts against the monthly API calls of your pack (402 when used up); a missing or wrong key gives 401 and is logged by the security monitoring.
Records can only be written to your own sources and respect the storage limit. The Dashboard → API page has a **Run** button per endpoint.
Tests: `tests/int/gateway.int.spec.ts`.

## Paying by card with Stripe in the app
Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOKS_SIGNING_SECRET`. The checkout then shows a second button "Pay by card (Stripe)" (`GET /api/ca/shop` tells the app which methods are on).
The app starts the payment (`/api/payments/stripe/initiate`) and opens the card form `/api/ca/stripe/pay` (Stripe's Payment Element; card data goes straight to Stripe); Stripe returns the shopper to `/checkout/confirm-order?provider=stripe`, where the app confirms the order.
Tested here without Stripe (form, escaping, redirect address); a real card payment needs your Stripe test keys (card 4242 4242 4242 4242).

## Cookie choice
The banner offers Accept all / Only necessary / Choose. The choice is kept on the device and, when logged in, saved on the account (`POST /api/ca/cookies`) so it follows the customer; Dashboard → Settings changes it.
