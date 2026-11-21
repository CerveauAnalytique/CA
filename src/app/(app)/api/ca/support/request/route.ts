import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { clientKey, rateLimit } from '@/lib/rateLimit'
import { track } from '@/lib/security/track'

export const dynamic = 'force-dynamic'

/** POST /api/ca/support/request { subject, message, email, name?, topic? }  Sends a request to the support team (they answer within one working day). */
export async function POST(request: Request) {
  const limited = rateLimit(`support:${clientKey(request)}`, 5, 10 * 60_000)
  if (!limited.ok) {
    await track(request, 'rate_limited', null, { route: 'support' })
    return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } })
  }
  const b = await request.json().catch(() => ({}))
  const subject = typeof b.subject === 'string' ? b.subject.trim().slice(0, 200) : ''
  const message = typeof b.message === 'string' ? b.message.trim().slice(0, 5000) : ''
  const email = typeof b.email === 'string' ? b.email.trim().slice(0, 200) : ''
  if (!subject || message.length < 10 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: 'Fill in a subject, a message of at least 10 characters and a valid email.' }, { status: 400 })
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  const topic = typeof b.topic === 'string' && b.topic ? (await payload.find({ collection: 'support-topics', where: { slug: { equals: b.topic } }, limit: 1, depth: 0 })).docs[0] : undefined
  const doc = await payload.create({ collection: 'support-requests', data: { subject, message, email, name: typeof b.name === 'string' ? b.name.slice(0, 100) : undefined, topic: topic?.id, user: user?.id }, overrideAccess: true })
  const to = process.env.SUPPORT_EMAIL || process.env.SECURITY_ALERT_EMAIL
  if (to && process.env.SMTP_HOST) await payload.sendEmail({ to, subject: `[CA7 support] ${subject}`, text: `${message}\n\nFrom: ${email}\nRequest #${doc.id}` }).catch(() => undefined)
  return Response.json({ ok: true, id: doc.id })
}
