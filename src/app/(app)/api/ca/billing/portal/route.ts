import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { siteUrl, stripeClient } from '@/lib/billing'

export const dynamic = 'force-dynamic'

/** POST /api/ca/billing/portal -> { url } where the customer manages or cancels the subscription. */
export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  const stripe = stripeClient()
  const customer = (user as unknown as { stripeCustomerId?: string | null }).stripeCustomerId
  if (!stripe || !customer) return Response.json({ error: 'No subscription found.' }, { status: 404 })
  try {
    const session = await stripe.billingPortal.sessions.create({ customer, return_url: `${siteUrl()}/dashboard/plan` })
    return Response.json({ url: session.url })
  } catch (e) {
    console.error('Stripe error', (e as Error).message)
    return Response.json({ error: 'The payment provider could not start this. Try again later.' }, { status: 502 })
  }
}
