import { createHmac } from 'node:crypto'

/** GDPR: IP addresses are kept as a keyed hash (to count) plus a masked version (to read); e-mails in evidence are masked. */
const key = () => process.env.PAYLOAD_SECRET || 'dev'

export const hashIp = (ip: string) => createHmac('sha256', key()).update(`ip:${ip}`).digest('hex').slice(0, 32)

export function maskIp(ip: string) {
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::'
  const p = ip.split('.')
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : 'unknown'
}

export function maskEmail(email: string) {
  const [u, d] = email.split('@')
  if (!d) return 'invalid'
  return `${u.slice(0, 1)}${'*'.repeat(Math.max(1, Math.min(u.length - 1, 5)))}@${d}`
}

/** Never store these in evidence. */
const FORBIDDEN = /pass|token|secret|card|iban|cvc|authorization|cookie|apikey/i
export function cleanEvidence(e: Record<string, unknown> | undefined) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(e ?? {})) {
    if (FORBIDDEN.test(k)) continue
    out[k] = typeof v === 'string' && v.includes('@') && k.toLowerCase().includes('email') ? maskEmail(v) : v
  }
  return out
}

export function ipOf(headers: Headers | { get(name: string): string | null | undefined } | undefined): string {
  const get = (n: string) => headers?.get(n) ?? undefined
  return (get('x-forwarded-for')?.split(',')[0] || get('x-real-ip') || 'unknown').trim()
}
