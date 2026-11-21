'use client'

import React, { createContext, useCallback, useContext, useMemo } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { DEFAULT_LOCALE, LOCALE_COOKIE, localizePath, stripLocale, type Locale } from './config'
import { translate, type Vars } from './translate'

const Ctx = createContext<Locale | null>(null)

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>
}

/** Current language. Outside the provider (the admin panel) this is English. */
export const useLocale = (): Locale => useContext(Ctx) ?? DEFAULT_LOCALE

export function useT() {
  const locale = useLocale()
  return useCallback((text: string, vars?: Vars) => translate(locale, text, vars), [locale])
}

/** Link that keeps the visitor in their language: href="/shop" becomes /nl/shop. */
export const Link = React.forwardRef<HTMLAnchorElement, React.ComponentProps<typeof NextLink>>(function Link(
  { href, ...props },
  ref,
) {
  const locale = useContext(Ctx)
  const h = typeof href === 'string' && locale ? localizePath(href, locale) : href
  return <NextLink ref={ref} href={h} {...props} />
})
export default Link

export function setLanguageCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

/** Path of the current page in another language. */
export function usePathInLocale() {
  const pathname = usePathname()
  return useMemo(
    () => (next: Locale) => {
      const { rest } = stripLocale(pathname || '/')
      return localizePath(rest, next)
    },
    [pathname],
  )
}

/** Remembers the language and, for a signed-in customer, saves it on their account. */
export async function saveLanguage(next: Locale, userId?: string | number | null) {
  setLanguageCookie(next)
  if (userId) {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: next }),
      })
    } catch {
      /* the cookie still keeps the choice on this device */
    }
  }
}
