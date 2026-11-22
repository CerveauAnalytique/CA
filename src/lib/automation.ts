import type { Payload } from 'payload'
import { limitsOf } from '@/lib/limits'
import { isAnomaly } from '@/lib/intelligence'

type User = { id: string | number; plan?: string | null; roles?: string[] | null }

/** Checks the new records against the customer's automation rules and runs the actions. */
export async function runAutomations(payload: Payload, user: User, sourceId: string | number, rows: Record<string, unknown>[]) {
  if (!limitsOf(user).automation) return
  const { docs: rules } = await payload.find({
    collection: 'automations',
    where: { and: [{ source: { equals: sourceId } }, { enabled: { equals: true } }, { owner: { equals: user.id } }] },
    limit: 100,
    overrideAccess: true,
  })
  for (const rule of rules) {
    const hits: { value: number; row: Record<string, unknown> }[] = []
    let history: number[] | null = null
    for (const row of rows) {
      const v = row[rule.field]
      if (typeof v !== 'number') continue
      let hit = false
      if (rule.operator === 'gt') hit = v > (rule.threshold ?? 0)
      else if (rule.operator === 'lt') hit = v < (rule.threshold ?? 0)
      else if (rule.operator === 'eq') hit = v === rule.threshold
      else if (rule.operator === 'anomaly') {
        if (!history) {
          const res = await payload.find({ collection: 'data-records', where: { source: { equals: sourceId } }, sort: '-recordedAt', limit: 500, depth: 0, overrideAccess: true })
          history = res.docs.map((d) => (d.data as Record<string, unknown>)?.[rule.field]).filter((x): x is number => typeof x === 'number')
        }
        hit = isAnomaly(history, v)
      }
      if (hit) hits.push({ value: v, row })
    }
    if (!hits.length) continue
    const message = `CA7 automation "${rule.name}": ${hits.length} value(s) of "${rule.field}" matched (${rule.operator}${rule.threshold != null ? ' ' + rule.threshold : ''}). Latest: ${hits[hits.length - 1].value}.`
    try {
      if (rule.action === 'email') {
        await payload.sendEmail({ to: rule.target, subject: `CA7: ${rule.name}`, text: message })
      } else {
        const { assertPublicUrl } = await import('@/lib/connect')
        const url = await assertPublicUrl(rule.target)
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ automation: rule.name, source: sourceId, field: rule.field, matches: hits.slice(-20), message }),
          redirect: 'error',
          signal: AbortSignal.timeout(10_000),
        })
      }
      await payload.update({ collection: 'automations', id: rule.id, data: { lastTriggeredAt: new Date().toISOString(), triggerCount: (rule.triggerCount ?? 0) + 1 }, overrideAccess: true })
    } catch (e) {
      payload.logger.error(`Automation ${rule.id} failed: ${(e as Error).message}`)
    }
  }
}
