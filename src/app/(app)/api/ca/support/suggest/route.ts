import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { score } from '@/lib/search'

export const dynamic = 'force-dynamic'

/** GET /api/ca/support/suggest?q=...  Help articles that fit a problem, best first (shown before a request goes to the team). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 200) || ''
  if (q.length < 2) return Response.json({ articles: [] })
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({ collection: 'support-articles', limit: 200, depth: 1, pagination: false })
  const hits = (res.docs as unknown as { slug: string; title: string; summary: string; topic?: { title?: string }; blocks?: { text?: string }[] }[])
    .map((a) => ({ a, s: score(q, a.title, `${a.summary} ${(a.blocks ?? []).map((b) => b.text ?? '').join(' ')}`) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .slice(0, 6)
    .map(({ a }) => ({ slug: a.slug, title: a.title, summary: a.summary, topic: a.topic?.title }))
  return Response.json({ articles: hits })
}
