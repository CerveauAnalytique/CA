import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { recordEvent } from './engine'
import { ipOf } from './privacy'

/** Records an activity from a route handler without ever failing the request. */
export async function track(request: Request, category: string, userId?: string | number | null, evidence?: Record<string, unknown>) {
  try {
    const payload = await getPayload({ config: configPromise })
    await recordEvent(payload, { category, ip: ipOf(request.headers), userId, evidence })
  } catch {
    /* monitoring must not break a request */
  }
}
