import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { LANGUAGES, LOCALES, localizePath, matchAcceptLanguage, stripLocale } from '@/i18n/config'
import { dictionaries, translate } from '@/i18n/translate'

const SRC = path.resolve(__dirname, '../../src')
// t('text') and tr('text') with a plain string literal
const CALL = /(?<![\w.])(?:t|tr)\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g
// texts that belong to Payload itself, not to the shop
const IGNORE = new Set(['fields:enterURL'])

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'i18n' ? [] : files(p)
    return /\.tsx?$/.test(e.name) && !p.endsWith('payload-types.ts') && !p.endsWith('payload.config.ts') ? [p] : []
  })
}

function usedTexts(): string[] {
  const out = new Set<string>()
  for (const f of files(SRC)) {
    const src = fs.readFileSync(f, 'utf8')
    for (const m of src.matchAll(CALL)) {
      const text = (m[1] ?? m[2]).replace(/\\'/g, "'")
      if (!IGNORE.has(text)) out.add(text)
    }
  }
  return [...out].sort()
}

describe('translations', () => {
  const texts = usedTexts()

  it('finds the texts used in the shop', () => {
    expect(texts.length).toBeGreaterThan(100)
  })

  for (const code of LOCALES.filter((l) => l !== 'en')) {
    it(`has every text in ${LANGUAGES[code].name} (${code})`, () => {
      const dict = dictionaries[code as keyof typeof dictionaries]
      const missing = texts.filter((t) => !dict[t])
      expect(missing, `Missing ${code} translations:\n${missing.join('\n')}`).toEqual([])
    })

    it(`keeps the {placeholders} in ${code}`, () => {
      const dict = dictionaries[code as keyof typeof dictionaries]
      const bad = texts.filter((t) => {
        const want = (t.match(/\{\w+\}/g) ?? []).sort().join()
        const got = (dict[t]?.match(/\{\w+\}/g) ?? []).sort().join()
        return want !== got
      })
      expect(bad).toEqual([])
    })
  }

  it('has no unused translations', () => {
    for (const code of Object.keys(dictionaries) as (keyof typeof dictionaries)[]) {
      const unused = Object.keys(dictionaries[code]).filter((k) => !texts.includes(k))
      expect(unused, `${code} has texts that are not used`).toEqual([])
    }
  })
})

describe('language in the address', () => {
  it('reads and removes the language code', () => {
    expect(stripLocale('/ar/deals')).toEqual({ locale: 'ar', rest: '/deals' })
    expect(stripLocale('/nl/product/12')).toEqual({ locale: 'nl', rest: '/product/12' })
    expect(stripLocale('/nl')).toEqual({ locale: 'nl', rest: '/' })
    expect(stripLocale('/shop')).toEqual({ locale: null, rest: '/shop' })
    expect(stripLocale('/xx/shop').locale).toBeNull()
  })

  it('adds the code to links, but not to api, admin or other sites', () => {
    expect(localizePath('/shop', 'de')).toBe('/de/shop')
    expect(localizePath('/', 'fr')).toBe('/fr')
    expect(localizePath('/shop?q=a#x', 'es')).toBe('/es/shop?q=a#x')
    expect(localizePath('/de/shop', 'de')).toBe('/de/shop')
    expect(localizePath('/api/users', 'nl')).toBe('/api/users')
    expect(localizePath('/admin', 'nl')).toBe('/admin')
    expect(localizePath('https://example.com', 'nl')).toBe('https://example.com')
  })

  it('uses the device language on a first visit', () => {
    expect(matchAcceptLanguage('nl-NL,nl;q=0.9,en;q=0.8')).toBe('nl')
    expect(matchAcceptLanguage('ar-EG,ar;q=0.9')).toBe('ar')
    expect(matchAcceptLanguage('ja,zh;q=0.9,pl;q=0.5')).toBe('pl')
    expect(matchAcceptLanguage('ja')).toBeNull()
  })

  it('writes Arabic right-to-left and the others left-to-right', () => {
    expect(LANGUAGES.ar.dir).toBe('rtl')
    expect(LOCALES.filter((l) => l !== 'ar').every((l) => LANGUAGES[l].dir === 'ltr')).toBe(true)
  })

  it('falls back to English and fills in values', () => {
    expect(translate('nl', 'Log in')).toBe('Inloggen')
    expect(translate('nl', 'Something new')).toBe('Something new')
    expect(translate('en', 'Log in')).toBe('Log in')
    expect(translate('de', '{n} rows', { n: 5 })).toBe('5 Zeilen')
  })
})
