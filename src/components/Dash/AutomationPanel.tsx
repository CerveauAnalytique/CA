'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Rule = { id: string | number; name: string; sourceName: string; field: string; operator: string; threshold?: number | null; action: string; target: string; enabled: boolean; triggerCount?: number | null; lastTriggeredAt?: string | null }
type Src = { id: string | number; name: string }

const input = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950'
const OPS: Record<string, string> = { gt: '>', lt: '<', eq: '=', anomaly: 'is unusual' }

export function AutomationPanel({ rules, sources, allowed }: { rules: Rule[]; sources: Src[]; allowed: boolean }) {
  const router = useRouter()
  const [f, setF] = useState({ name: '', source: sources[0]?.id ?? '', field: '', operator: 'gt', threshold: '', action: 'email', target: '' })
  const [msg, setMsg] = useState<string | null>(null)

  async function api(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.errors?.[0]?.message || json?.error || `Error ${res.status}`)
  }
  async function create(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api('/api/automations', 'POST', { ...f, threshold: f.threshold === '' ? undefined : Number(f.threshold) })
      setMsg('Automation added.'); router.refresh()
    } catch (err) { setMsg((err as Error).message) }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="space-y-3 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
        <h2 className="text-[14px] font-semibold">New automation</h2>
        {!allowed && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">Automation is part of the Business pack. <a href="/pricing" className="underline">See packs</a></p>}
        <input className={input} required placeholder="Name, e.g. Freezer too warm" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select className={input} value={String(f.source)} onChange={(e) => setF({ ...f, source: e.target.value })} aria-label="Data source">
          {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className={input} required placeholder="Field, e.g. temperature" value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })} />
        <div className="flex gap-2">
          <select className={input} value={f.operator} onChange={(e) => setF({ ...f, operator: e.target.value })} aria-label="Condition">
            <option value="gt">greater than</option><option value="lt">less than</option><option value="eq">equals</option><option value="anomaly">unusual value</option>
          </select>
          {f.operator !== 'anomaly' && <input className={input} type="number" step="any" placeholder="Value" value={f.threshold} onChange={(e) => setF({ ...f, threshold: e.target.value })} />}
        </div>
        <select className={input} value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} aria-label="Action">
          <option value="email">Send e-mail</option><option value="webhook">Call a webhook</option>
        </select>
        <input className={input} required placeholder={f.action === 'email' ? 'name@company.com' : 'https://...'} value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} />
        <button disabled={!sources.length} className="rounded-full bg-neutral-900 px-4 py-1.5 text-[13px] font-medium text-white dark:bg-white dark:text-neutral-900">Add automation</button>
        {!sources.length && <p className="text-xs text-neutral-500">Connect a data source first.</p>}
        {msg && <p className="text-xs" role="status">{msg}</p>}
      </form>
      <div className="space-y-3">
        {rules.length === 0 && <p className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500 dark:bg-neutral-900">No automations yet. They run when new data arrives.</p>}
        {rules.map((r) => (
          <section key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
            <div>
              <h3 className="text-[14px] font-semibold">{r.name}</h3>
              <p className="text-xs text-neutral-500">
                When {r.field} in {r.sourceName} {OPS[r.operator]} {r.operator !== 'anomaly' ? r.threshold : ''} → {r.action === 'email' ? 'e-mail' : 'webhook'} {r.target}
              </p>
              <p className="text-xs text-neutral-400">Triggered {r.triggerCount ?? 0} times{r.lastTriggeredAt ? `, last ${new Date(r.lastTriggeredAt).toLocaleString('en-GB')}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-full border border-neutral-300 px-4 py-1.5 text-[13px] dark:border-neutral-700" onClick={async () => { await api(`/api/automations/${r.id}`, 'PATCH', { enabled: !r.enabled }); router.refresh() }}>{r.enabled ? 'Pause' : 'Resume'}</button>
              <button className="rounded-full border border-neutral-300 px-4 py-1.5 text-[13px] dark:border-neutral-700" onClick={async () => { if (confirm('Delete?')) { await api(`/api/automations/${r.id}`, 'DELETE'); router.refresh() } }}>Delete</button>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
