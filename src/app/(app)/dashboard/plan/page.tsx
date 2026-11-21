import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from '@/i18n/client'
import React from 'react'
import { PlanActions } from '@/components/Dash/PlanActions'
import { limitsOf, planOf } from '@/lib/limits'

export const metadata = { title: 'Pack & billing' }

function Bar({ label, used, max }: { label: string; used: number; max: number }) {
  const unlimited = !Number.isFinite(max)
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100))
  return (
    <div>
      <div className="flex justify-between text-xs"><span>{label}</span><span className="text-neutral-500">{used.toLocaleString('en-US')} / {unlimited ? 'unlimited' : max.toLocaleString('en-US')}</span></div>
      <div className="mt-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800"><div className={`h-2 rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const u = user as unknown as { id: string | number; plan?: string; usageMonth?: string; apiCallsMonth?: number; stripeSubscriptionId?: string }
  const plan = planOf(u)
  const lim = limitsOf(u as never)
  const month = new Date().toISOString().slice(0, 7)
  const calls = u.usageMonth === month ? (u.apiCallsMonth ?? 0) : 0
  const [sources, records] = await Promise.all([
    payload.count({ collection: 'data-sources', where: { owner: { equals: u.id } }, overrideAccess: true }),
    payload.count({ collection: 'data-records', where: { owner: { equals: u.id } }, overrideAccess: true }),
  ])
  const { paid } = await searchParams
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
        <h2 className="text-[14px] font-semibold">Your pack: <span className="capitalize">{plan}</span></h2>
        {paid && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">Thank you! Your pack is updated as soon as the payment is confirmed.</p>}
        <PlanActions plan={plan} hasSubscription={Boolean(u.stripeSubscriptionId)} />
        <p className="text-xs text-neutral-500">
          Business and Enterprise are by invoice. <Link href="/contact?plan=business" className="underline">Talk to us</Link> · <Link href="/pricing" className="underline">Compare packs</Link>
        </p>
      </section>
      <section className="space-y-4 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
        <h2 className="text-[14px] font-semibold">Usage this month</h2>
        <Bar label="API calls" used={calls} max={lim.apiCalls} />
        <Bar label="Data sources" used={sources.totalDocs} max={lim.sources} />
        <Bar label="Stored records" used={records.totalDocs} max={lim.records} />
      </section>
    </div>
  )
}
