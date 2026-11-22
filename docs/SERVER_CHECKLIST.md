# Server checklist (do this on your server, in this order)

Tick each box. Commands are run in the project folder on the server (needs Docker with the compose plugin and internet).

## 1. First start
- [ ] `cp .env.docker.example .env` and fill in at least `DB_PASSWORD`, `PAYLOAD_SECRET` (64 random characters, never change it later), `CA7_CRON_SECRET`, `PUBLIC_URL`.
- [ ] `docker compose up -d --build` (the first build takes a while).
- [ ] `docker compose ps`: every service must be `running`/`healthy`. If not: `docker compose logs backend` / `web` / `db`.
- [ ] `curl http://localhost/api/ca/health` answers `{"ok":true}`.
- [ ] Open the site, create the first account (it becomes admin), then Dashboard → Settings → Open admin panel.

## 2. Keys in `.env` (then `docker compose up -d`)
- [ ] Mollie: `MOLLIE_API_KEY` (start with a `test_` key), `NEXT_PUBLIC_MOLLIE_ENABLED=true`.
- [ ] Stripe (packs): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOKS_SIGNING_SECRET`.
- [ ] Mail: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_ADDRESS` (password reset, alerts, order mails). Without it mails are only logged.
- [ ] `PUBLIC_URL=https://cloud.ca7.io` (no trailing slash).
- [ ] Test: password reset mail arrives.

## 3. Domains and https
- [ ] DNS: `cloud.ca7.io`, `ca7.io`, `ca7.nl`, `ca7.be` all point to the server.
- [ ] A reverse proxy with https (Caddy, Traefik or the host's load balancer) in front of the `web` service; it must pass the `Host` header.
      Caddy example: `cloud.ca7.io, ca7.io, ca7.nl, ca7.be { reverse_proxy localhost:80 }`
- [ ] `ca7.io/.nl/.be` show only the chat; `cloud.ca7.io` shows the full site (`CA7_CHAT_HOSTS`, `CA7_CLOUD_HOST`).

## 4. Payment webhooks (need the public https address)
- [ ] Mollie: nothing to configure by hand; the app sends `https://cloud.ca7.io/api/payments/mollie/webhooks` with every payment as soon as `PUBLIC_URL` is https.
- [ ] Stripe, Dashboard → Developers → Webhooks → add endpoints `https://cloud.ca7.io/api/payments/stripe/webhooks` and `https://cloud.ca7.io/api/ca/billing/webhook`; copy the signing secret into `STRIPE_WEBHOOKS_SIGNING_SECRET`.
- [ ] Test with a Mollie test payment and a Stripe test subscription; the order / pack must change status by itself.

## 5. Shop
- [ ] Admin panel → Products: add real products with photos, price (USD cents in the field), stock.
- [ ] Remove the demo products (or leave `CA7_DEMO_SHOP` empty on a real shop).
- [ ] Place one test order with a Mollie test card and check the order mail and the order under Dashboard.

## 6. AI model (optional)
- [ ] Server with at least 4 GB free RAM (8 GB for `qwen2.5:7b`).
- [ ] `docker compose --profile ai up -d`, then `docker compose logs -f ollama-setup` until it says success.
- [ ] `curl https://cloud.ca7.io/api/ca/ai/status` shows `{"installed":true,...}`.

## 7. Platform tools (optional)
- [ ] `bash platform/install.sh all` (or one of: timescale, thingsboard, openremote, dify, airbyte). Passwords are saved in `platform/vendor/passwords.txt` (keep it private).
- [ ] Put the tool addresses in `.env` (`OPENREMOTE_URL`, `DIFY_URL`, `AIRBYTE_URL`, `THINGSBOARD_URL`) and set up single sign-on as in `platform/SSO.md`.

## 8. Before real customers
- [ ] Backups: `docker compose exec db pg_dump -U ca7 ca7 > backup.sql` daily, plus the volume `media`.
- [ ] Set `SECURITY_ALERT_EMAIL` and `SUPPORT_EMAIL`.
- [ ] Check the scheduler works: `docker compose logs scheduler`.
- [ ] Switch Mollie and Stripe from test to live keys.
