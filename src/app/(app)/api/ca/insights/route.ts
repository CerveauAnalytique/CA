import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { countApiCall, limitResponse, limitsOf } from '@/lib/limits'
import { analyze } from '@/lib/intelligence'

export const dynamic = 'force-dynamic'

/** GET /api/ca/insights?source=<id>  - statistics, trend and unusual values (Pro and up) for one source. */
export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Log in or send an API key.' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('source')
  if (!id) return Response.json({ error: 'Add ?source=<id>.' }, { status: 400 })
  const source = await payload.findByID({ collection: 'data-sources', id, depth: 0, overrideAccess: false, user }).catch(() => null)
  if (!source) return Response.json({ error: 'Source not found.' }, { status: 404 })
  const call = await countApiCall(payload, user)
  if (!call.ok) return limitResponse('API calls per month', call.limit)
  const res = await payload.find({ collection: 'data-records', where: { source: { equals: id } }, sort: '-recordedAt', limit: 1000, depth: 0, overrideAccess: false, user })
  const records = res.docs.reverse().map((d) => ({ data: d.data as Record<string, unknown>, at: d.recordedAt ?? undefined }))
  return Response.json({ source: { id: source.id, name: source.name }, fields: analyze(records, limitsOf(user).anomalyDetection), anomalyDetection: limitsOf(user).anomalyDetection })
}
