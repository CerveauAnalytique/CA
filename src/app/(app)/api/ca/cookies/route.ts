import { whoAmI } from '@/lib/ai/auth'

export const dynamic = 'force-dynamic'

/** GET: the cookie choice saved on the account (decided: false when the customer never chose). */
export async function GET(request: Request) {
  const { user } = await whoAmI(request)
  if (!user) return Response.json({ loggedIn: false })
  const u = user as unknown as { cookieAnalytics?: boolean; cookieMarketing?: boolean; cookieDecidedAt?: string | null }
  return Response.json({ loggedIn: true, decided: Boolean(u.cookieDecidedAt), analytics: Boolean(u.cookieAnalytics), marketing: Boolean(u.cookieMarketing), decidedAt: u.cookieDecidedAt ?? null })
}

/** POST { analytics: boolean, marketing: boolean }: saves the choice on the account. Necessary cookies cannot be switched off. */
export async function POST(request: Request) {
  const { payload, user } = await whoAmI(request)
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const analytics = b.analytics === true
  const marketing = b.marketing === true
  const decidedAt = new Date().toISOString()
  await payload.update({ collection: 'users', id: user.id, data: { cookieAnalytics: analytics, cookieMarketing: marketing, cookieDecidedAt: decidedAt } as never, overrideAccess: true })
  return Response.json({ decided: true, analytics, marketing, decidedAt })
}
