import { createHash, createHmac, createPrivateKey, createPublicKey, createSign, createVerify, timingSafeEqual } from 'node:crypto'

/**
 * CA7 as an OpenID Connect provider (authorization code flow with PKCE), so one CA7 account signs in to the tools that
 * support OIDC login (ThingsBoard, OpenRemote through Keycloak). Configure with environment variables:
 *   CA7_OIDC_PRIVATE_KEY  RSA private key in PEM (use \n for new lines)
 *   CA7_OIDC_CLIENTS      JSON: [{"id":"thingsboard","secret":"...","redirectUris":["https://tb.example.com/login/oauth2/code/"]}]
 */
export type OidcClient = { id: string; secret: string; redirectUris: string[] }

export const issuer = () => `${(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/ca/oidc`

export function clients(): OidcClient[] {
  try {
    const v = JSON.parse(process.env.CA7_OIDC_CLIENTS || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export const findClient = (id: string | null) => clients().find((c) => c.id === id)

function privateKey() {
  const pem = (process.env.CA7_OIDC_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  if (!pem) return null
  try {
    return createPrivateKey(pem)
  } catch {
    return null
  }
}
export const enabled = () => Boolean(privateKey()) && clients().length > 0

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url')
const kid = () => {
  const k = privateKey()
  return k ? createHash('sha256').update(createPublicKey(k).export({ type: 'spki', format: 'der' })).digest('base64url').slice(0, 16) : ''
}

export function jwks() {
  const k = privateKey()
  if (!k) return { keys: [] }
  return { keys: [{ ...createPublicKey(k).export({ format: 'jwk' }), kid: kid(), use: 'sig', alg: 'RS256' }] }
}

export function signJwt(claims: Record<string, unknown>) {
  const k = privateKey()
  if (!k) throw new Error('OIDC is not configured')
  const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: kid() }))
  const body = b64(JSON.stringify(claims))
  const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(k)
  return `${head}.${body}.${b64(sig)}`
}

export function verifyJwt(token: string): Record<string, unknown> | null {
  const k = privateKey()
  const [h, b, s] = token.split('.')
  if (!k || !h || !b || !s) return null
  if (!createVerify('RSA-SHA256').update(`${h}.${b}`).verify(createPublicKey(k), Buffer.from(s, 'base64url'))) return null
  const claims = JSON.parse(Buffer.from(b, 'base64url').toString())
  return claims.exp && claims.exp > Date.now() / 1000 && claims.iss === issuer() ? claims : null
}

// ---- authorization codes: signed, valid for 60 seconds, usable once (per server instance) -------------------------

const secret = () => process.env.PAYLOAD_SECRET || ''
const used = new Map<string, number>()

export type CodePayload = { uid: string; cid: string; ru: string; nonce?: string; cc?: string; exp: number; jti: string }

export function makeCode(p: Omit<CodePayload, 'exp' | 'jti'>) {
  const body = b64(JSON.stringify({ ...p, exp: Math.floor(Date.now() / 1000) + 60, jti: b64(createHash('sha256').update(String(Math.random()) + Date.now()).digest()).slice(0, 16) }))
  return `${body}.${createHmac('sha256', secret()).update(`oidc-code:${body}`).digest('base64url')}`
}

export function readCode(code: string): CodePayload | null {
  const [body, sig] = code.split('.')
  if (!body || !sig) return null
  const want = createHmac('sha256', secret()).update(`oidc-code:${body}`).digest('base64url')
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null
  const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as CodePayload
  const now = Date.now() / 1000
  for (const [k, e] of used) if (e < now) used.delete(k)
  if (p.exp < now || used.has(p.jti)) return null
  used.set(p.jti, p.exp)
  return p
}

export const pkceOk = (challenge: string | undefined, verifier: string | null) =>
  !challenge || (!!verifier && createHash('sha256').update(verifier).digest('base64url') === challenge)

export const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
