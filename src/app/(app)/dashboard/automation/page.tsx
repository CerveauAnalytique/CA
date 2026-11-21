import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { AutomationPanel } from '@/components/Dash/AutomationPanel'
import { limitsOf } from '@/lib/limits'

export const metadata = { title: 'Automation' }

export default async function AutomationPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const sources = await payload.find({ collection: 'data-sources', depth: 0, limit: 100, overrideAccess: false, user })
  const rules = await payload.find({ collection: 'automations', depth: 1, limit: 100, sort: '-createdAt', overrideAccess: false, user })
  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
        Do something when new data arrives: send an e-mail or call a webhook when a value passes a limit or looks unusual.
      </p>
      <AutomationPanel
        allowed={limitsOf(user as never).automation}
        sources={sources.docs.map((s) => ({ id: s.id, name: s.name }))}
        rules={rules.docs.map((r) => ({
          id: r.id, name: r.name, sourceName: typeof r.source === 'object' ? r.source.name : String(r.source), field: r.field, operator: r.operator,
          threshold: r.threshold, action: r.action, target: r.target, enabled: Boolean(r.enabled), triggerCount: r.triggerCount, lastTriggeredAt: r.lastTriggeredAt,
        }))}
      />
    </>
  )
}
