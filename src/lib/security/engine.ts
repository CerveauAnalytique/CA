import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { Payload, Where } from 'payload'
import { ACTIONS, DEFAULT_RULES, RESTRICT_MINUTES_CRITICAL, RESTRICT_MINUTES_HIGH, levelOf, retentionDays, type Level, type Rule } from './config'
import { cleanEvidence, hashIp, maskEmail, maskIp } from './privacy'

export type SecurityInput = {
  category: string
  ip?: string
  userId?: string | number | null
  email?: string
  evidence?: Record<string, unknown>
}

export type Verdict = { level: Level; score: number; rules: string[]; blocked: boolean; action: string }

/** The built-in rules with the overrides of the admin panel applied. */
export async function loadRules(payload: Payload): Promise<Rule[]> {
  const overrides = await payload.find({ collection: 'security-rules', limit: 100, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as never[] }))
  const byKey = new Map((overrides.docs as unknown as { key: string; enabled?: boolean; score?: number; threshold?: number; windowMinutes?: number }[]).map((o) => [o.key, o]))
  return DEFAULT_RULES.flatMap((r) => {
    const o = byKey.get(r.key)
    if (o && o.enabled === false) return []
    return [{ ...r, score: o?.score ?? r.score, threshold: o?.threshold ?? r.threshold, windowMinutes: o?.windowMinutes ?? r.windowMinutes }]
  })
}

