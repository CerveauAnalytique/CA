import { timingSafeEqual } from 'node:crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { syncSource } from '@/lib/connect'
import { countApiCall } from '@/lib/limits'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ca/sync   header: Authorization: Bearer <CA7_CRON_SECRET>
 * Pulls every REST, OpenRemote and ThingsBoard source once. Call it from a scheduler (cron, GitHub Actions, ...) every few minutes.
 * Each source counts as one API call of its owner; owners who used up their pack are skipped.
 */
export async function POST(request: Request) {
  const secret = process.env.CA7_CRON_SECRET
  const given = (request.headers.get('authorization') || '').replace(/^Bearer /, '')
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const payload = await getPayload({ config: configPromise })
  const sources = await payload.find({ collection: 'data-sources', where: { type: { in: ['rest', 'openremote', 'thingsboard'] } }, limit: 500, depth: 0, overrideAccess: true })
  const result = { synced: 0, failed: 0, skipped: 0 }
  for (const s of sources.docs) {
    const owner = await payload.findByID({ collection: 'users', id: typeof s.owner === 'object' ? (s.owner as { id: number }).id : s.owner, depth: 0, overrideAccess: true })
    if (!(await countApiCall(payload, owner)).ok) { result.skipped++; continue }
    try {
      await syncSource(payload, owner as never, s as never)
      result.synced++
    } catch (e) {
      result.failed++
      await payload.update({ collection: 'data-sources', id: s.id, data: { lastError: (e as Error).message }, overrideAccess: true })
    }
  }
  return Response.json(result)
}
