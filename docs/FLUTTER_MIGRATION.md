# Front end: Flutter. Backend: Next.js

**Decision: the front end is Flutter; Next.js is only the backend** (API, admin panel, database). The Next.js pages and React components were removed;
`src/proxy.ts` sends any page address to the app (`CA7_APP_URL`). The text below is the history of the migration and the list of what the app still lacks.

The Next.js site is the reference. The Flutter app (`flutter_app/`) reproduces its design and logic and talks to the **same
backend** (Payload + the `/api/ca/*` routes). The Next.js pages are removed; the backend keeps the API and `/admin`.

## Honest status

The migration is **partial**. 57 pages and about 110 components existed; the pages below are done and verified in a browser
against the running backend. The rest is listed so nothing is forgotten. Pages that are not migrated open the website page
(the app shows "This page is not in the app yet" with a button), so nothing is a dead end.

### Done (Flutter)

| Area | Pages / parts | Notes |
|---|---|---|
| Shell | Header (nav, Explore menu, smart search, cart, user, theme, language), mobile menu, footer, languages | `lib/app/shell` |
| Home, Pricing | Hero with the dot camera, sections; 5 packs | `features/home`, `features/pricing` |
| Auth | Login, create account, forgot password, remembered session | `features/auth`, token in secure storage |
| Chat | `/chat-ca7` with streaming answers | `features/chat` |
| Catalog | AI models and datasets: list, search, filter, detail | `features/catalog` |
| Dashboard | Overview, Profile, Data Connect, Data Intelligence, Automation, Camera, API keys, Export, Pack & billing, Platform | `features/dashboard` |
| **Shop** | Products (search, category, sort), product page with variants, cart (guest and account), checkout with Mollie (iDEAL, Bancontact, cards), return page that confirms the order, orders, order page (also for guests with the link token), find order, saved addresses | `features/shop`; tested against a fake Mollie server: initiate, unpaid is refused, paid creates the order and lowers the stock |
| **Content from the database** | About, careers, press, community, contact, status, sdks, api, research, security, privacy, terms, cookies and the docs pages come from the collection `site-pages`; CMS pages from `pages` (Lexical rich text, hero, content, call to action, banner, media); blog from `posts` | `features/content/cms.dart`; edit all of it in the admin panel |
| **Smart search** | One search over products, pages, docs, research, blog, AI models and datasets, from the database; every word must match, typos are allowed, best match first, "did you mean" | `src/lib/search.ts`, `GET /api/search`, used by the website and the app |

### Not migrated yet

- **Stripe card payments** in the app (Stripe's card form needs its own mobile/web component and a live key). In the app, card payments go through Mollie, which also takes cards. The website still has the Stripe checkout.
- The layout blocks `archive`, `carousel`, `three-item-grid` and `form` of CMS pages (the app says the block is shown on the website).
- The rich layout of some content pages (status badges, the contact form, the interactive docs sidebar): the app shows their text, lists, code and cards, which is what the database holds.
- Order e-mails, product reviews and other plugin features that were never in the front end.
- `/admin` (Payload) stays on the web by design.

### Differences from the website (on purpose or not done)

- The bell icon links to `/notifications`, like the website does; that page does not exist there either.
- Prices are in USD, as in the shop data (the shop has one currency).
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

1. Stripe card checkout in the app, and a cookie consent banner with the choices stored per account.
2. The remaining CMS layout blocks and the docs sidebar.
3. Integration tests on a device, and a visual comparison of dark mode and RTL.
4. When everything is verified: serve the Flutter build instead of the Next.js pages and remove the replaced Next.js pages one by one.


## After the switch (what is true now)

- Deploy: backend at its own address (for example `api.ca7.io`), Flutter web build (`flutter build web --release --no-web-resources-cdn --dart-define=CA7_API=https://api.ca7.io`) on `cloud.ca7.io`, `ca7.io`, `ca7.nl`, `ca7.be`.
  Set `CA7_APP_URL` (the app: redirects, e-mail links, Mollie return) and `CA7_APP_ORIGINS` (CORS) on the backend. ca7.io/.nl/.be show only the chat (the app does this, `Env.chatHosts`).
- Added to the app in this step: Security dashboard and AI Control Center (admins), OpenRemote and ThingsBoard sources, personal AI consent, reset-password page (the e-mail link opens it).
- **Still missing in the app:** Stripe card payments (Mollie works); screens for the AI shopping assistant, recommendations and offers (the backend routes exist); the CMS blocks archive, carousel, three-item grid and form.
- **Single sign-on to ThingsBoard/OpenRemote** needs a browser login cookie on the backend address; the app logs in with a token. The OIDC routes exist, but connecting the app's login to them is not built.
- The Next.js e2e tests were removed with the pages; the Flutter tests (`flutter test`) and the backend tests (`pnpm test:int`) remain.
