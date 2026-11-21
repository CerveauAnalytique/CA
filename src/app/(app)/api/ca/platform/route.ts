import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { planOf } from '@/lib/limits'
import { PLATFORM, checkService, serviceUrl } from '@/lib/platform'

export const dynamic = 'force-dynamic'

/** GET /api/ca/platform - status of the platform tools (admins and the Enterprise pack). Same data as /dashboard/platform. */
export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  const isAdmin = Boolean((user as unknown as { roles?: string[] }).roles?.includes('admin'))
  if (!isAdmin && planOf(user as never) !== 'enterprise') return Response.json({ error: 'Part of the Enterprise pack.' }, { status: 403 })
  const services = await Promise.all(
    PLATFORM.map(async (s) => ({ id: s.id, name: s.name, role: s.role, text: s.text, env: s.env, defaultUrl: s.defaultUrl, url: serviceUrl(s), status: await checkService(s) })),
  )
  return Response.json({ services })
}
