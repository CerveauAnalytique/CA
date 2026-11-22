import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const csv = (v: unknown) => {
  const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** GET /api/ca/security/export: the audit log as CSV (IPs are masked, e-mails masked). Admins only. */
export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!(user as unknown as { roles?: string[] } | null)?.roles?.includes('admin')) return Response.json({ error: 'Admins only.' }, { status: 403 })
  const res = await payload.find({ collection: 'security-events', sort: '-createdAt', limit: 10000, depth: 0, pagination: false, overrideAccess: true })
  const head = ['time', 'category', 'level', 'score', 'userId', 'ip', 'rules', 'blocked', 'evidence']
  const rows = (res.docs as unknown as Record<string, unknown>[]).map((e) => [e.createdAt, e.category, e.level, e.score, e.userId, e.ipMasked, e.rules, e.blocked, e.evidence].map(csv).join(','))
  return new Response([head.join(','), ...rows].join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="ca7-security-log.csv"', 'Cache-Control': 'no-store' } })
}
