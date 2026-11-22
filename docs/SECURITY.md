# Security monitoring

The site checks every activity against fixed block rules, 24/7. The rules are plain counters over the activity log (no AI service),
so they keep working when an AI service is unavailable. Code: `src/lib/security/` (rules in `config.ts`, engine in `engine.ts`, hooks in `plugin.ts`),
tests in `tests/int/security.engine.int.spec.ts`.

| Risk | Score | What happens |
|---|---|---|
| LOW | 0–29 | Logged |
| MEDIUM | 30–59 | Flagged for review |
| HIGH | 60–79 | The operation is restricted for a while (30 min), admin alerted |
| CRITICAL | 80–100 | Request blocked, the user's sessions ended, restricted for 24 h, admin alerted |

Accounts are never deleted and money is never touched automatically.

## What is detected

| Rule key | Detects | Default |
|---|---|---|
| `brute_force` | 5 failed logins from one network in 10 min | 70 |
| `credential_stuffing` | 5 different e-mails from one network in 10 min | 85 |
| `bot_scraping` | 5 rate-limited requests (chat, support, ...) in 10 min | 45 |
| `unauthorized_api` | 5 unauthorized API calls (wrong token or key) in 10 min | 65 |
| `privilege_escalation` | A customer sends `roles`, `plan`, `suspended`, ... or edits another account | 90 |
| `price_manipulation` | An order whose amount is not the sum of the real product prices | 90 |
| `fake_order_burst` | 5 orders in 10 min | 65 |
| `failed_payments` | 3 failed payments in 30 min | 60 |
| `many_networks` | Logins from 4 different networks in 24 h | 55 |
| `admin_mass_delete` | An admin deletes 10 records in 10 min | 85 |

Not applicable: *return abuse* (the shop has no returns yet). Logins, logouts, sign-ups, profile changes and every admin change and deletion are logged.
A rule about one account blocks that account only; a rule about a network blocks the network. A false positive lifts what its alert blocked.
Local server code (billing webhooks, scripts) uses `overrideAccess` and is not treated as a customer request.

## Admin

- **Dashboard → Security** (`/dashboard/security`, admins only): open alerts, active blocks, suspended accounts, the activity log, review (confirm / false positive),
  suspend and restore, log a user out everywhere, lift blocks, and export the audit log as CSV (`/api/ca/security/export`).
- **Admin panel → Security** (collections): Activity log, Alerts, Blocks, and **Rules** (a row with the key of a built-in rule changes its score, threshold or window, or switches it off).
- A suspended account cannot log in and its sessions stop working at once.

## Privacy (GDPR)

IP addresses are stored as a keyed hash (to count) plus a masked version (`192.168.1.0`). E-mails in evidence are masked; passwords, tokens and payment data are never stored.
Events are deleted after `SECURITY_RETENTION_DAYS` (default 180). Only admins can read the data. The site sends `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

## Availability and alerts

- `GET /api/ca/health` answers 200 when the database works (open alerts and events of the last hour in the body). Call it every 5 minutes from a scheduler.
- `POST /api/ca/security/cleanup` with `Authorization: Bearer $CA7_CRON_SECRET` removes old events and expired blocks. Call it daily.
- Alerts are written to `storage/logs/security.log` and e-mailed when `SECURITY_ALERT_EMAIL` and `SMTP_HOST` are set.
- Example (cron): `*/5 * * * * curl -fsS https://cloud.ca7.io/api/ca/health` and `10 3 * * * curl -fsS -X POST -H "Authorization: Bearer $CA7_CRON_SECRET" https://cloud.ca7.io/api/ca/security/cleanup`.
  Restarting the app after a crash is the job of your process manager (systemd, Docker `restart: unless-stopped`).

## Limits (honest)

- Rate counters of the chat and support routes are in memory per server instance; the security counters are in the database and shared.
- Plain HTTP requests to Payload's REST API are checked for login, privilege escalation and orders; general API scraping is only seen on the `/api/ca/*` routes that report to the engine.
- Not tested against real attack traffic: tested with the unit and integration tests, and by hand (brute force, escalation, suspension).

Tests: `pnpm test:int`.
