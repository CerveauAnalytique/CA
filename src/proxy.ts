import { NextResponse, type NextRequest } from 'next/server'
import { GATE_COOKIE, verifyGateCookie } from '@/lib/adminGate'
import {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  matchAcceptLanguage,
  stripLocale,
} from '@/i18n/config'

/**
 * 1. /admin is hidden: it only opens after an admin used their own /{username}/ad/{token} link.
 *    Exception: while no account exists yet, /admin stays open so the first admin can be created.
 * 2. Every other page lives under a language code: /nl/shop, /ar/models, ...
 *    - /nl/shop is rewritten to /shop and the language is passed on in a request header;
 *    - /shop (no code) is redirected to the visitor's language: cookie, then device language, then English.
 */
async function adminGate(request: NextRequest) {
  if (process.env.ADMIN_GATE === 'off') return NextResponse.next()
  if (await verifyGateCookie(request.cookies.get(GATE_COOKIE)?.value)) return NextResponse.next()
  try {
    const res = await fetch(new URL('/api/ca/admin-state', request.url), { cache: 'no-store' })
    if (res.ok && (await res.json()).hasUsers === false) return NextResponse.next()
  } catch {
    /* if the check fails, keep /admin closed */
  }
  return NextResponse.rewrite(new URL('/not-found-admin', request.url), { status: 404 })
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminGate(request)

  const { locale, rest } = stripLocale(pathname)

  if (locale) {
    // /nl/admin is not a thing
    if (rest === '/admin' || rest.startsWith('/admin/')) {
      return NextResponse.redirect(new URL(`${rest}${search}`, request.url))
    }
    const headers = new Headers(request.headers)
    headers.set(LOCALE_HEADER, locale)
    const res = NextResponse.rewrite(new URL(`${rest}${search}`, request.url), { request: { headers } })
    // tell search engines about the other languages of this page
    const origin = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') || request.nextUrl.origin
    const tail = rest === '/' ? '' : rest
    const alternates = LOCALES.map((l) => `<${origin}/${l}${tail}>; rel="alternate"; hreflang="${l}"`)
    alternates.push(`<${origin}/${DEFAULT_LOCALE}${tail}>; rel="alternate"; hreflang="x-default"`)
    res.headers.set('Link', alternates.join(', '))
    if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
      res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    }
    return res
  }

  // No language code: send the visitor to the right one.
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value
  const target = isLocale(fromCookie)
    ? fromCookie
    : (matchAcceptLanguage(request.headers.get('accept-language')) ?? DEFAULT_LOCALE)
  const url = new URL(`/${target}${pathname === '/' ? '' : pathname}${search}`, request.url)
  const res = NextResponse.redirect(url, 307)
  res.headers.set('Vary', 'Accept-Language, Cookie')
  return res
}

// everything except Next internals, the API and files with an extension (images, svg, robots.txt, ...)
export const config = { matcher: ['/((?!_next/|api/|.*\\..*).*)'] }
