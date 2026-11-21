import { timingSafeEqual } from 'node:crypto'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cleanup } from '@/lib/security/engine'

export const dynamic = 'force-dynamic'

/** POST /api/ca/security/cleanup (Authorization: Bearer CA7_CRON_SECRET): daily clean-up of old events (SECURITY_RETENTION_DAYS, default 180). */
export async function POST(request: Request) {
  const secret = process.env.CA7_CRON_SECRET
  const given = (request.headers.get('authorization') || '').replace(/^Bearer /, '')
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  return Response.json(await cleanup(await getPayload({ config: configPromise })))
}
