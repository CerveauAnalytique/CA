import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { adminUrl } from '@/lib/adminGate'

export const dynamic = 'force-dynamic'

/** GET /api/ca/admin-link: the private link to the admin panel for a logged-in admin (not for API keys). */
export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  const u = user as unknown as { id: number; name?: string; username?: string; email?: string; roles?: string[]; _strategy?: string } | null
  if (!u || !u.roles?.includes('admin') || u._strategy === 'api-key') return Response.json({ error: 'Admins only.' }, { status: 403 })
  return Response.json({ path: await adminUrl(u) })
}
