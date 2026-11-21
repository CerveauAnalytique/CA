import Stripe from 'stripe'

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'sk_test_') return null
  return new Stripe(key)
}

/** Packs that can be bought by card. Business and Enterprise are by invoice: an admin sets the pack. */
export const CARD_PLANS = {
  hobby: { name: 'CA7 Hobby', amount: 2000 },
  pro: { name: 'CA7 Pro', amount: 9900 },
} as const

export const siteUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
