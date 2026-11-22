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

## Built since (see the docs)
- Orders through the API gateway (`POST /api/ca/v1/orders`, payment link) and Stripe card payment in the app: `docs/SHOP_API.md`. Real card payments are untested without your Stripe keys.
- Cookie choice per account (banner + Settings).
- CA7 → TimescaleDB script (tested), Airbyte → TimescaleDB steps and a Dify tool file (not tested): `platform/AIRBYTE_DIFY_TIMESCALE.md`.
- Camera agent with people detection (`desktop/ca7-camera-agent/agent.py`): `docs/` README there for limits.
- Android/iOS: workflow and guide, not built here: `docs/MOBILE.md`.
- Videos with a synthetic voice in English and Dutch (`docs/video/ca7-overview-en.mp4`, `-nl.mp4`); `scripts/make-voice.py` makes them. The voice is robotic (espeak-ng); for a natural voice record your own or use a voice service with the same texts.

## Still open
- Run everything on your server (checklist above), incl. a real Stripe card payment and a real Mollie payment.
- Test the Airbyte and Dify steps in their own screens.
- Try the camera agent on your own cameras (and switch to `--detector yolo` if the built-in detector misses people).
- Build the Android/iOS apps (GitHub workflow) and publish them with your own signing keys.
- Natural voice for the videos.
- Orders by API only support products without variants (variants: use the shop).

## Videos (docs/video)
- `ca7-overview.mp4`: animated explanation of how CA7 works and what exists.
- `ca7-overview-en.mp4` / `ca7-overview-nl.mp4`: the overview with a voice.
- `ca7-site-tour.mp4`: recording of the real site: home, pricing, shop, support, login, dashboard with data, API gateway.
