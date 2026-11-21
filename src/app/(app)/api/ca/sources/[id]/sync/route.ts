import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { countApiCall, limitResponse } from '@/lib/limits'
import { syncSource } from '@/lib/connect'

export const dynamic = 'force-dynamic'

/** POST /api/ca/sources/:id/sync - fetch a REST source now. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  const owned = await payload.findByID({ collection: 'data-sources', id, depth: 0, overrideAccess: false, user }).catch(() => null)
  if (!owned || !['rest', 'openremote', 'thingsboard'].includes(owned.type)) return Response.json({ error: 'Source not found.' }, { status: 404 })
  // the stored credentials are hidden from every reader, so read the full record on the server
  const source = await payload.findByID({ collection: 'data-sources', id, depth: 0, overrideAccess: true })
  const call = await countApiCall(payload, user)
  if (!call.ok) return limitResponse('API calls per month', call.limit)
  try {
    return Response.json(await syncSource(payload, user, source as never))
  } catch (e) {
    await payload.update({ collection: 'data-sources', id, data: { lastError: (e as Error).message }, overrideAccess: true })
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
