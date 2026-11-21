/**
 * Hidden admin entrance.
 *
 *   /{username}/ad/{token}   the only way into /admin for a logged-in admin
 *
 * The token is an HMAC of the user id with PAYLOAD_SECRET: unique per admin, unguessable,
 * and it needs no storage. Opening the link sets a signed cookie; the proxy (src/proxy.ts)
 * lets /admin through only while that cookie is valid.
 * Uses Web Crypto only, so it runs in the proxy and in route handlers.
 */

export const GATE_COOKIE = 'ca_admin_gate'
export const GATE_MAX_AGE = 60 * 60 * 12 // seconds

const enc = new TextEncoder()

async function hmacHex(message: string): Promise<string> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** URL-safe handle for the first path segment. */
export function adminSlug(user: { name?: string | null; email?: string | null }): string {
  const base = (user.name || user.email?.split('@')[0] || 'admin')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'admin'
}

export async function adminToken(userId: string | number): Promise<string> {
  return (await hmacHex(`admin-link:${userId}`)).slice(0, 40)
}

export async function adminUrl(user: {
  id: string | number
  name?: string | null
  email?: string | null
}): Promise<string> {
  return `/${adminSlug(user)}/ad/${await adminToken(user.id)}`
}

export async function verifyAdminLink(
  user: { id: string | number; name?: string | null; email?: string | null },
  username: string,
  token: string,
): Promise<boolean> {
  const expected = await adminToken(user.id)
  // evaluate both so timing does not reveal which part failed
  const okToken = safeEqual(expected, token)
  const okName = safeEqual(adminSlug(user), username)
  return okToken && okName
}

export async function signGateCookie(): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + GATE_MAX_AGE)
  return `${exp}.${await hmacHex(`gate:${exp}`)}`
}

export async function verifyGateCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false
  const [exp, sig] = value.split('.')
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false
  return safeEqual(await hmacHex(`gate:${exp}`), sig)
}
