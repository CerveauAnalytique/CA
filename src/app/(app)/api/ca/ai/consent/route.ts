import { whoAmI } from '@/lib/ai/auth'

export const dynamic = 'force-dynamic'

/** GET: current choice. POST { consent: boolean }: the customer allows (or stops) the AI to use their own order history. */
export async function GET(request: Request) {
  const { user } = await whoAmI(request)
  return Response.json({ consent: Boolean(user?.aiConsent), loggedIn: Boolean(user) })
}

export async function POST(request: Request) {
  const { payload, user } = await whoAmI(request)
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const consent = b.consent === true
  await payload.update({ collection: 'users', id: user.id, data: { aiConsent: consent, aiConsentAt: new Date().toISOString() }, overrideAccess: true })
  return Response.json({ consent })
}
