#!/usr/bin/env node
// Copies your CA7 records into TimescaleDB through the CA7 API gateway (/api/ca/v1/records). Safe to run again and again:
// records that are already there are skipped. Run it from cron or after your data sources synced.
//   CA7_SITE=https://cloud.ca7.io CA7_API_KEY=ca_... TIMESCALE_URL=postgres://ca7:pw@localhost:5433/ca7_data node platform/timescale/sync.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const site = (process.env.CA7_SITE || 'http://localhost:3000').replace(/\/$/, '')
const key = process.env.CA7_API_KEY
const url = process.env.TIMESCALE_URL
if (!key || !url) { console.error('Set CA7_API_KEY and TIMESCALE_URL.'); process.exit(1) }

const db = new pg.Client({ connectionString: url })
await db.connect()
await db.query(readFileSync(fileURLToPath(new URL('./init.sql', import.meta.url)), 'utf8'))
const last = (await db.query('SELECT max(recorded_at) AS t FROM ca7_records')).rows[0].t
let since = last ? `&since=${encodeURIComponent(new Date(last).toISOString())}` : ''
let page = 1, copied = 0, totalPages = 1
do {
  const res = await fetch(`${site}/api/ca/v1/records?limit=1000&page=${page}${since}`, { headers: { Authorization: `users API-Key ${key}` } })
  if (!res.ok) { console.error('CA7 answered', res.status, await res.text()); process.exit(1) }
  const body = await res.json()
  totalPages = body.totalPages || 1
  for (const r of body.records) {
    const out = await db.query('INSERT INTO ca7_records (id, source, recorded_at, data) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [r.id, r.source, r.recordedAt, r.data])
    copied += out.rowCount ?? 0
  }
  page++
} while (page <= totalPages)
console.log(`Copied ${copied} new records.`)
await db.end()
