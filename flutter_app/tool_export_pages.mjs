// Exports the text of the simple static pages of the website to assets/data/pages.json
// (run from the repository root: node flutter_app/tool_export_pages.mjs)
import fs from 'node:fs'
const pages = ['privacy', 'terms', 'cookies']
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
const out = {}
for (const p of pages) {
  const src = fs.readFileSync(`src/app/(app)/${p}/page.tsx`, 'utf8')
  const body = src.slice(src.indexOf('return ('))
  const blocks = []
  const re = /<(h1|h2|h3|p|li|a)\b([^>]*)>([\s\S]*?)<\/\1>/g
  let m
  while ((m = re.exec(body))) {
    const [, tag, attrs, inner] = m
    if (tag === 'a') continue
    let text = dec(inner.replace(/<[^>]+>/g, ' ').replace(/\{\s*'([^']*)'\s*\}/g, '$1').replace(/\{[^}]*\}/g, ' ').replace(/\s+/g, ' ').trim())
    if (!text) continue
    let t = tag
    if (/static-eyebrow/.test(attrs)) t = 'eyebrow'
    else if (/static-title/.test(attrs) || tag === 'h1') t = 'title'
    else if (/static-subtitle/.test(attrs)) t = 'subtitle'
    blocks.push({ t, text })
  }
  out[p] = blocks
  console.log(p, blocks.length)
}
fs.writeFileSync('flutter_app/assets/data/pages.json', JSON.stringify(out))
