import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { clientKey, rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/** POST /api/ca/support/helpful { slug }  "This helped": counts one member for the article (limited per visitor). */
export async function POST(request: Request) {
  if (!rateLimit(`helpful:${clientKey(request)}`, 10, 60 * 60_000).ok) return Response.json({ error: 'Thanks, already counted.' }, { status: 429 })
  const b = await request.json().catch(() => ({}))
  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({ collection: 'support-articles', where: { slug: { equals: String(b.slug) } }, limit: 1, depth: 0 })
  const a = found.docs[0] as unknown as { id: number; helpful?: number } | undefined
  if (!a) return Response.json({ error: 'Not found.' }, { status: 404 })
  await payload.update({ collection: 'support-articles', id: a.id, data: { helpful: (a.helpful ?? 0) + 1 }, overrideAccess: true })
  return Response.json({ ok: true, helpful: (a.helpful ?? 0) + 1 })
}
