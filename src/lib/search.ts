import type { Payload } from 'payload'

export type Hit = { id: string; title: string; href: string; description?: string; category: string; kind: string; priceInUSD?: number; score: number }

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
const words = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean)

/** Edit distance, stops early above `max`. */
function dist(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** Score of one query word against the words of a text: exact 10, prefix 7, contains 4, typo (1 to 2 letters off) 3, else 0. */
function wordScore(q: string, ws: string[], text: string) {
  let best = 0
  for (const w of ws) {
    if (w === q) return 10
    if (w.startsWith(q)) best = Math.max(best, 7)
    else if (q.length >= 3 && w.includes(q)) best = Math.max(best, 4)
    else if (q.length >= 4) {
      const max = q.length >= 8 ? 2 : 1
      if (dist(q, w, max) <= max) best = Math.max(best, 3)
    }
  }
  if (!best && q.length >= 3 && norm(text).includes(q)) best = 2
  return best
}

/** Every query word must match somewhere (title counts triple, summary and body once). Returns 0 when a word is missing. */
export function score(query: string, title: string, rest: string) {
  const qs = words(query)
  if (!qs.length) return 0
  const tw = words(title)
  const rw = words(rest)
  let total = 0
  for (const q of qs) {
    const t = wordScore(q, tw, title)
    const r = wordScore(q, rw, rest)
    if (!t && !r) return 0
    total += t * 3 + r
  }
  if (norm(title).includes(norm(query))) total += 15
  return total
}

type Spec = {
  collection: string
  kind: string
  category: string
  select: Record<string, true>
  map: (d: Record<string, any>) => { id: string; title: string; href: string; description?: string; text: string; priceInUSD?: number; category?: string; kind?: string } | null
}

const blockText = (blocks: any[] | undefined) =>
  (blocks ?? []).map((b) => [b.text, b.code, ...(b.items ?? []).map((i: any) => [i.text, i.title].join(' '))].join(' ')).join(' ')

const SPECS: Spec[] = [
  { collection: 'products', kind: 'product', category: 'Product', select: { title: true, slug: true, priceInUSD: true, meta: true }, map: (d) => ({ id: String(d.id), title: d.title, href: `/products/${d.slug}`, description: d.meta?.description, text: d.meta?.description ?? '', priceInUSD: d.priceInUSD }) },
  { collection: 'site-pages', kind: 'page', category: 'Page', select: { title: true, slug: true, subtitle: true, section: true, blocks: true }, map: (d) => ({ id: String(d.id), title: d.title, href: d.slug === 'docs' ? '/docs' : `/${d.slug}`, description: d.subtitle, text: `${d.subtitle ?? ''} ${blockText(d.blocks)}`, kind: d.section === 'docs' ? 'doc' : d.section === 'research' ? 'research' : 'page', category: d.section === 'docs' ? 'Docs' : d.section === 'research' ? 'Research' : 'Page' }) },
  { collection: 'pages', kind: 'page', category: 'Page', select: { title: true, slug: true, meta: true }, map: (d) => (d.slug === 'home' ? null : { id: String(d.id), title: d.title, href: `/${d.slug}`, description: d.meta?.description, text: d.meta?.description ?? '' }) },
  { collection: 'posts', kind: 'post', category: 'Blog', select: { title: true, slug: true, excerpt: true, category: true }, map: (d) => ({ id: String(d.id), title: d.title, href: `/blog/${d.slug}`, description: d.excerpt, text: `${d.excerpt ?? ''} ${d.category ?? ''}` }) },
  { collection: 'ai-models', kind: 'model', category: 'AI model', select: { name: true, slug: true, summary: true, tags: true, publisher: true }, map: (d) => ({ id: String(d.id), title: d.name, href: `/models/${d.slug}`, description: d.summary, text: `${d.summary ?? ''} ${d.publisher ?? ''} ${(d.tags ?? []).map((t: any) => t.tag ?? t).join(' ')}` }) },
  { collection: 'datasets', kind: 'dataset', category: 'Dataset', select: { name: true, slug: true, summary: true, tags: true, publisher: true }, map: (d) => ({ id: String(d.id), title: d.name, href: `/datasets/${d.slug}`, description: d.summary, text: `${d.summary ?? ''} ${d.publisher ?? ''} ${(d.tags ?? []).map((t: any) => t.tag ?? t).join(' ')}` }) },
]

/** Smart search over the database: all content collections, every word must match (typos allowed), best match first. */
export async function smartSearch(payload: Payload, query: string, limit = 30) {
  const hits: Hit[] = []
  const vocab = new Set<string>()
  await Promise.all(
    SPECS.map(async (s) => {
      try {
        const res = await payload.find({ collection: s.collection as never, limit: 400, depth: 0, pagination: false, overrideAccess: false, select: s.select as never })
        for (const d of res.docs as Record<string, any>[]) {
          const m = s.map(d)
          if (!m || !m.title) continue
          words(m.title).forEach((w) => w.length >= 4 && vocab.add(w))
          const sc = score(query, m.title, m.text)
          if (sc > 0) hits.push({ id: `${s.collection}:${m.id}`, title: m.title, href: m.href, description: m.description?.slice(0, 160), category: m.category ?? s.category, kind: m.kind ?? s.kind, priceInUSD: m.priceInUSD, score: sc })
        }
      } catch {
        /* a collection that cannot be read is skipped */
      }
    }),
  )
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  let suggestion: string | undefined
  if (!hits.length) {
    // "did you mean": the closest title word for the last query word
    const q = words(query).pop()
    if (q && q.length >= 3) {
      let best: [string, number] = ['', 99]
      for (const w of vocab) {
        const d = dist(q, w, 3)
        if (d < best[1]) best = [w, d]
      }
      if (best[1] <= 3 && best[0] !== q) suggestion = best[0]
    }
  }
  return { hits: hits.slice(0, limit), suggestion }
}
