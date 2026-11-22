import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { countApiCall, limitsOf, planOf } from '@/lib/limits'
import { saveRecords } from '@/lib/connect'
import { track } from '@/lib/security/track'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { ...CORS, 'Cache-Control': 'no-store' } })
const fail = (status: number, error: string) => json({ error }, status)

/** The endpoints of the gateway (also returned by GET /api/ca/v1, and shown in the dashboard). */
const ENDPOINTS = [
  { method: 'GET', path: '/me', what: 'Your account, pack, limits and usage this month' },
  { method: 'GET', path: '/products', what: 'Shop products. Query: q, limit (max 100), page', },
  { method: 'GET', path: '/products/{slug}', what: 'One product with price, stock and description' },
  { method: 'GET', path: '/orders', what: 'Your own orders. Query: limit, page' },
  { method: 'GET', path: '/sources', what: 'Your data sources (id, name, type, record count)' },
  { method: 'GET', path: '/records', what: 'Records of your data. Query: source (id), limit (max 1000), page, since (ISO date)' },
  { method: 'POST', path: '/records', what: 'Store records. Body: { "source": <id>, "records": [ { ... } ] } (max 1000)' },
] as const

type Ctx = { payload: Payload; user: NonNullable<Awaited<ReturnType<Payload['auth']>>['user']> }

const num = (v: string | null, d: number, max: number) => Math.min(max, Math.max(1, Math.floor(Number(v) || d)))
const money = (c?: number | null) => (typeof c === 'number' ? c : null)

function plainText(node: unknown): string {
  if (!node || typeof node !== 'object') return typeof node === 'string' ? node : ''
  const n = node as { text?: string; children?: unknown[]; root?: unknown }
  if (n.root) return plainText(n.root)
  if (typeof n.text === 'string') return n.text
  return (n.children ?? []).map(plainText).join(' ').replace(/\s+/g, ' ').trim()
}

function publicProduct(p: Record<string, any>, full = false) {
  const base = {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: money(p.priceInUSD),
    currency: 'USD',
    inStock: typeof p.inventory === 'number' ? p.inventory > 0 : null,
    inventory: p.inventory ?? null,
    hasVariants: Boolean(p.enableVariants),
  }
  return full ? { ...base, description: plainText(p.description) || p.meta?.description || '', images: (p.gallery ?? []).map((g: any) => g?.image?.url).filter(Boolean) } : base
}

