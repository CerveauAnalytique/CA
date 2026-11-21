import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

/** Tells the /admin gate whether the very first account still has to be created. */
export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
  return Response.json({ hasUsers: totalDocs > 0 }, { headers: { 'Cache-Control': 'no-store' } })
}
