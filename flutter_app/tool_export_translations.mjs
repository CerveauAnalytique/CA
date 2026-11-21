import fs from 'node:fs'
for (const l of ['nl','de','fr','es','pl','ar']) {
  const src = fs.readFileSync(`src/i18n/translations/${l}.ts`, 'utf8')
  const m = src.match(/const t: Record<string, string> = (\{[\s\S]*?\n\})/)
  const obj = JSON.parse(m[1].replace(/,\s*\n\}/, '\n}'))
  fs.writeFileSync(`flutter_app/assets/i18n/${l}.json`, JSON.stringify(obj))
  console.log(l, Object.keys(obj).length)
}
