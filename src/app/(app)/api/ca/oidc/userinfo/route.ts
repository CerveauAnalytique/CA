import { verifyJwt } from '@/lib/oidc'

export const dynamic = 'force-dynamic'

async function handle(request: Request) {
  const claims = verifyJwt((request.headers.get('authorization') || '').replace(/^Bearer /, ''))
  if (!claims || claims.aud !== 'userinfo') return Response.json({ error: 'invalid_token' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } })
  const { sub, email, email_verified, name, preferred_username, locale } = claims
  return Response.json({ sub, email, email_verified, name, preferred_username, locale })
}
export const GET = handle
export const POST = handle
