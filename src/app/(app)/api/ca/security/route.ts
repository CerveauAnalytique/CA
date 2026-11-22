import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { endSessions, reviewAlert, setSuspended } from '@/lib/security/engine'
import { ACTIONS, DEFAULT_RULES } from '@/lib/security/config'

export const dynamic = 'force-dynamic'

async function admin(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  const strategy = (user as unknown as { _strategy?: string } | null)?._strategy
  const ok = Boolean(user && (user as unknown as { roles?: string[] }).roles?.includes('admin')) && strategy !== 'api-key'
  return { payload, user: ok ? user : null }
}

/** GET /api/ca/security: what the Security dashboard shows. Admins only. */
export async function GET(request: Request) {
  const { payload, user } = await admin(request)
  if (!user) return Response.json({ error: 'Admins only.' }, { status: 403 })
  const since = new Date(Date.now() - 24 * 3600_000).toISOString()
  const find = (collection: string, where: object, limit = 50, sort = '-createdAt') => payload.find({ collection: collection as never, where: where as never, limit, sort, depth: 0, overrideAccess: true })
  const [alerts, events, blocks, suspended, rules] = await Promise.all([
    find('security-alerts', { status: { equals: 'open' } }),
    find('security-events', {}, 100),
    find('security-blocks', { and: [{ active: { equals: true } }, { until: { greater_than: new Date().toISOString() } }] }),
    payload.find({ collection: 'users', where: { suspended: { equals: true } }, limit: 50, depth: 0, overrideAccess: true }),
    find('security-rules', {}, 100, 'key'),
  ])
  const level24h: Record<string, number> = {}
  for (const l of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) level24h[l] = (await payload.count({ collection: 'security-events', where: { and: [{ level: { equals: l } }, { createdAt: { greater_than: since } }] }, overrideAccess: true })).totalDocs
  return Response.json({
    level24h,
    actions: ACTIONS,
    alerts: alerts.docs,
    events: events.docs,
    blocks: blocks.docs,
    suspended: suspended.docs.map((u) => ({ id: u.id, email: u.email, reason: (u as unknown as { suspendedReason?: string }).suspendedReason })),
    rules: DEFAULT_RULES.map((r) => ({ ...r, override: (rules.docs as unknown as { key: string }[]).find((o) => o.key === r.key) ?? null })),
  })
}

/** POST /api/ca/security { action, id, decision?, note?, reason? } */
export async function POST(request: Request) {
  const { payload, user } = await admin(request)
  if (!user) return Response.json({ error: 'Admins only.' }, { status: 403 })
  const b = await request.json().catch(() => ({}))
  const id = b.id as string | number
  switch (b.action) {
    case 'review':
      await reviewAlert(payload, id, b.decision === 'false_positive' ? 'false_positive' : 'confirmed', user.id, b.note)
      break
    case 'suspend':
      if (String(id) === String(user.id)) return Response.json({ error: 'You cannot suspend yourself.' }, { status: 400 })
      await setSuspended(payload, id, true, b.reason)
      break
    case 'restore':
      await setSuspended(payload, id, false)
      break
    case 'logout':
      await endSessions(payload, id)
      break
    case 'lift_block':
      await payload.update({ collection: 'security-blocks', id, data: { active: false }, overrideAccess: true })
      break
    default:
      return Response.json({ error: 'Unknown action.' }, { status: 400 })
  }
  await payload.create({ collection: 'security-events', data: { category: 'admin_security_action', level: 'LOW', score: 0, userId: String(user.id), evidence: { action: b.action, target: String(id) } }, overrideAccess: true })
  return Response.json({ ok: true })
}
