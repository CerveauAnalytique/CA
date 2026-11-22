# What is still open

Done and tested: packs + limits, Data Connect/Intelligence/Automation/Camera, platform tools + SSO, Flutter app, shop, support center, security monitoring, AI + compliance, API gateway `/api/ca/v1`, Docker files, videos.

## Must be done on your server (could not be done in the build environment)
Step by step with commands: `docs/SERVER_CHECKLIST.md`.
1. `docker compose up -d --build` once and read the logs: the images were never built here (no Docker).
2. Set real keys in `.env`: Mollie, Stripe (if used), SMTP, `PUBLIC_URL`, domains `cloud.ca7.io`, `ca7.io`, `ca7.nl`, `ca7.be` with HTTPS and DNS.
3. AI model: `docker compose --profile ai up -d` (builds the Qwen "ca7" model; needs internet and 4 GB+ RAM). Until then the assistant answers from the catalog.
4. Install the platform tools (OpenRemote, Dify, Airbyte, ThingsBoard) with `platform/install.sh` on a server with Docker.
5. Real shop content: products with photos, prices, stock (admin panel), and test one Mollie payment end to end with a test key.
6. Payment webhooks (Mollie, Stripe) need the public https address.

## Not built yet (ask when you want them)
- Create orders through the API gateway (money only flows through the checkout now).
- Stripe card checkout inside the app for pack subscriptions (packs are paid through the Stripe link; shop through Mollie).
- Cookie consent saved per account.
- Airbyte → TimescaleDB pipeline and a Dify tool that calls the CA7 API.
- Real camera detection model in the desktop agent (the agent sends counts; model choice per camera is open).
- Mobile apps: Android/iOS builds are not made yet (the Flutter code supports them).
- A narrated version of the videos (the videos are silent with captions).

## Videos (docs/video)
- `ca7-overview.mp4`: animated explanation of how CA7 works and what exists.
- `ca7-site-tour.mp4`: recording of the real site: home, pricing, shop, support, login, dashboard with data, API gateway.
