import { loadPolicy, loadSettings } from '@/lib/ai/engine'
import { whoAmI } from '@/lib/ai/auth'

export const dynamic = 'force-dynamic'

/** GET: the AI Control Center (admins). POST { action: 'flag' | 'version' | 'job', ... } */
export async function GET(request: Request) {
  const { payload, admin } = await whoAmI(request)
  if (!admin) return Response.json({ error: 'Admins only.' }, { status: 403 })
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const count = async (where: object) => (await payload.count({ collection: 'ai-decisions', where: where as never, overrideAccess: true })).totalDocs
  const [total, allowed, corrected, blocked, recent, sponsored, settings, policy, global] = await Promise.all([
    count({ createdAt: { greater_than: since } }),
    count({ and: [{ createdAt: { greater_than: since } }, { decision: { equals: 'allowed' } }] }),
    count({ and: [{ createdAt: { greater_than: since } }, { decision: { equals: 'corrected' } }] }),
    count({ and: [{ createdAt: { greater_than: since } }, { decision: { equals: 'blocked' } }] }),
    payload.find({ collection: 'ai-decisions', sort: '-createdAt', limit: 50, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'ai-sponsored', limit: 50, depth: 1, overrideAccess: true }),
    loadSettings(payload),
    loadPolicy(payload),
    payload.findGlobal({ slug: 'ai-settings', depth: 0, overrideAccess: true }),
  ])
  const g = global as unknown as { lastRecommendationJob?: string; lastRecommendationJobStatus?: string }
  return Response.json({ kpi: { total, allowed, corrected, blocked }, decisions: recent.docs, sponsored: sponsored.docs, flags: settings.flags, versions: settings.versions, activeVersion: settings.active.version, policy, job: { at: g.lastRecommendationJob, status: g.lastRecommendationJobStatus } })
}

export async function POST(request: Request) {
  const { payload, admin, user } = await whoAmI(request)
  if (!admin) return Response.json({ error: 'Admins only.' }, { status: 403 })
  const b = await request.json().catch(() => ({}))
  const g = (await payload.findGlobal({ slug: 'ai-settings', depth: 0, overrideAccess: true })) as unknown as { flags?: Record<string, boolean>; rankingVersions?: unknown[] }
  if (b.action === 'flag' && typeof b.name === 'string') {
    await payload.updateGlobal({ slug: 'ai-settings', data: { flags: { ...(g.flags ?? {}), [b.name]: b.value === true } } as never, overrideAccess: true })
  } else if (b.action === 'version' && typeof b.version === 'string') {
    await payload.updateGlobal({ slug: 'ai-settings', data: { activeVersion: b.version }, overrideAccess: true })
  } else if (b.action === 'job') {
    // the recommendation job: checks the catalog and the order history it ranks from and records the run
    const { loadCatalog } = await import('@/lib/ai/engine')
    const items = (await loadCatalog(payload)).length
    const orders = (await payload.count({ collection: 'orders', overrideAccess: true })).totalDocs
    await payload.updateGlobal({ slug: 'ai-settings', data: { lastRecommendationJob: new Date().toISOString(), lastRecommendationJobStatus: `ok: ${items} products, ${orders} orders` }, overrideAccess: true })
  } else return Response.json({ error: 'Unknown action.' }, { status: 400 })
  await payload.create({ collection: 'security-events', data: { category: 'admin_ai_action', level: 'LOW', score: 0, userId: String(user!.id), evidence: { action: b.action, name: b.name, version: b.version } }, overrideAccess: true })
  return Response.json({ ok: true })
}
