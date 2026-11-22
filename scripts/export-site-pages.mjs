// Exports the text of the static pages of the website to src/seed/site-pages.json (run: node scripts/export-site-pages.mjs).
// The site-pages collection is seeded from this file when the database has none; after that the database is the source of truth.
import fs from 'node:fs'
import vm from 'node:vm'

const PAGES = [
  ['about', 'company'], ['careers', 'company'], ['press', 'company'], ['community', 'company'], ['contact', 'company'], ['status', 'company'],
  ['privacy', 'legal'], ['terms', 'legal'], ['cookies', 'legal'], ['security', 'legal'],
  ['sdks', 'product'], ['api', 'product'], ['research', 'research'],
  ['docs', 'docs'], ['docs/quickstart', 'docs'], ['docs/authentication', 'docs'], ['docs/carbon', 'docs'], ['docs/reference', 'docs'],
]
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&apos;|&#39;|&rsquo;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—')
const clean = (s) => dec(s.replace(/<[^>]+>/g, ' ').replace(/\{\s*'([^']*)'\s*\}/g, '$1').replace(/\{[^}]*\}/g, ' ').replace(/\s+/g, ' ').trim())

const out = []
for (const [slug, section] of PAGES) {
  const file = `src/app/(app)/${slug}/page.tsx`
  const src = fs.readFileSync(file, 'utf8')
  const meta = src.match(/title:\s*['"`]([^'"`]+)['"`]/)
  const desc = src.match(/description:\s*\n?\s*['"`]([^'"`]+)['"`]/)
  const body = src.slice(src.indexOf('return ('))
  const blocks = []
  let eyebrow = '', title = '', subtitle = ''
  let list = null
  const re = /<pre\b[^>]*><code>\{`([\s\S]*?)`\}<\/code><\/pre>|<(h1|h2|h3|p|li|strong)\b([^>]*)>([\s\S]*?)<\/\2>/g
  let m
  while ((m = re.exec(body))) {
    if (m[1] !== undefined) { list = null; blocks.push({ blockType: 'code', code: m[1].replace(/\\`/g, '`').replace(/\\\$/g, '$').trim() }); continue }
    const [, , tag, attrs, inner] = m
    if (tag === 'strong') continue
    const text = clean(inner)
    if (!text) continue
    if (/static-eyebrow|docs-eyebrow/.test(attrs)) { eyebrow = text; continue }
    if (tag === 'h1' || /static-title/.test(attrs)) { if (!title) title = text; continue }
    if (/static-subtitle|docs-lead/.test(attrs)) { subtitle = subtitle || text; continue }
    if (tag === 'li') { if (!list) { list = { blockType: 'list', items: [] }; blocks.push(list) } list.items.push({ text }); continue }
    list = null
    if (tag === 'h2' || tag === 'h3') blocks.push({ blockType: 'heading', level: tag === 'h2' ? 2 : 3, text })
    else if (/callout/.test(attrs)) blocks.push({ blockType: 'callout', text })
    else blocks.push({ blockType: 'paragraph', text })
  }
  // pages that keep their content in JS arrays (research, community, sdks, status, about): make cards
  for (const arr of src.matchAll(/\nconst (\w+)\s*(?::[^=\n]+)?=\s*(\[\s*\{[\s\S]*?\n\])\n/g)) {
    try {
      const items = vm.runInNewContext(arr[2])
      const cards = items
        .map((x) => ({ title: x.title || x.name || x.lang || x.role || x.label || '', text: x.excerpt || x.description || x.desc || x.text || x.body || x.install || x.summary || '', meta: [x.category, x.date, x.readTime, x.status, x.location, x.cta, x.href && /^http/.test(x.href) ? x.href : ''].filter(Boolean).join(' · ') }))
        .filter((x) => x.title)
      if (cards.length) blocks.push({ blockType: 'cards', items: cards })
    } catch {}
  }
  // contact page: label + e-mail address pairs
  const mails = [...body.matchAll(/contact-label">([^<]+)<\/span>\s*<a href="mailto:([^"]+)"/g)]
  if (mails.length) blocks.push({ blockType: 'list', items: mails.map((x) => ({ text: `${x[1].trim()}: ${x[2]}` })) })
  out.push({
    slug, section,
    title: title || (meta ? meta[1].replace(/ — Cerveau Analytique( Docs)?$/, '') : slug),
    eyebrow, subtitle: subtitle || (desc ? desc[1] : ''),
    blocks,
  })
  console.log(slug.padEnd(22), blocks.length, 'blocks')
}
fs.writeFileSync('src/seed/site-pages.json', JSON.stringify(out, null, 1))
