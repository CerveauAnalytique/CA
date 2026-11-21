import { NextResponse, type NextRequest } from 'next/server'
import { GATE_COOKIE, verifyGateCookie } from '@/lib/adminGate'

/**
 * This server is the CA7 backend: the Payload admin panel and the API. The website is the Flutter app (flutter_app/).
 *
 * 1. /admin is hidden: it only opens after an admin used their own /{username}/ad/{token} link.
 *    Exception: while no account exists yet, /admin stays open so the first admin can be created.
 * 2. The Flutter web app (another address) may call /api/ca/* and /api/search: origins in CA7_APP_ORIGINS get CORS headers.
 * 3. Any other page address is sent to the app (CA7_APP_URL), so old links keep working.
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
  return new NextResponse('Not found', { status: 404 })
}

const appOrigins = () => (process.env.CA7_APP_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)

function withCors(request: NextRequest, res: NextResponse) {
  const origin = request.headers.get('origin')
  if (origin && appOrigins().includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-CA7-Token')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.headers.set('Vary', 'Origin')
  }
  return res
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith('/api/ca/') || pathname === '/api/search') {
    if (request.method === 'OPTIONS') return withCors(request, new NextResponse(null, { status: 204 }))
    return withCors(request, NextResponse.next())
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminGate(request)

  // the private admin link /{username}/ad/{token} and the preview routes are served here
  if (/^\/[^/]+\/ad\/[^/]+$/.test(pathname) || pathname.startsWith('/next/')) return NextResponse.next()

  const app = (process.env.CA7_APP_URL || '').replace(/\/$/, '')
  if (app) return NextResponse.redirect(`${app}${pathname}${search}`, 307)
  return new NextResponse('This is the CA7 backend (API and admin panel). The website is the CA7 app.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

// everything except Next internals, the API (except our own /api/ca routes) and files with an extension
export const config = { matcher: ['/((?!_next/|api/(?!ca/|search$)|.*\\..*).*)'] }
