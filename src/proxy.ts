import { NextResponse, type NextRequest } from 'next/server'
import { GATE_COOKIE, verifyGateCookie } from '@/lib/adminGate'

/**
 * /admin is hidden: it only opens after an admin used their own /{username}/ad/{token} link.
 * Exception: while no account exists yet, /admin stays open so the first admin can be created.
 */
export async function proxy(request: NextRequest) {
  if (process.env.ADMIN_GATE === 'off') return NextResponse.next()

  if (await verifyGateCookie(request.cookies.get(GATE_COOKIE)?.value)) {
    return NextResponse.next()
  }

  try {
    const res = await fetch(new URL('/api/ca/admin-state', request.url), { cache: 'no-store' })
    if (res.ok && (await res.json()).hasUsers === false) return NextResponse.next()
  } catch {
    /* if the check fails, keep /admin closed */
  }

  return NextResponse.rewrite(new URL('/not-found-admin', request.url), { status: 404 })
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
