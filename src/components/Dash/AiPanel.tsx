'use client'

import React, { useCallback, useEffect, useState } from 'react'

type D = {
  kpi: { total: number; allowed: number; corrected: number; blocked: number }
  decisions: { id: number; createdAt: string; feature: string; decision: string; violations: number; trace?: { violations?: { detail: string }[] } }[]
  sponsored: { id: number; label: string; active: boolean; product: { title?: string } | number }[]
  flags: Record<string, boolean>
  versions: { version: string; popularity: number; coPurchase: number; personal: number; note?: string }[]
  activeVersion: string
  policy: { key: string; enabled: boolean; action: string; value?: number | null }[]
  job: { at?: string; status?: string }
}

const btn = 'rounded-full border border-neutral-300 px-3 py-1 text-[12px] hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
const card = 'rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900'
const DEC: Record<string, string> = { allowed: 'bg-green-100 text-green-800', corrected: 'bg-amber-100 text-amber-800', blocked: 'bg-red-100 text-red-800' }
const FLAGS: [string, string][] = [['assistant', 'AI shopping assistant'], ['recommendations', 'Recommendations'], ['offers', 'Personal offers'], ['runningLow', '"Running low?" suggestions'], ['smartSearch', 'Smart search']]

export function AiPanel() {
  const [d, setD] = useState<D | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const load = useCallback(async () => {
    const r = await fetch('/api/ca/ai/admin', { credentials: 'include' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return setErr(j.error || 'Could not load.')
    setD(j)
  }, [])
  useEffect(() => { void load() }, [load])
  async function act(body: Record<string, unknown>) {
    const r = await fetch('/api/ca/ai/admin', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setErr(r.ok ? null : 'Failed.')
    void load()
  }
  if (err && !d) return <p className="text-sm text-red-600">{err}</p>
  if (!d) return <p className="text-sm text-neutral-500">Loading…</p>
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
        Smart search, recommendations, offers, &quot;running low?&quot; and the AI assistant. The Compliance Engine checks everything the AI wants to show against the real prices, stock, discounts and the customer&apos;s consent, and blocks or corrects what does not match.
        Personal data is only used after the customer opts in.
      </p>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([['Checked (7 days)', d.kpi.total], ['Allowed', d.kpi.allowed], ['Corrected', d.kpi.corrected], ['Blocked', d.kpi.blocked]] as const).map(([l, v]) => (
          <div key={l} className={card}><p className="text-[11px] text-neutral-400">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 text-[14px] font-semibold">Feature flags</h2>
          {FLAGS.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between border-t border-neutral-200 py-2 text-sm dark:border-neutral-800">
              {label}
              <input type="checkbox" checked={d.flags[k] !== false} onChange={(e) => act({ action: 'flag', name: k, value: e.target.checked })} />
            </label>
          ))}
        </section>
        <section className={card}>
          <h2 className="mb-3 text-[14px] font-semibold">Ranking model versions</h2>
          {d.versions.map((v) => (
            <div key={v.version} className="flex items-center justify-between gap-2 border-t border-neutral-200 py-2 text-sm dark:border-neutral-800">
              <span>{v.version} {v.note ? `· ${v.note}` : ''} <span className="text-[11px] text-neutral-400">(popularity {v.popularity}, together {v.coPurchase}, personal {v.personal})</span></span>
              {d.activeVersion === v.version ? <span className="text-[12px] font-medium text-green-700">Active</span> : <button className={btn} onClick={() => act({ action: 'version', version: v.version })}>Switch / roll back</button>}
            </div>
          ))}
          <p className="mt-3 text-xs text-neutral-500">Add a version in the admin panel (Globals &gt; AI settings), then switch to it here. Switching back to an older version is the rollback.</p>
        </section>
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold">Recommendation job</h2>
          <button className={btn} onClick={() => act({ action: 'job' })}>Run now</button>
        </div>
        <p className="mt-2 text-sm text-neutral-500">{d.job.at ? `Last run ${new Date(d.job.at).toLocaleString('en-GB')}: ${d.job.status}` : 'Not run yet.'}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 text-[14px] font-semibold">Policy rules</h2>
          {d.policy.map((p) => (
            <div key={p.key} className="flex items-center justify-between border-t border-neutral-200 py-2 text-sm dark:border-neutral-800">
              <span className="font-mono text-[12px]">{p.key}</span>
              <span className="text-[12px] text-neutral-500">{p.enabled ? p.action : 'off'}{p.value != null ? ` · ${p.value}` : ''}</span>
            </div>
          ))}
          <p className="mt-3 text-xs text-neutral-500">Change them in the admin panel under AI Control Center &gt; Policy rules (key, on/off, block / correct / log, value).</p>
        </section>
        <section className={card}>
          <h2 className="mb-3 text-[14px] font-semibold">Sponsored placements</h2>
          {d.sponsored.length === 0 && <p className="text-sm text-neutral-500">None. Add them in the admin panel. Customers always see them labelled &quot;Sponsored&quot;.</p>}
          {d.sponsored.map((s) => (<div key={s.id} className="border-t border-neutral-200 py-2 text-sm dark:border-neutral-800">{s.label} · {typeof s.product === 'object' ? s.product.title : s.product} · {s.active ? 'active' : 'off'}</div>))}
        </section>
      </div>

      <section className={card}>
        <h2 className="mb-3 text-[14px] font-semibold">Compliance decisions and traces</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-start text-[12.5px]">
            <thead className="text-[11px] text-neutral-400"><tr>{['Time', 'Feature', 'Decision', 'Violations', 'Detail'].map((h) => <th key={h} className="py-1.5 pe-3 text-start font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {d.decisions.map((x) => (
                <tr key={x.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-1.5 pe-3">{new Date(x.createdAt).toLocaleString('en-GB')}</td>
                  <td className="pe-3">{x.feature}</td>
                  <td className="pe-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${DEC[x.decision]}`}>{x.decision}</span></td>
                  <td className="pe-3">{x.violations}</td>
                  <td className="pe-3">{x.trace?.violations?.map((v) => v.detail).join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-neutral-500">The audit log of admin changes is in Security &gt; Activity log (admin_ai_action, admin_change).</p>
      </section>
    </div>
  )
}
