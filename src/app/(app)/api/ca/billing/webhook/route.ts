import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { CARD_PLANS, stripeClient } from '@/lib/billing'

export const dynamic = 'force-dynamic'

/** Stripe calls this when a subscription starts, changes or ends. Set STRIPE_WEBHOOKS_SIGNING_SECRET. */
export async function POST(request: Request) {
  const stripe = stripeClient()
  const secret = process.env.STRIPE_WEBHOOKS_SIGNING_SECRET
  const sig = request.headers.get('stripe-signature')
  if (!stripe || !secret || !sig) return Response.json({ error: 'Not configured.' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), sig, secret)
  } catch {
    return Response.json({ error: 'Bad signature.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const setPlan = async (userId: string | undefined, data: Record<string, unknown>) => {
    if (!userId) return
    await payload.update({ collection: 'users', id: userId, data, overrideAccess: true })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object
    const plan = s.metadata?.plan as keyof typeof CARD_PLANS | undefined
    if (plan && plan in CARD_PLANS) {
      await setPlan(s.metadata?.userId, {
        plan,
        stripeCustomerId: typeof s.customer === 'string' ? s.customer : s.customer?.id,
        stripeSubscriptionId: typeof s.subscription === 'string' ? s.subscription : s.subscription?.id,
      })
    }
  } else if (event.type === 'customer.subscription.deleted') {
    await setPlan(event.data.object.metadata?.userId, { plan: 'free', stripeSubscriptionId: null })
  }
  return Response.json({ received: true })
}
