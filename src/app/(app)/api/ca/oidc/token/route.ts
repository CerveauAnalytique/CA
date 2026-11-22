import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { findClient, issuer, pkceOk, readCode, safeEq, signJwt } from '@/lib/oidc'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
const err = (error: string, status = 400) => Response.json({ error }, { status, headers: NO_STORE })

/** POST /api/ca/oidc/token: swaps the code for an id_token and an access_token. */
export async function POST(request: Request) {
  const form = new URLSearchParams(await request.text())
  let id = form.get('client_id')
  let secret = form.get('client_secret')
  const basic = request.headers.get('authorization')
  if (basic?.startsWith('Basic ')) {
    const [i, ...rest] = Buffer.from(basic.slice(6), 'base64').toString().split(':')
    id = decodeURIComponent(i)
    secret = decodeURIComponent(rest.join(':'))
  }
  const client = findClient(id)
  if (!client || !secret || !safeEq(secret, client.secret)) return err('invalid_client', 401)
  if (form.get('grant_type') !== 'authorization_code') return err('unsupported_grant_type')

  const code = readCode(form.get('code') || '')
  if (!code || code.cid !== client.id || code.ru !== form.get('redirect_uri') || !pkceOk(code.cc, form.get('code_verifier'))) return err('invalid_grant')

  const payload = await getPayload({ config: configPromise })
  const user = await payload.findByID({ collection: 'users', id: code.uid, depth: 0, overrideAccess: true }).catch(() => null)
  if (!user) return err('invalid_grant')
  const u = user as unknown as { id: number; email: string; name?: string | null; username?: string | null; language?: string | null }
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: issuer(),
    sub: String(u.id),
    email: u.email,
    email_verified: true,
    name: u.name || u.email.split('@')[0],
    preferred_username: u.username || u.email,
    locale: u.language || 'en',
  }
  return Response.json(
    {
      token_type: 'Bearer',
      expires_in: 3600,
      access_token: signJwt({ ...claims, aud: 'userinfo', iat: now, exp: now + 3600 }),
      id_token: signJwt({ ...claims, aud: client.id, iat: now, exp: now + 3600, ...(code.nonce ? { nonce: code.nonce } : {}) }),
    },
    { headers: NO_STORE },
  )
}
