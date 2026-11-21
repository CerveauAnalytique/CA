'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export type SourceRow = {
  id: string | number
  name: string
  type: 'rest' | 'csv' | 'push' | 'camera'
  url?: string | null
  ingestToken?: string | null
  lastSyncAt?: string | null
  lastError?: string | null
  recordCount?: number | null
}

const TYPES = [
  { v: 'rest', l: 'REST API' },
  { v: 'csv', l: 'CSV file' },
  { v: 'push', l: 'Push (IoT, MQTT bridge, scripts)' },
  { v: 'camera', l: 'Camera (desktop agent)' },
]

const input = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950'
const btn = 'rounded-full border border-neutral-300 px-4 py-1.5 text-[13px] font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
const btnPrimary = 'rounded-full bg-neutral-900 px-4 py-1.5 text-[13px] font-medium text-white dark:bg-white dark:text-neutral-900'

async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...init })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || json?.errors?.[0]?.message || `Error ${res.status}`)
  return json
}

export function ConnectPanel({ sources, base, defaultType }: { sources: SourceRow[]; base: string; defaultType?: string }) {
  const router = useRouter()
  const [type, setType] = useState(defaultType || 'rest')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState('')
  const [path, setPath] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true)
    setMsg(null)
    try {
      const r = (await fn()) as { stored?: number }
      setMsg(ok ?? (r?.stored != null ? `${r.stored} records saved.` : 'Done.'))
      router.refresh()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    let parsedHeaders: unknown
    if (headers.trim()) {
      try { parsedHeaders = JSON.parse(headers) } catch { return setMsg('Headers must be JSON, e.g. {"Authorization":"Bearer ..."}') }
    }
    await run(async () => {
      await call('/api/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, url: url || undefined, headers: parsedHeaders, recordsPath: path || undefined }),
      })
      setName(''); setUrl(''); setHeaders(''); setPath('')
    }, 'Data source added.')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="space-y-3 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
        <h2 className="text-[14px] font-semibold">Add a data source</h2>
        <select className={input} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
        <input className={input} required placeholder="Name, e.g. Warehouse sensors" value={name} onChange={(e) => setName(e.target.value)} />
        {type === 'rest' && (
          <>
            <input className={input} required type="url" placeholder="https://api.example.com/readings" value={url} onChange={(e) => setUrl(e.target.value)} />
            <input className={input} placeholder="Where the list is, e.g. data.items (optional)" value={path} onChange={(e) => setPath(e.target.value)} />
            <input className={input} placeholder='Headers as JSON (optional)' value={headers} onChange={(e) => setHeaders(e.target.value)} />
          </>
        )}
        <button disabled={busy} className={btnPrimary}>Add source</button>
        {msg && <p className="text-xs text-neutral-600 dark:text-neutral-300" role="status">{msg}</p>}
      </form>

      <div className="min-w-0 space-y-3">
        {sources.length === 0 && <p className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500 dark:bg-neutral-900">No data sources yet. Add your first one.</p>}
        {sources.map((s) => (
          <section key={s.id} className="rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-semibold">{s.name}</h3>
                <p className="text-xs text-neutral-500">
                  {TYPES.find((t) => t.v === s.type)?.l} · {(s.recordCount ?? 0).toLocaleString('en-US')} records
                  {s.lastSyncAt ? ` · last data ${new Date(s.lastSyncAt).toLocaleString('en-GB')}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.type === 'rest' && <button disabled={busy} className={btn} onClick={() => run(() => call(`/api/ca/sources/${s.id}/sync`, { method: 'POST' }))}>Sync now</button>}
                {s.type === 'csv' && (
                  <label className={`${btn} cursor-pointer`}>
                    Upload CSV
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) run(async () => call(`/api/ca/sources/${s.id}/csv`, { method: 'POST', body: await f.text() }))
                      e.target.value = ''
                    }} />
                  </label>
                )}
                <button disabled={busy} className={btn} onClick={() => confirm(`Delete ${s.name}?`) && run(() => call(`/api/data-sources/${s.id}`, { method: 'DELETE' }), 'Deleted.')}>Delete</button>
              </div>
            </div>
            {s.lastError && <p className="mt-2 text-xs text-red-600">{s.lastError}</p>}
            {(s.type === 'push' || s.type === 'camera') && s.ingestToken && (
              <pre className="mt-3 overflow-x-auto rounded-xl bg-neutral-900 p-3 text-[11.5px] text-neutral-200">{`curl -X POST ${base}/api/ca/ingest \\
  -H "X-CA7-Token: ${s.ingestToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"records":[{"temperature":21.5,"humidity":48}]}'`}</pre>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
