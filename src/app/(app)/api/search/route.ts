import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { smartSearch } from '@/lib/search'

export const dynamic = 'force-dynamic'

/**
 * GET /api/search?q=...  Smart search over the database (products, pages, docs, research, blog, AI models, datasets).
 * `products`, `docs` and `research` keep the shape the website's search box uses; `results` is the full ranked list.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 100) || ''
  const empty = { products: [], docs: [], research: [], pages: [], posts: [], models: [], datasets: [], results: [] }
  if (!q) return NextResponse.json(empty)
  const payload = await getPayload({ config: configPromise })
  const { hits, suggestion } = await smartSearch(payload, q)
  const by = (kind: string) => hits.filter((h) => h.kind === kind)
  return NextResponse.json({
    products: by('product').slice(0, 8),
    docs: by('doc').slice(0, 8),
    research: by('research').slice(0, 8),
    pages: by('page').slice(0, 8),
    posts: by('post').slice(0, 8),
    models: by('model').slice(0, 8),
    datasets: by('dataset').slice(0, 8),
    results: hits,
    ...(suggestion ? { suggestion } : {}),
  })
}
