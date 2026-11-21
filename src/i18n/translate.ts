import type { Locale } from './config'
import nl from './translations/nl'
import de from './translations/de'
import fr from './translations/fr'
import es from './translations/es'
import pl from './translations/pl'
import ar from './translations/ar'

export type Dictionary = Record<string, string>
export type Vars = Record<string, string | number>

/** English is the source: the English text is the key, so `en` needs no file. */
export const dictionaries: Record<Exclude<Locale, 'en'>, Dictionary> = { nl, de, fr, es, pl, ar }

export function translate(locale: Locale, text: string, vars?: Vars): string {
  const out = (locale !== 'en' ? dictionaries[locale][text] : undefined) ?? text
  if (!vars) return out
  return out.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

/** Marks a text in a data list (arrays, config) as translatable; it is translated where it is shown with t(). */
export const tr = (text: string) => text
