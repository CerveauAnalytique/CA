import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { countApiCall, limitResponse } from '@/lib/limits'
import { parseCsv, saveRecords } from '@/lib/connect'

export const dynamic = 'force-dynamic'
const MAX = 5_000_000

/** POST /api/ca/sources/:id/csv - body is the CSV text (first row = column names). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  if (Number(request.headers.get('content-length') || 0) > MAX) return Response.json({ error: 'File too large (max 5 MB).' }, { status: 413 })
  const source = await payload.findByID({ collection: 'data-sources', id, depth: 0, overrideAccess: false, user }).catch(() => null)
  if (!source || source.type !== 'csv') return Response.json({ error: 'CSV source not found.' }, { status: 404 })
  const call = await countApiCall(payload, user)
  if (!call.ok) return limitResponse('API calls per month', call.limit)
  const rows = parseCsv((await request.text()).slice(0, MAX)).slice(0, 50_000)
  if (!rows.length) return Response.json({ error: 'No rows found.' }, { status: 400 })
  return Response.json(await saveRecords(payload, user, source.id, rows))
}
