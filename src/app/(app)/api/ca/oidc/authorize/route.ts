import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { enabled, findClient, makeCode } from '@/lib/oidc'

export const dynamic = 'force-dynamic'

/** GET /api/ca/oidc/authorize: the tool sends the visitor here; a CA7 login session (cookie) proves who they are. */
export async function GET(request: Request) {
  if (!enabled()) return Response.json({ error: 'OIDC is not configured.' }, { status: 404 })
  const url = new URL(request.url)
  const q = url.searchParams
  const client = findClient(q.get('client_id'))
  const redirect = q.get('redirect_uri') || ''
  // never redirect to an address that was not registered
  if (!client || !client.redirectUris.some((r) => redirect === r || (r.endsWith('/') && redirect.startsWith(r)))) {
    return Response.json({ error: 'invalid_client or redirect_uri' }, { status: 400 })
  }
  const fail = (error: string) => {
    const u = new URL(redirect)
    u.searchParams.set('error', error)
    if (q.get('state')) u.searchParams.set('state', q.get('state')!)
    return Response.redirect(u, 302)
  }
  if (q.get('response_type') !== 'code') return fail('unsupported_response_type')
  if (q.get('code_challenge') && q.get('code_challenge_method') !== 'S256') return fail('invalid_request')

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  const strategy = (user as unknown as { _strategy?: string } | null)?._strategy
  if (!user || strategy === 'api-key') {
    const back = `${url.pathname}${url.search}`
    return Response.redirect(new URL(`/login?redirect=${encodeURIComponent(back)}`, url.origin), 302)
  }
  const code = makeCode({ uid: String(user.id), cid: client.id, ru: redirect, nonce: q.get('nonce') || undefined, cc: q.get('code_challenge') || undefined })
  const u = new URL(redirect)
  u.searchParams.set('code', code)
  if (q.get('state')) u.searchParams.set('state', q.get('state')!)
  return Response.redirect(u, 302)
}
