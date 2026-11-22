# CA7 in Docker

One command starts the whole project: database, backend, website and scheduler.

**Easiest:** `./start-docker.sh` (on a Mac you can also double-click `Start CA7.command`). It makes `.env` with random secrets, builds, starts, waits until the backend answers and opens http://localhost:8080. `./start-docker.sh stop` stops it, `./start-docker.sh logs` shows the logs.
The manual steps:

```bash
cp .env.docker.example .env        # fill in DB_PASSWORD, PAYLOAD_SECRET, PUBLIC_URL, CA7_CRON_SECRET (and mail / payment keys when you have them)
docker compose up -d --build       # the first build takes a while (Node and Flutter are built inside the images)
open http://localhost              # WEB_PORT in .env changes the port
```

The first account you create on the site becomes the admin. The admin panel is hidden: log in, then open **Dashboard → Profile → Open admin panel**
(the private link `/{username}/ad/{token}`), or set `ADMIN_GATE=off` in `.env` while you set things up.

## What runs

| Service | Image | What it does |
|---|---|---|
| `db` | `postgres:16-alpine` | The database. Data in the volume `db-data` |
| `backend` | `Dockerfile` (Next.js + Payload) | API (`/api`), admin panel (`/admin`), security monitoring, AI engine. Runs the migrations on its first start. Media in the volume `media`, the security log in `logs` |
| `web` | `flutter_app/Dockerfile` (Flutter web + nginx) | The website. nginx also forwards `/api`, `/admin`, `/_next`, `/media` and the private admin link to the backend, so site and API share **one address** (no CORS needed). This is the only port that is published |
| `scheduler` | `alpine` | Health check and source sync every 5 minutes, clean-up of old security events daily (needs `CA7_CRON_SECRET`). Errors show in `docker compose logs scheduler` |
| `ollama`, `ollama-setup` | `ollama/ollama` | **Optional** (profile `ai`): the language model for the AI assistant |
| `timescaledb` | `timescale/timescaledb` | **Optional** (profile `platform`): sensor and business data |

All services restart automatically (`restart: unless-stopped`); `db` and `backend` have health checks.

## The AI model (optional)

```bash
docker compose --profile ai up -d      # starts Ollama and builds the "ca7" model on top of CA7_BASE (default qwen2.5:3b, about 2 GB; 7b needs 8 GB RAM)
docker compose logs -f ollama-setup    # wait until it says success
curl http://localhost/api/ca/ai/status # {"installed":true,"mode":"model"}
```

Without it the AI features still work (the assistant answers from the product catalog). Details: `docs/ai/DEPLOYMENT.md`.

## Domains and HTTPS

Put a reverse proxy with HTTPS in front of the `web` service (Caddy, Traefik or your host's load balancer) and set `PUBLIC_URL=https://cloud.ca7.io` in `.env`.
Point `cloud.ca7.io`, `ca7.io`, `ca7.nl` and `ca7.be` at it; `ca7.io/.nl/.be` show only the chat (built into the website, `CA7_CHAT_HOSTS`).
The proxy must pass the `Host` header. With a backend on its own address, set `CA7_API=https://api.ca7.io` and rebuild `web`.

## Everyday commands

```bash
docker compose logs -f backend          # the API and admin
docker compose ps                       # health of every service
docker compose up -d --build            # after a code change
docker compose exec db pg_dump -U ca7 ca7 > backup.sql   # a backup of the database (also back up the volume "media")
docker compose down                     # stop (the data stays in the volumes)
```

## Limits (honest)

- This setup was **written and checked without a Docker daemon** (the build environment has none): `docker compose config` is valid, the backend build and the Flutter web build were run directly,
  and the same-address routing was tried with an equivalent proxy. The images themselves were not built here, so run `docker compose up -d --build` once and watch the logs.
- The database schema is created by the migration for an **empty** database. Do not start the backend on a database made by the development server.
- The tools of `platform/` (OpenRemote, Dify, Airbyte, ThingsBoard) are not part of this compose file; `platform/README.md` explains them.
- Payment webhooks (Stripe, Mollie) need a public https address (`PUBLIC_URL`). In the app, card payments go through Mollie.
