import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from '@/i18n/client'
import React from 'react'
import { limitsOf } from '@/lib/limits'
import { analyze } from '@/lib/intelligence'

export const metadata = { title: 'Data Intelligence' }

const fmt = (n: number) => (Math.abs(n) >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n.toLocaleString('en-US', { maximumFractionDigits: 2 }))

export default async function IntelligencePage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const detect = limitsOf(user as never).anomalyDetection
  const sources = await payload.find({ collection: 'data-sources', depth: 0, limit: 50, overrideAccess: false, user })

  const blocks = await Promise.all(
    sources.docs.map(async (s) => {
      const r = await payload.find({ collection: 'data-records', where: { source: { equals: s.id } }, sort: '-recordedAt', limit: 1000, depth: 0, overrideAccess: false, user })
      return { s, stats: analyze(r.docs.reverse().map((d) => ({ data: d.data as Record<string, unknown>, at: d.recordedAt ?? undefined })), detect) }
    }),
  )

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
        Statistics and trends per data field, based on the latest 1,000 records of each source.
        {detect ? ' Values that are more than 3 standard deviations away from the average are marked as unusual.' : ' Anomaly detection is part of the Pro pack.'}
      </p>
      {!detect && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Unusual values are not marked on your pack. <Link href="/pricing" className="underline">See packs</Link>
        </p>
      )}
      {blocks.length === 0 && <p className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500 dark:bg-neutral-900">Connect a data source first (Data Connect).</p>}
      {blocks.map(({ s, stats }) => (
        <section key={s.id} className="rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
          <h2 className="text-[14px] font-semibold">{s.name}</h2>
          {stats.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">No numeric data yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-start text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-neutral-400">
                  <tr>{['Field', 'Values', 'Latest', 'Average', 'Min', 'Max', 'Trend', 'Unusual'].map((h) => <th key={h} className="py-1.5 pe-4 text-start font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {stats.map((f) => (
                    <tr key={f.field} className="border-t border-neutral-200 dark:border-neutral-800">
                      <td className="py-2 pe-4 font-medium">{f.field}</td>
                      <td className="pe-4">{f.count}</td>
                      <td className="pe-4">{fmt(f.latest)}</td>
                      <td className="pe-4">{fmt(f.mean)}</td>
                      <td className="pe-4">{fmt(f.min)}</td>
                      <td className="pe-4">{fmt(f.max)}</td>
                      <td className="pe-4">{f.trend === 'up' ? '↑ rising' : f.trend === 'down' ? '↓ falling' : '→ stable'}</td>
                      <td className="pe-4">{detect ? (f.anomalies.length ? <span className="text-red-600">{f.anomalies.length}</span> : '0') : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
