import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/** GET /api/ca/health: for the 5-minute health check of the scheduler. 200 when the database answers. */
export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    const since = new Date(Date.now() - 3600_000).toISOString()
    const open = await payload.count({ collection: 'security-alerts', where: { status: { equals: 'open' } }, overrideAccess: true })
    const recent = await payload.count({ collection: 'security-events', where: { createdAt: { greater_than: since } }, overrideAccess: true })
    return Response.json({ ok: true, openAlerts: open.totalDocs, eventsLastHour: recent.totalDocs })
  } catch {
    return Response.json({ ok: false }, { status: 503 })
  }
}
