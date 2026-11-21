# Next.js to Flutter migration

The Next.js site is the reference. The Flutter app (`flutter_app/`) reproduces its design and logic and talks to the **same
backend** (Payload + the `/api/ca/*` routes). Nothing of the Next.js app was removed: it still serves the pages that are not
migrated yet, the admin panel (`/admin`) and the API.

## Honest status

The migration is **partial**. 57 pages and about 110 components existed; the pages below are done and verified in a browser
against the running backend. The rest is listed so nothing is forgotten. Pages that are not migrated open the website page
(the app shows "This page is not in the app yet" with a button), so nothing is a dead end.

### Done (Flutter)

| Area | Pages / parts | Notes |
|---|---|---|
| Shell | Header (nav, Explore menu, search ⌘K, user, theme, language), mobile menu, footer, languages | `lib/app/shell` |
| Home | Hero with the dot camera (idle twinkle, scatter, follows the pointer), typing headline, chat box, icon strip, 4 sections | `features/home` |
| Pricing | 5 packs | `features/pricing` (prices mirror `src/lib/plans.ts`) |
| Auth | Login, create account (language), forgot password, remembered session, redirect to the saved language | `features/auth`, token in secure storage |
| Chat | `/chat-ca7` incl. `?q=`, streaming from `/api/ca/chat`, stop, new chat, code blocks | `features/chat` |
| Catalog | AI models and datasets: list, search, filter, detail (install, metrics, schema, card) | `features/catalog` |
| Dashboard | Overview, Profile (name, username, e-mail, language, password), Data Connect (REST, CSV, push), Data Intelligence, Automation, Camera Intelligence, API keys, Export & sync, Pack & billing (Stripe checkout and portal), Platform | `features/dashboard` |
| Legal | Privacy, Terms, Cookies | text exported from the site |

Responsive: desktop, tablet and phone (checked at 1440 and 390 px). Dark mode and RTL (Arabic) are implemented; only light mode
at desktop and phone width was compared against the website.

### Not migrated yet (still on the website)

`about`, `research`, `api`, `docs/*`, `blog` and `blog/[slug]`, `careers`, `press`, `community`, `status`, `sdks`, `security`,
`contact`, `[slug]` (CMS pages), `shop`, `shop/[id]`, `products`, `products/[slug]`, `marketplace`, `cart`, `checkout`,
`checkout/confirm-order`, `orders`, `orders/[id]`, `account`, `account/addresses`, `find-order`, `api-access`.
The shop (ecommerce, cart, checkout with Stripe/Mollie, orders, addresses) is the biggest missing part. The header has no cart
button for that reason. `/admin` (Payload) stays on the web by design.

### Differences from the website (on purpose or not done)

- The bell icon links to `/notifications`, like the website does; that page does not exist there either.
- The CART button of the header is missing (shop not migrated).
- Texts of the dashboard, forgot-password and some labels are English only, as on the website (they were never translated there).
- The hover effects of the Explore menu are click-only.

## Backend contract (unchanged API, two additions)

The app uses only existing endpoints: `/api/users/login|me|logout|forgot-password`, `POST /api/users`, Payload collections
(`ai-models`, `datasets`, `data-sources`, `data-records`, `automations`, `users`), `/api/search`, `/api/ca/chat|export|key|ingest|insights|
billing/*|sources/:id/sync|csv`. Business rules (pack limits, 402 errors, ownership) are enforced by the backend; the app only shows them.

Changes made to the backend, for the app to work from another address:

1. **CORS** for the app's origin: `CA7_APP_ORIGINS` (comma separated). Payload collections use its `cors` option; `/api/ca/*` is
   handled in `src/proxy.ts` (preflight answer + headers). Without the variable nothing changes.
2. **`GET /api/ca/platform`**: status of the platform tools (admins and Enterprise). The web page reads the same data on the server;
   the app cannot, because the tool addresses are server-side environment variables.

Login uses the JWT that Payload returns (`Authorization: JWT <token>`), not the cookie, so it works on every platform.

## How to verify (done for the pages above)

`pnpm dev` (with `CA7_APP_ORIGINS=http://localhost:8080`), `flutter build web --release --no-web-resources-cdn`, serve `build/web`,
and compare page by page with `http://localhost:3000`. `flutter analyze` is clean of errors and warnings; `flutter test` has 9 tests
(API client, auth, i18n, plans and limits, analysis, two widget tests).

## Next steps (in order)

1. Shop: products, product page, cart, checkout (Stripe and Mollie), orders, addresses, find order.
2. Remaining content pages (about, research, docs, api, blog, careers, press, community, status, sdks, security, contact) and the CMS `[slug]` pages.
3. Integration tests on a device, and a visual comparison of dark mode and RTL.
4. When everything is verified: serve the Flutter build instead of the Next.js pages and remove the replaced Next.js pages one by one.