/** Is there an active block on this user or network? */
export async function activeBlock(payload: Payload, who: { userId?: string | number | null; ipHash?: string }) {
  const subjects: Where[] = []
  if (who.userId != null) subjects.push({ and: [{ subjectType: { equals: 'user' } }, { subjectId: { equals: String(who.userId) } }] })
  if (who.ipHash) subjects.push({ and: [{ subjectType: { equals: 'ip' } }, { subjectId: { equals: who.ipHash } }] })
  if (!subjects.length) return null
  const res = await payload.find({
    collection: 'security-blocks',
    where: { and: [{ active: { equals: true } }, { until: { greater_than: new Date().toISOString() } }, { or: subjects }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (res.docs[0] as unknown as { id: number; level: Level; reason: string; until: string } | undefined) ?? null
}

async function logLine(line: string) {
  try {
    const file = process.env.SECURITY_LOG_FILE || path.join(process.cwd(), 'storage', 'logs', 'security.log')
    await mkdir(path.dirname(file), { recursive: true })
    await appendFile(file, `${new Date().toISOString()} ${line}\n`)
  } catch {
    /* logging must never break a request */
  }
}

async function notifyAdmin(payload: Payload, subject: string, text: string) {
  const to = process.env.SECURITY_ALERT_EMAIL
  if (!to || !process.env.SMTP_HOST) return false
  try {
    await payload.sendEmail({ to, subject, text })
    return true
  } catch {
    return false
  }
}

/**
 * Records one activity, scores it against the rules, and acts: LOW logged, MEDIUM flagged, HIGH restricted + alert,
 * CRITICAL blocked + sessions ended + alert. Accounts are never deleted and money is never touched.
 */
export async function recordEvent(payload: Payload, input: SecurityInput): Promise<Verdict> {
  const ipHash = input.ip && input.ip !== 'unknown' ? hashIp(input.ip) : undefined
  const userId = input.userId != null ? String(input.userId) : undefined
  const evidence = cleanEvidence({ ...input.evidence, ...(input.email ? { email: input.email } : {}) })
  const since = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

  // the new event counts too, so store it first with score 0 and update the verdict afterwards
  const created = await payload.create({
    collection: 'security-events',
    data: { category: input.category, level: 'LOW', score: 0, userId, ipHash, ipMasked: input.ip ? maskIp(input.ip) : undefined, evidence: { ...evidence, ...(input.email ? { emailHash: hashIp(input.email.toLowerCase()) } : {}) } },
    overrideAccess: true,
  })

  const fired: { rule: Rule; count: number }[] = []
  for (const rule of await loadRules(payload)) {
    if (rule.category !== input.category) continue
    // guests have no account: their network stands in for the user
    const byIp = rule.by === 'ip' || !userId
    const subject = byIp ? ipHash : userId
    if (!subject) continue
    const res = await payload.find({
      collection: 'security-events',
      where: { and: [{ category: { equals: rule.category } }, { createdAt: { greater_than: since(rule.windowMinutes) } }, byIp ? { ipHash: { equals: subject } } : { userId: { equals: subject } }] },
      limit: 500,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    const docs = res.docs as unknown as { ipHash?: string; evidence?: Record<string, unknown> }[]
    const count = rule.distinct ? new Set(docs.map((d) => (rule.distinct === 'ipHash' ? d.ipHash : (d.evidence as { emailHash?: string } | undefined)?.emailHash)).filter(Boolean)).size : docs.length
    if (count >= rule.threshold) fired.push({ rule, count })
  }

  const top = fired.reduce((m, f) => Math.max(m, f.rule.score), 0)
  const score = Math.min(100, top ? top + (fired.length - 1) * 5 : 0)
  const level = levelOf(score)
  const rules = fired.map((f) => f.rule.key)
  const critical = level === 'CRITICAL'

  await payload.update({ collection: 'security-events', id: created.id, data: { level, score, rules: rules.join(','), blocked: critical }, overrideAccess: true })

  const already = level === 'HIGH' || critical ? await activeBlock(payload, { userId, ipHash }) : null
  // one alert per incident: while a block of the same or higher level is active, more events are only logged
  if ((level === 'HIGH' || critical) && !(already && (already.level === 'CRITICAL' || !critical))) {
    const summary = `${level}: ${fired.map((f) => f.rule.label).join('; ')}${userId ? ` (user ${userId})` : ''}${input.ip ? ` from ${maskIp(input.ip)}` : ''}`
    const alert = await payload.create({ collection: 'security-alerts', data: { summary, level, event: created.id, userId, notified: false }, overrideAccess: true })
    const minutes = critical ? RESTRICT_MINUTES_CRITICAL : RESTRICT_MINUTES_HIGH
    const until = new Date(Date.now() + minutes * 60_000).toISOString()
    const subjects: { subjectType: 'user' | 'ip'; subjectId: string }[] = []
    // a rule about one account blocks that account only (not everybody behind the same network);
    // a rule about a network (brute force, stuffing, bots) blocks the network
    const topRule = [...fired].sort((a, b) => b.rule.score - a.rule.score)[0].rule
    if (userId) subjects.push({ subjectType: 'user', subjectId: userId })
    if (ipHash && (topRule.by === 'ip' || !userId)) subjects.push({ subjectType: 'ip', subjectId: ipHash })
    for (const s of subjects) {
      await payload.create({ collection: 'security-blocks', data: { ...s, reason: summary, level: critical ? 'CRITICAL' : 'HIGH', until, alert: alert.id }, overrideAccess: true })
    }
    if (critical && userId) await endSessions(payload, userId)
    await logLine(`${level} ${summary} -> ${ACTIONS[level]}`)
    const sent = await notifyAdmin(payload, `[CA7 security] ${summary}`, `${summary}\n\nAction: ${ACTIONS[level]}\nOpen the alert in the admin panel > Security.`)
    if (sent) await payload.update({ collection: 'security-alerts', id: alert.id, data: { notified: true }, overrideAccess: true })
  }

  return { level, score, rules, blocked: critical || level === 'HIGH', action: ACTIONS[level] }
}

/** Logs the user out everywhere: their sessions are removed, so every token stops working at once. */
export async function endSessions(payload: Payload, userId: string | number) {
  await payload.update({ collection: 'users', id: userId, data: { sessions: [] } as never, overrideAccess: true }).catch(() => undefined)
}

/** Review of an alert. A false positive lifts everything that alert blocked. */
export async function reviewAlert(payload: Payload, alertId: string | number, decision: 'confirmed' | 'false_positive', adminId: string | number, note?: string) {
  await payload.update({ collection: 'security-alerts', id: alertId, data: { status: decision, reviewedBy: String(adminId), note }, overrideAccess: true })
  if (decision === 'false_positive') {
    await payload.update({ collection: 'security-blocks', where: { alert: { equals: alertId } }, data: { active: false }, overrideAccess: true })
  }
}

export async function setSuspended(payload: Payload, userId: string | number, suspended: boolean, reason?: string) {
  await payload.update({ collection: 'users', id: userId, data: { suspended, suspendedReason: suspended ? reason || 'Suspended by an admin' : null } as never, overrideAccess: true })
  if (suspended) await endSessions(payload, userId)
}

/** Removes events older than the retention period (default 180 days) and expired blocks. */
export async function cleanup(payload: Payload) {
  const cutoff = new Date(Date.now() - retentionDays() * 86_400_000).toISOString()
  const events = await payload.delete({ collection: 'security-events', where: { createdAt: { less_than: cutoff } }, overrideAccess: true })
  const blocks = await payload.update({ collection: 'security-blocks', where: { and: [{ active: { equals: true } }, { until: { less_than: new Date().toISOString() } }] }, data: { active: false }, overrideAccess: true })
  return { eventsDeleted: events.docs.length, blocksExpired: blocks.docs.length }
}

export { maskEmail }

/** Orders are checked against the real prices: the amount must equal the sum of price x quantity. */
export function verifyOrderPrices(items: { quantity: number; price: number | null | undefined }[], amount: number | null | undefined) {
  if (typeof amount !== 'number') return { ok: true as const, expected: undefined }
  if (items.some((i) => typeof i.price !== 'number')) return { ok: true as const, expected: undefined }
  const expected = items.reduce((a, i) => a + (i.price as number) * i.quantity, 0)
  return expected === amount ? { ok: true as const, expected } : { ok: false as const, expected }
}
