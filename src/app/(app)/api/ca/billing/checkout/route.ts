import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { CARD_PLANS, siteUrl, stripeClient } from '@/lib/billing'

export const dynamic = 'force-dynamic'

/** POST /api/ca/billing/checkout { plan: 'hobby' | 'pro' } -> { url } of a Stripe Checkout page (monthly subscription). */
export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const plan = body?.plan as keyof typeof CARD_PLANS
  if (!(plan in CARD_PLANS)) return Response.json({ error: 'This pack is by invoice. Contact us.' }, { status: 400 })
  const stripe = stripeClient()
  if (!stripe) return Response.json({ error: 'Payments are not set up yet (STRIPE_SECRET_KEY).' }, { status: 503 })

  const p = CARD_PLANS[plan]
  const u = user as unknown as { id: string | number; email: string; stripeCustomerId?: string | null }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(u.stripeCustomerId ? { customer: u.stripeCustomerId } : { customer_email: u.email }),
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: p.amount, recurring: { interval: 'month' }, product_data: { name: p.name } } }],
      metadata: { userId: String(u.id), plan },
      subscription_data: { metadata: { userId: String(u.id), plan } },
      success_url: `${siteUrl()}/dashboard/plan?paid=1`,
      cancel_url: `${siteUrl()}/pricing`,
    })
    return Response.json({ url: session.url })
  } catch (e) {
    console.error('Stripe error', (e as Error).message)
    return Response.json({ error: 'The payment provider could not start this. Try again later.' }, { status: 502 })
  }
}
