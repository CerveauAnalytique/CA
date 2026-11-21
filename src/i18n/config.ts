export const LOCALES = ['en', 'nl', 'de', 'fr', 'es', 'pl', 'ar'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const LANGUAGES: Record<Locale, { name: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
  nl: { name: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  de: { name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  pl: { name: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
}

export const LOCALE_COOKIE = 'ca_lang'
export const LOCALE_HEADER = 'x-ca-locale'

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

/** Picks the best supported language from an Accept-Language header. */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null
  const wanted = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 }
    })
    .filter((x) => x.tag && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q)
  for (const { tag } of wanted) {
    const base = tag.split('-')[0]
    if (isLocale(base)) return base
  }
  return null
}

/** Removes a leading /xx language code from a path. */
export function stripLocale(path: string): { locale: Locale | null; rest: string } {
  const m = path.match(/^\/([a-z]{2})(?=\/|$)(.*)$/)
  if (m && isLocale(m[1])) return { locale: m[1], rest: m[2] || '/' }
  return { locale: null, rest: path }
}

/** Paths that must never get a language prefix. */
const UNPREFIXED = [/^\/api(\/|$)/, /^\/admin(\/|$)/, /^\/_next(\/|$)/]
export const shouldPrefix = (path: string) => !UNPREFIXED.some((re) => re.test(path))

/** /shop -> /nl/shop. Leaves external links, anchors and already prefixed paths alone. */
export function localizePath(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const [pathAndQuery, hash] = href.split('#')
  const [path, query] = pathAndQuery.split('?')
  if (!shouldPrefix(path) || stripLocale(path).locale) return href
  const out = `/${locale}${path === '/' ? '' : path}${query ? `?${query}` : ''}`
  return hash ? `${out}#${hash}` : out
}
