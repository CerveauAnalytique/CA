import { MARKETPLACE_API_URL } from '@/lib/marketplace'

export const dynamic = 'force-dynamic'

// Only these Marketplace API paths are reachable through the proxy.
const ALLOWED = [/^static\/icons\/[\w.-]+$/, /^api\/apps\/[\w-]+\/download$/]

/** GET /api/ca/market/<path>: icons and package downloads from the Marketplace API. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/')
  if (!ALLOWED.some((re) => re.test(path))) {
    return new Response('Not found', { status: 404 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${MARKETPLACE_API_URL}/${path}`, {
      signal: AbortSignal.timeout(60_000),
    })
  } catch {
    return new Response('Marketplace is offline', { status: 503 })
  }

  const headers = new Headers()
  for (const h of ['content-type', 'content-disposition', 'content-length', 'cache-control']) {
    const v = upstream.headers.get(h)
    if (v) headers.set(h, v)
  }
  if (path.startsWith('static/')) headers.set('cache-control', 'public, max-age=3600')
  return new Response(upstream.body, { status: upstream.status, headers })
}
