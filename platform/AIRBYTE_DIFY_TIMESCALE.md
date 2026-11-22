# CA7 + Airbyte + TimescaleDB + Dify

## 1. CA7 records into TimescaleDB (tested path)
```bash
docker compose --profile platform up -d timescaledb          # TIMESCALE_PASSWORD in .env
CA7_SITE=https://cloud.ca7.io CA7_API_KEY=ca_... \
TIMESCALE_URL=postgres://ca7:<TIMESCALE_PASSWORD>@localhost:5433/ca7_data \
node platform/timescale/sync.mjs                             # run it from cron, for example every 5 minutes
```
It creates the table `ca7_records` (a hypertable on `recorded_at`) from `platform/timescale/init.sql` and copies new records through `GET /api/ca/v1/records`; running it twice never duplicates.
(The compose file does not publish the TimescaleDB port; add `ports: ['5433:5432']` to the `timescaledb` service, or run the script from a container on the same network.)

## 2. Airbyte → TimescaleDB (set up in the Airbyte screen, not tested here)
1. Airbyte (installed by `platform/install.sh airbyte`) → **Destinations → Postgres**: host = your TimescaleDB host, port 5432, database `ca7_data`, user `ca7`, password = `TIMESCALE_PASSWORD`, schema `airbyte`. (TimescaleDB speaks the PostgreSQL protocol, so the Postgres destination works.)
2. **Sources**: your own databases/APIs (PostgreSQL, MySQL, a REST API, CSV, ...). Create a connection source → destination, sync mode "Incremental | Append".
3. In TimescaleDB, turn a landed table into a hypertable when it has a time column: `SELECT create_hypertable('airbyte.my_table', 'created_at', migrate_data => true);`
4. Show it in CA7: add a **Push** or **REST** data source, or let your own job copy the table into CA7 with `POST /api/ca/v1/records`.
Airbyte's exact screens change between versions, so follow its current docs if a field has another name.

## 3. Dify tool for CA7 (import in the Dify screen, not tested here)
Dify → **Tools → Custom → Create custom tool** → paste the contents of `platform/dify/ca7-tool.openapi.json` (change `servers[0].url` to your domain).
Authentication: **API Key**, type **Custom**, header `Authorization`, value `users API-Key <your CA7 key>` (Dashboard → API keys).
Then add the tool to an agent or workflow: the agent can look up products, read your sensor records, store records and create an order with a payment link (`createOrder`).
Every call counts against your pack's monthly API calls.
