'use client'

import React, { useState } from 'react'
import { Download, Send, FileCode2 } from 'lucide-react'
import { Card } from './DashShell'

type Item = { slug: string; label: string; count: number }

export function ExportPanel({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string[]>(items.filter((i) => i.count > 0).map((i) => i.slug))
  const [target, setTarget] = useState('')
  const [auth, setAuth] = useState('')
  const [log, setLog] = useState('')
  const [busy, setBusy] = useState(false)

  const toggle = (slug: string) =>
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]))

  const load = async () => {
    const q = selected.length ? `?collections=${selected.join(',')}` : ''
    const res = await fetch(`/api/ca/export${q}`, { credentials: 'include' })
    if (!res.ok) throw new Error(`Export failed (${res.status})`)
    return res.json()
  }

  const download = async () => {
    setBusy(true)
    try {
      const data = await load()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      a.download = `cerveau-analytique-${data.exportedAt.slice(0, 10)}.json`
      a.click()
      setLog('Downloaded.')
    } catch (e) {
      setLog((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const send = async () => {
    if (!target) return setLog('Enter your server URL first.')
    setBusy(true)
    try {
      const data = await load()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (auth) headers.Authorization = auth
      const res = await fetch(target, { method: 'POST', headers, body: JSON.stringify(data) })
      setLog(`Your server answered ${res.status}.`)
    } catch (e) {
      setLog(`Could not reach your server: ${(e as Error).message}. It must allow CORS from this site.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="1. Choose data">
        <div className="space-y-1.5">
          {items.map((i) => (
            <label key={i.slug} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-white dark:hover:bg-neutral-800">
              <span className="flex items-center gap-2.5">
                <input type="checkbox" checked={selected.includes(i.slug)} onChange={() => toggle(i.slug)} />
                {i.label}
              </span>
              <span className="text-[11px] text-neutral-400">{i.count}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card title="2. Download or send">
          <button
            disabled={busy}
            onClick={download}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-800"
          >
            <Download size={14} /> Download JSON
          </button>

          <p className="mb-1 mt-5 text-[11px] text-neutral-400">Send to your own server (POST, JSON)</p>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="https://my-server.example/ingest"
            className="w-full rounded-lg bg-white px-3 py-2 text-xs outline-none ring-1 ring-neutral-200 focus:ring-neutral-400 dark:bg-neutral-950 dark:ring-neutral-700"
          />
          <input
            value={auth}
            onChange={(e) => setAuth(e.target.value)}
            type="password"
            placeholder="Authorization header (optional)"
            className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-xs outline-none ring-1 ring-neutral-200 focus:ring-neutral-400 dark:bg-neutral-950 dark:ring-neutral-700"
          />
          <button
            disabled={busy}
            onClick={send}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            <Send size={14} /> Send to my server
          </button>
          {log && <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-300">{log}</p>}
        </Card>

        <Card title="Small HTML tool">
          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            One standalone HTML file with your site URL filled in. Open it anywhere, enter your API key, and
            fetch all your data or send it to your own server. No install needed.
          </p>
          <a
            href="/api/ca/tool"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-800"
          >
            <FileCode2 size={14} /> Download sync tool (.html)
          </a>
        </Card>
      </div>
    </div>
  )
}
