import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { countApiCall } from '@/lib/limits'
import { saveRecords } from '@/lib/connect'
import { track } from '@/lib/security/track'

export const dynamic = 'force-dynamic'
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-CA7-Token', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

/**
 * POST /api/ca/ingest   header X-CA7-Token: <token of a push or camera source>
 * body: { "records": [ { "temperature": 21.5 }, ... ] }   (or one object)
 * For IoT devices, an MQTT bridge, scripts and the CA7 desktop camera agent.
 */
export async function POST(request: Request) {
  const token = request.headers.get('x-ca7-token')
  if (!token) return Response.json({ error: 'Send your source token in the X-CA7-Token header.' }, { status: 401, headers: CORS })
  if (Number(request.headers.get('content-length') || 0) > 2_000_000) return Response.json({ error: 'Too large.' }, { status: 413, headers: CORS })
  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({ collection: 'data-sources', where: { ingestToken: { equals: token } }, limit: 1, depth: 0, overrideAccess: true })
  const source = found.docs[0]
  if (!source) {
    await track(request, 'api_unauthorized', null, { route: 'ingest' })
    return Response.json({ error: 'Unknown token.' }, { status: 401, headers: CORS })
  }
  const owner = await payload.findByID({ collection: 'users', id: typeof source.owner === 'object' ? (source.owner as { id: string | number }).id : source.owner, depth: 0, overrideAccess: true })
  const call = await countApiCall(payload, owner)
  if (!call.ok) return Response.json({ error: `Your pack allows ${call.limit} API calls per month.` }, { status: 402, headers: CORS })
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400, headers: CORS }) }
  const list = Array.isArray(body) ? body : Array.isArray((body as { records?: unknown })?.records) ? (body as { records: unknown[] }).records : [body]
  const rows = list.filter((r) => r && typeof r === 'object' && !Array.isArray(r)).slice(0, 1000) as Record<string, unknown>[]
  if (!rows.length) return Response.json({ error: 'Send at least one record (an object).' }, { status: 400, headers: CORS })
  return Response.json(await saveRecords(payload, owner, source.id, rows), { headers: CORS })
}
