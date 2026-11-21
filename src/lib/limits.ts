import type { Payload } from 'payload'

export type PlanId = 'free' | 'hobby' | 'pro' | 'business' | 'enterprise'

export type Limits = {
  /** connected data sources */
  sources: number
  /** API calls per month (export, ingest, insights) */
  apiCalls: number
  /** stored records, our measure of data storage */
  records: number
  /** chat requests per 10 minutes */
  chat: number
  /** CA7 Chat answers from the customer's own data */
  chatOnData: boolean
  anomalyDetection: boolean
  automation: boolean
  /** automation rules */
  automations: number
}

const INF = Number.POSITIVE_INFINITY

/** What each pack is allowed. These numbers match the texts on /pricing; change both together. */
export const LIMITS: Record<PlanId, Limits> = {
  free: { sources: 3, apiCalls: 1_000, records: 10_000, chat: 30, chatOnData: false, anomalyDetection: false, automation: false, automations: 0 },
  hobby: { sources: 10, apiCalls: 50_000, records: 500_000, chat: 60, chatOnData: false, anomalyDetection: false, automation: false, automations: 0 },
  pro: { sources: 50, apiCalls: 500_000, records: 5_000_000, chat: 120, chatOnData: true, anomalyDetection: true, automation: false, automations: 0 },
  business: { sources: INF, apiCalls: 5_000_000, records: 50_000_000, chat: 300, chatOnData: true, anomalyDetection: true, automation: true, automations: 100 },
  enterprise: { sources: INF, apiCalls: INF, records: INF, chat: 1000, chatOnData: true, anomalyDetection: true, automation: true, automations: INF },
}

type AnyUser = { id: string | number; plan?: string | null; roles?: string[] | null } | null | undefined

export function planOf(user: AnyUser): PlanId {
  const p = user?.plan
  return p && p in LIMITS ? (p as PlanId) : 'free'
}

/** Admins are not limited. */
export function limitsOf(user: AnyUser): Limits {
  if (user?.roles?.includes('admin')) return LIMITS.enterprise
  return LIMITS[planOf(user)]
}

const monthKey = () => new Date().toISOString().slice(0, 7)

/**
 * Counts one API call for this customer this month. Returns { ok: false } when the pack is used up.
 * The counter lives on the user (usageMonth, apiCallsMonth).
 */
export async function countApiCall(payload: Payload, user: AnyUser, cost = 1) {
  if (!user) return { ok: false as const, limit: 0, used: 0 }
  const limit = limitsOf(user).apiCalls
  const u = (await payload.findByID({ collection: 'users', id: user.id, depth: 0, overrideAccess: true })) as unknown as {
    usageMonth?: string | null
    apiCallsMonth?: number | null
  }
  const used = u.usageMonth === monthKey() ? (u.apiCallsMonth ?? 0) : 0
  if (used + cost > limit) return { ok: false as const, limit, used }
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { usageMonth: monthKey(), apiCallsMonth: used + cost },
    overrideAccess: true,
  })
  return { ok: true as const, limit, used: used + cost }
}

export function limitResponse(what: string, limit: number) {
  return Response.json(
    { error: `Your pack allows ${limit.toLocaleString('en-US')} ${what}. Upgrade your pack at /pricing.` },
    { status: 402 },
  )
}
