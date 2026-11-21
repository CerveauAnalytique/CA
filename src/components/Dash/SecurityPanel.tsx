'use client'

import React, { useCallback, useEffect, useState } from 'react'

type Ev = { id: number; createdAt: string; category: string; level: string; score: number; userId?: string; ipMasked?: string; rules?: string; blocked?: boolean }
type Alert = { id: number; createdAt: string; level: string; summary: string; userId?: string }
type Block = { id: number; subjectType: string; reason: string; until: string; level: string }
type Data = { level24h: Record<string, number>; actions: Record<string, string>; alerts: Alert[]; events: Ev[]; blocks: Block[]; suspended: { id: number; email: string; reason?: string }[]; rules: { key: string; label: string; threshold: number; windowMinutes: number; score: number; override: { enabled?: boolean } | null }[] }

const COLOR: Record<string, string> = { LOW: 'bg-neutral-200 text-neutral-700', MEDIUM: 'bg-amber-100 text-amber-800', HIGH: 'bg-orange-200 text-orange-900', CRITICAL: 'bg-red-200 text-red-900' }
const btn = 'rounded-full border border-neutral-300 px-3 py-1 text-[12px] hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'

export function SecurityPanel() {
  const [d, setD] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [target, setTarget] = useState('')

  const load = useCallback(async () => {
    const r = await fetch('/api/ca/security', { credentials: 'include' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return setErr(j.error || 'Could not load.')
    setD(j)
  }, [])
  useEffect(() => { void load() }, [load])

  async function act(body: Record<string, unknown>) {
    const r = await fetch('/api/ca/security', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    setErr(r.ok ? null : j.error || 'Failed.')
    void load()
  }

  if (err && !d) return <p className="text-sm text-red-600">{err}</p>
  if (!d) return <p className="text-sm text-neutral-500">Loading…</p>
  const card = 'rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900'
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
        Every activity is checked against fixed block rules, 24/7, without an AI service. LOW is logged, MEDIUM flagged, HIGH restricted for a while with an alert, CRITICAL blocked and sessions ended with an alert.
        Accounts are never deleted and money is never touched automatically.
      </p>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((l) => (
          <div key={l} className={card}>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${COLOR[l]}`}>{l}</span>
            <p className="mt-2 text-2xl font-semibold">{d.level24h[l] ?? 0}</p>
            <p className="text-[11px] text-neutral-400">last 24 hours</p>
          </div>
        ))}
      </div>

      <section className={card}>
        <h2 className="mb-3 text-[14px] font-semibold">Open alerts ({d.alerts.length})</h2>
        {d.alerts.length === 0 && <p className="text-sm text-neutral-500">No open alerts.</p>}
        {d.alerts.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 py-3 dark:border-neutral-800">
            <div>
              <span className={`me-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${COLOR[a.level]}`}>{a.level}</span>
              <span className="text-sm">{a.summary}</span>
              <p className="text-[11px] text-neutral-400">{new Date(a.createdAt).toLocaleString('en-GB')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btn} onClick={() => act({ action: 'review', id: a.id, decision: 'confirmed' })}>Confirm</button>
              <button className={btn} onClick={() => act({ action: 'review', id: a.id, decision: 'false_positive' })}>False positive (lift blocks)</button>
              {a.userId && <button className={btn} onClick={() => act({ action: 'suspend', id: a.userId, reason: a.summary })}>Suspend user</button>}
              {a.userId && <button className={btn} onClick={() => act({ action: 'logout', id: a.userId })}>Log out everywhere</button>}
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 text-[14px] font-semibold">Active blocks ({d.blocks.length})</h2>
          {d.blocks.length === 0 && <p className="text-sm text-neutral-500">None.</p>}
          {d.blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 border-t border-neutral-200 py-2 text-sm dark:border-neutral-800">
              <span>{b.subjectType} · {b.reason.slice(0, 60)} · until {new Date(b.until).toLocaleString('en-GB')}</span>
              <button className={btn} onClick={() => act({ action: 'lift_block', id: b.id })}>Lift</button>
            </div>
          ))}
        </section>
        <section className={card}>
          <h2 className="mb-3 text-[14px] font-semibold">Suspended accounts ({d.suspended.length})</h2>
          {d.suspended.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 border-t border-neutral-200 py-2 text-sm dark:border-neutral-800">
              <span>{u.email} {u.reason ? `· ${u.reason.slice(0, 40)}` : ''}</span>
              <button className={btn} onClick={() => act({ action: 'restore', id: u.id })}>Restore</button>
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <input className="w-32 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950" placeholder="User id" value={target} onChange={(e) => setTarget(e.target.value)} />
            <button className={btn} disabled={!target} onClick={() => act({ action: 'suspend', id: target, reason: 'Suspended by an admin' })}>Suspend</button>
            <button className={btn} disabled={!target} onClick={() => act({ action: 'logout', id: target })}>Log out everywhere</button>
          </div>
        </section>
      </div>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Activity log</h2>
          <a className={btn} href="/api/ca/security/export">Export CSV</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-[12.5px]">
            <thead className="text-[11px] text-neutral-400"><tr>{['Time', 'Activity', 'Level', 'Score', 'User', 'Network', 'Rules'].map((h) => <th key={h} className="py-1.5 pe-3 text-start font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {d.events.map((e) => (
                <tr key={e.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-1.5 pe-3">{new Date(e.createdAt).toLocaleString('en-GB')}</td>
                  <td className="pe-3">{e.category}</td>
                  <td className="pe-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${COLOR[e.level]}`}>{e.level}</span></td>
                  <td className="pe-3">{e.score}</td>
                  <td className="pe-3">{e.userId ?? ''}</td>
                  <td className="pe-3">{e.ipMasked ?? ''}</td>
                  <td className="pe-3">{e.rules ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-1 text-[14px] font-semibold">Rules</h2>
        <p className="mb-3 text-xs text-neutral-500">Change score, threshold or window, or switch a rule off, in the admin panel under Security &gt; Rules (key = the rule key).</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-[12.5px]">
            <thead className="text-[11px] text-neutral-400"><tr>{['Key', 'Rule', 'Threshold', 'Window', 'Score', 'On'].map((h) => <th key={h} className="py-1.5 pe-3 text-start font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {d.rules.map((r) => (
                <tr key={r.key} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-1.5 pe-3 font-mono">{r.key}</td><td className="pe-3">{r.label}</td><td className="pe-3">{r.threshold}</td><td className="pe-3">{r.windowMinutes} min</td><td className="pe-3">{r.score}</td><td>{r.override?.enabled === false ? 'off' : 'on'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
