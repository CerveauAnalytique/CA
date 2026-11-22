export const dynamic = 'force-dynamic'

/** GET: which ways of paying are switched on (the app shows only those). */
export async function GET() {
  return Response.json({
    mollie: Boolean(process.env.MOLLIE_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  })
}
