import { sendOrderAccessEmail } from '@/components/forms/FindOrderForm/sendOrderAccessEmail'
import { clientKey, rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/** POST /api/ca/orders/find { email, orderID }: e-mails a link to the order (always answers success, so nobody can probe orders). */
export async function POST(request: Request) {
  const limited = rateLimit(`find-order:${clientKey(request)}`, 5, 10 * 60 * 1000)
  if (!limited.ok) return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } })
  const body = await request.json().catch(() => ({}))
  if (typeof body?.email !== 'string' || !body.email.includes('@') || !body.orderID) return Response.json({ error: 'Email and order number are required.' }, { status: 400 })
  return Response.json(await sendOrderAccessEmail({ email: body.email.trim(), orderID: String(body.orderID).trim() }))
}