async function route(request: Request, params: { path?: string[] }, method: 'GET' | 'POST') {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  const path = params.path ?? []
  const url = new URL(request.url)
  const q = url.searchParams

  if (!path.length) return json({ name: 'CA7 API', version: 1, auth: 'Authorization: users API-Key <your key>', endpoints: ENDPOINTS.map((e) => ({ ...e, path: `/api/ca/v1${e.path}` })) })

  if (!user) {
    await track(request, 'api_unauthorized', null, { route: 'v1' })
    return fail(401, 'Unauthorized. Send `Authorization: users API-Key <your key>` (create one in Dashboard → API).')
  }
  const ctx: Ctx = { payload, user }
  const call = await countApiCall(payload, user as never)
  if (!call.ok) return fail(402, `Your pack allows ${call.limit} API calls per month. Upgrade at /pricing.`)

  const [a, b] = path
  const owner = { equals: user.id }

  if (method === 'GET' && a === 'me' && !b) {
    const lim = limitsOf(user as never)
    const fin = (n: number) => (Number.isFinite(n) ? n : null)
    const { totalDocs: records } = await payload.count({ collection: 'data-records', where: { owner }, overrideAccess: true })
    const { totalDocs: sources } = await payload.count({ collection: 'data-sources', where: { owner }, overrideAccess: true })
    return json({
      email: user.email,
      pack: planOf(user as never),
      usage: { apiCalls: call.used, records, sources },
      limits: { apiCalls: fin(lim.apiCalls), records: fin(lim.records), sources: fin(lim.sources) },
    })
  }

  if (method === 'GET' && a === 'products') {
    if (b) {
      const found = await payload.find({ collection: 'products', where: { slug: { equals: b } }, limit: 1, depth: 2, overrideAccess: false, user })
      return found.docs[0] ? json(publicProduct(found.docs[0] as never, true)) : fail(404, 'Product not found.')
    }
    const term = q.get('q')?.trim()
    const found = await payload.find({
      collection: 'products',
      where: term ? { title: { like: term } } : undefined,
      limit: num(q.get('limit'), 20, 100),
      page: num(q.get('page'), 1, 10_000),
      depth: 0,
      overrideAccess: false,
      user,
    })
    return json({ products: found.docs.map((p) => publicProduct(p as never)), page: found.page, totalPages: found.totalPages, total: found.totalDocs })
  }

  if (method === 'GET' && a === 'orders' && !b) {
    const found = await payload.find({ collection: 'orders', where: { customer: owner }, limit: num(q.get('limit'), 20, 100), page: num(q.get('page'), 1, 10_000), depth: 0, sort: '-createdAt', overrideAccess: true })
    return json({
      orders: found.docs.map((o: any) => ({ id: o.id, status: o.status, amount: money(o.amount), currency: o.currency ?? 'USD', createdAt: o.createdAt, items: (o.items ?? []).map((i: any) => ({ product: typeof i.product === 'object' ? i.product?.id : i.product, quantity: i.quantity })) })),
      page: found.page,
      totalPages: found.totalPages,
      total: found.totalDocs,
    })
  }

  if (method === 'GET' && a === 'sources' && !b) {
    const found = await payload.find({ collection: 'data-sources', where: { owner }, limit: 100, depth: 0, overrideAccess: true })
    return json({ sources: found.docs.map((s: any) => ({ id: s.id, name: s.name, type: s.type, records: s.recordCount ?? 0, lastSyncAt: s.lastSyncAt ?? null })) })
  }

  if (a === 'records' && !b) {
    if (method === 'GET') {
      const where: any = { and: [{ owner }] }
      const src = q.get('source')
      if (src) where.and.push({ source: { equals: Number(src) } })
      const since = q.get('since')
      if (since && !Number.isNaN(Date.parse(since))) where.and.push({ recordedAt: { greater_than_equal: new Date(since).toISOString() } })
      const found = await payload.find({ collection: 'data-records', where, limit: num(q.get('limit'), 100, 1000), page: num(q.get('page'), 1, 10_000), depth: 0, sort: '-recordedAt', overrideAccess: true })
      return json({ records: found.docs.map((r: any) => ({ id: r.id, source: r.source, recordedAt: r.recordedAt, data: r.data })), page: found.page, totalPages: found.totalPages, total: found.totalDocs })
    }
    if (Number(request.headers.get('content-length') || 0) > 2_000_000) return fail(413, 'Too large.')
    const body = await request.json().catch(() => null)
    const sourceId = Number(body?.source)
    if (!sourceId) return fail(400, 'Send "source" (the id of one of your sources).')
    const src = await payload.find({ collection: 'data-sources', where: { and: [{ id: { equals: sourceId } }, { owner }] }, limit: 1, depth: 0, overrideAccess: true })
    if (!src.docs[0]) return fail(404, 'That source does not exist or is not yours.')
    const list = Array.isArray(body?.records) ? body.records : []
    const rows = list.filter((r: unknown) => r && typeof r === 'object' && !Array.isArray(r)).slice(0, 1000)
    if (!rows.length) return fail(400, 'Send at least one record (an object) in "records".')
    return json(await saveRecords(ctx.payload, user as never, sourceId, rows))
  }

  return fail(404, 'Unknown endpoint. See GET /api/ca/v1 for the list.')
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
export async function GET(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return route(request, await ctx.params, 'GET')
}
export async function POST(request: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return route(request, await ctx.params, 'POST')
}
