import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { checkRole } from '@/access/utilities'
import { GATE_COOKIE, GATE_MAX_AGE, signGateCookie, verifyAdminLink } from '@/lib/adminGate'

export const dynamic = 'force-dynamic'

/**
 * GET /{username}/ad/{token}
 * Only an admin who is logged in and opens their own link gets through to /admin.
 * Anything else looks like a page that does not exist.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
) {
  const { slug: username, token } = await params
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || !checkRole(['admin'], user) || !(await verifyAdminLink(user, username, token))) {
    notFound()
  }

  const res = NextResponse.redirect(new URL('/admin', request.url))
  res.cookies.set(GATE_COOKIE, await signGateCookie(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: GATE_MAX_AGE,
  })
  return res
}
