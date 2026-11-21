# CA7 platform

CA7 is the front: your own frontend, API, branding and billing (this website). These open-source tools do the work behind it.

| Tool | Does | Port | Source |
|---|---|---|---|
| OpenRemote | IoT, devices, tenants, users, rules | 443 | https://github.com/openremote/openremote |
| Dify | AI workflows, agents, RAG | 8081 | https://github.com/langgenius/dify |
| Airbyte | Connectors, sync, data pipelines | 8000 | https://github.com/airbytehq/airbyte (installed with `abctl`) |
| ThingsBoard | IoT dashboards, telemetry | 8085 | https://github.com/thingsboard/thingsboard |
| TimescaleDB | Business data and storage (PostgreSQL) | 5433 | https://github.com/timescale/timescaledb |

## Install

```bash
export TIMESCALE_PASSWORD='choose-a-long-password'
bash platform/install.sh all          # or one of: timescale | thingsboard | openremote | dify | airbyte
```

The script downloads the tools to `platform/vendor/` (not stored in git) and starts them the way each project documents.
Needs Docker with the compose plugin; it needs about 8 GB of free memory for all of them together.
Then set the addresses in the CA7 environment (`.env.example`): `OPENREMOTE_URL`, `DIFY_URL`, `AIRBYTE_URL`, `THINGSBOARD_URL`.
The page **Dashboard → Platform** (Enterprise pack and admins) shows whether each tool answers and opens it.

## Status (honest)

- **Not tested:** this setup was written without a Docker daemon available, so the install script has not been run. Run it on a
  server with Docker and check each tool's own documentation for changes.
- **Passwords:** `install.sh` replaces the default passwords of ThingsBoard, OpenRemote and Airbyte with generated ones (written to `platform/vendor/passwords.txt`). Not run here, so check the result. Dify has no default password.
- **Single sign-on:** one CA7 account can open ThingsBoard and OpenRemote (OpenID Connect), see [SSO.md](SSO.md). Dify and Airbyte (open source) have no OIDC login.
- **OpenRemote and ThingsBoard overlap** (both manage IoT devices). Choose OpenRemote for tenants, users and rules; use ThingsBoard
  when you want ready-made dashboards. Running both is possible but doubles the maintenance.
- **Data connected (first part):** OpenRemote and ThingsBoard are Data Connect sources (Enterprise/admin): CA7 pulls the latest values and stores them; use "Sync now" or call `POST /api/ca/sync` (header `Authorization: Bearer $CA7_CRON_SECRET`) every few minutes from a scheduler. Pulled and tested only against a fake server.
  Still open: Airbyte into TimescaleDB, a Dify tool that reads CA7 data.
- Put every tool behind HTTPS and a firewall; do not expose them to the internet without a reverse proxy and strong passwords.
