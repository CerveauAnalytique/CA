import { describe, it, expect } from 'vitest'
import nl from '@/i18n/translations/nl'
import de from '@/i18n/translations/de'
import fr from '@/i18n/translations/fr'
import es from '@/i18n/translations/es'
import pl from '@/i18n/translations/pl'
import ar from '@/i18n/translations/ar'

/** The translations are exported to the Flutter app (flutter_app/tool_export_translations.mjs): every language needs the same texts. */
describe('translations', () => {
  const dicts = { nl, de, fr, es, pl, ar }
  const keys = Object.keys(nl).sort()
  for (const [code, dict] of Object.entries(dicts)) {
    it(`${code} has the same texts as nl and no empty ones`, () => {
      expect(Object.keys(dict).sort()).toEqual(keys)
      expect(Object.values(dict).filter((v) => !v)).toEqual([])
    })
    it(`${code} keeps the {placeholders}`, () => {
      const bad = keys.filter((k) => (k.match(/\{\w+\}/g) ?? []).sort().join() !== ((dict as Record<string, string>)[k].match(/\{\w+\}/g) ?? []).sort().join())
      expect(bad).toEqual([])
    })
  }
})
