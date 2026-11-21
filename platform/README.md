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
- **No single sign-on yet:** every tool has its own login. Change all default passwords right away.
- **OpenRemote and ThingsBoard overlap** (both manage IoT devices). Choose OpenRemote for tenants, users and rules; use ThingsBoard
  when you want ready-made dashboards. Running both is possible but doubles the maintenance.
- **Not connected to the CA7 data yet:** Airbyte, Dify and the IoT tools do not yet write into or read from the CA7 data sources
  (Data Connect). Next steps: an Airbyte destination into TimescaleDB, a Dify tool that reads CA7 data, OpenRemote data sent to `/api/ca/ingest`.
- Put every tool behind HTTPS and a firewall; do not expose them to the internet without a reverse proxy and strong passwords.
