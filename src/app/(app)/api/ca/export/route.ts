import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { buildExport, CORS_HEADERS } from '@/lib/caData'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * GET /api/ca/export?collections=orders,posts
 * Auth: session cookie, or header `Authorization: users API-Key <your key>`.
 * Returns the data the caller is allowed to read (normal access rules apply).
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return Response.json(
      { error: 'Unauthorized. Send `Authorization: users API-Key <key>` or log in.' },
      { status: 401, headers: CORS_HEADERS },
    )
  }

  const only = new URL(request.url).searchParams.get('collections')?.split(',').filter(Boolean)
  const body = await buildExport(payload, user, only)

  return Response.json(body, { headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } })
}
