import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/** GET /api/ca/orders/guest?id=&accessToken=&email= : one order for a shopper without an account (needs the secret link token). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  const id = q.get('id')
  const accessToken = q.get('accessToken')
  const email = q.get('email')
  if (!id || !accessToken) return Response.json({ error: 'Not found.' }, { status: 404 })
  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'orders',
    overrideAccess: true,
    depth: 2,
    limit: 1,
    where: { and: [{ id: { equals: id } }, { accessToken: { equals: accessToken } }, ...(email ? [{ customerEmail: { equals: email } }] : [])] },
    select: { amount: true, currency: true, items: true, customerEmail: true, shippingAddress: true, status: true, createdAt: true },
  })
  return found.docs[0] ? Response.json(found.docs[0]) : Response.json({ error: 'Not found.' }, { status: 404 })
}
