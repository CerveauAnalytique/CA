import type { Payload } from 'payload'
import { checkAnswerText, checkProposal, mergePolicy, type CatalogItem, type Decision, type PolicyRule, type Proposal, type Violation } from './compliance'

type Feature = 'assistant' | 'recommendations' | 'offers' | 'running_low' | 'search'

export async function loadCatalog(payload: Payload): Promise<CatalogItem[]> {
  const res = await payload.find({ collection: 'products', where: { _status: { equals: 'published' } }, limit: 500, depth: 1, pagination: false, overrideAccess: true })
  return (res.docs as unknown as { id: number; title: string; priceInUSD?: number | null; inventory?: number | null; enableVariants?: boolean; variants?: { docs?: { priceInUSD?: number | null; inventory?: number | null }[] } }[]).map((p) => {
    const vs = p.enableVariants ? (p.variants?.docs ?? []).filter((v) => typeof v === 'object') : []
    return {
      id: String(p.id),
      title: p.title,
      price: vs.length ? Math.min(...vs.map((v) => v.priceInUSD ?? Number.MAX_SAFE_INTEGER)) : (p.priceInUSD ?? null),
      inventory: vs.length ? vs.reduce((a, v) => a + (v.inventory ?? 0), 0) : (p.inventory ?? null),
    }
  })
}

export async function loadPolicy(payload: Payload): Promise<PolicyRule[]> {
  const rows = await payload.find({ collection: 'ai-policy-rules', limit: 100, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] }))
  return mergePolicy(rows.docs as never)
}

export async function loadSettings(payload: Payload) {
  const s = (await payload.findGlobal({ slug: 'ai-settings', depth: 0, overrideAccess: true }).catch(() => null)) as unknown as {
    flags?: Record<string, boolean>
    activeVersion?: string
    rankingVersions?: { version: string; popularity: number; coPurchase: number; personal: number }[]
  } | null
  const flags = { assistant: true, recommendations: true, offers: true, runningLow: true, smartSearch: true, ...(s?.flags ?? {}) }
  const versions = s?.rankingVersions?.length ? s.rankingVersions : [{ version: 'v1', popularity: 1, coPurchase: 2, personal: 3 }]
  const active = versions.find((v) => v.version === s?.activeVersion) ?? versions[0]
  return { flags, active, versions }
}

/** Writes the decision of the Compliance Engine to the log (the trace holds no personal data). */
export async function logDecision(payload: Payload, feature: Feature, d: { decision: Decision['decision']; violations: Violation[] }, userId?: string | number | null, trace?: Record<string, unknown>) {
  await payload.create({ collection: 'ai-decisions', data: { feature, decision: d.decision, violations: d.violations.length, userId: userId != null ? String(userId) : undefined, trace: { violations: d.violations, ...trace } }, overrideAccess: true }).catch(() => undefined)
}

// ---- recommendations -----------------------------------------------------------------------------------------------

type OrderRow = { items?: { product?: number | { id: number } | null; quantity?: number }[] | null; createdAt: string; customer?: number | { id: number } | null }
const pid = (p: unknown) => String(typeof p === 'object' && p ? (p as { id: number }).id : p)

async function orders(payload: Payload, where?: object): Promise<OrderRow[]> {
  return (await payload.find({ collection: 'orders', where: where as never, limit: 2000, depth: 0, pagination: false, sort: '-createdAt', overrideAccess: true })).docs as unknown as OrderRow[]
}

export type Rec = { id: string; title: string; price: number | null; score: number; reason: string; sponsored?: boolean }

/**
 * Ranking: popularity + bought together with the given products + (only with consent) the customer's own history,
 * weighted by the active ranking version; sponsored placements get their boost and are always labelled.
 */
export async function recommend(payload: Payload, opts: { productIds?: string[]; userId?: string | number | null; consent: boolean; limit?: number }) {
  const [catalog, policy, settings, all, sponsored] = await Promise.all([
    loadCatalog(payload),
    loadPolicy(payload),
    loadSettings(payload),
    orders(payload),
    payload.find({ collection: 'ai-sponsored', where: { active: { equals: true } }, limit: 20, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] })),
  ])
  const w = settings.active
  const pop = new Map<string, number>()
  const co = new Map<string, number>()
  const mine = new Map<string, number>()
  const seed = new Set(opts.productIds ?? [])
  for (const o of all) {
    const ids = (o.items ?? []).map((i) => pid(i.product))
    for (const id of ids) pop.set(id, (pop.get(id) ?? 0) + 1)
    if (ids.some((id) => seed.has(id))) for (const id of ids) if (!seed.has(id)) co.set(id, (co.get(id) ?? 0) + 1)
    if (opts.consent && opts.userId != null && String(typeof o.customer === 'object' ? o.customer?.id : o.customer) === String(opts.userId)) for (const id of ids) mine.set(id, (mine.get(id) ?? 0) + 1)
  }
  const boost = new Map((sponsored.docs as unknown as { product: number | { id: number }; boost?: number }[]).map((s) => [pid(s.product), s.boost ?? 1.5]))
  const max = (m: Map<string, number>) => Math.max(1, ...m.values())
  const mp = max(pop), mc = max(co), mm = max(mine)
  let recs: (Rec & { personal?: boolean })[] = catalog
    .filter((c) => !seed.has(c.id) && (c.inventory ?? 0) > 0)
    .map((c) => {
      const a = (pop.get(c.id) ?? 0) / mp, b = (co.get(c.id) ?? 0) / mc, p = (mine.get(c.id) ?? 0) / mm
      let score = w.popularity * a + w.coPurchase * b + w.personal * p
      const reasons = [b > 0 ? 'Bought together with your products' : '', p > 0 ? 'Based on your own orders' : '', a > 0 && !b && !p ? 'Popular' : ''].filter(Boolean)
      const sp = boost.has(c.id)
      if (sp) score *= boost.get(c.id)!
      return { id: c.id, title: c.title, price: c.price, score: Math.round(score * 100) / 100, reason: reasons[0] ?? 'Available now', sponsored: sp, personal: p > 0 }
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, opts.limit ?? 6)
  // the Compliance Engine has the last word
  const proposal: Proposal[] = recs.map((r) => ({ id: r.id, price: r.price, inStock: true, usesPersonalData: r.personal }))
  const check = checkProposal(proposal, catalog, policy, opts.consent)
  const ok = new Set(check.shown.map((s) => s.id))
  recs = recs.filter((r) => ok.has(r.id))
  await logDecision(payload, 'recommendations', check, opts.userId, { version: w.version, shown: recs.length })
  return { items: recs.map(({ personal: _p, ...r }) => r), version: w.version, decision: check.decision }
}

/** "Running low?": things the customer bought repeatedly and that are due again (needs consent). */
export async function runningLow(payload: Payload, userId: string | number, consent: boolean) {
  if (!consent) return { items: [], needsConsent: true }
  const [catalog, mine] = await Promise.all([loadCatalog(payload), orders(payload, { customer: { equals: userId } })])
  const times = new Map<string, number[]>()
  for (const o of mine) for (const i of o.items ?? []) times.set(pid(i.product), [...(times.get(pid(i.product)) ?? []), new Date(o.createdAt).getTime()])
  const items: { id: string; title: string; price: number | null; daysSince: number; usualDays: number }[] = []
  for (const [id, ts] of times) {
    if (ts.length < 2) continue
    const sorted = [...ts].sort((a, b) => a - b)
    const gaps = sorted.slice(1).map((t, i) => t - sorted[i])
    const usual = gaps.reduce((a, b) => a + b, 0) / gaps.length / 86_400_000
    const since = (Date.now() - sorted[sorted.length - 1]) / 86_400_000
    const c = catalog.find((x) => x.id === id)
    if (c && (c.inventory ?? 0) > 0 && usual > 0 && since >= usual * 0.8) items.push({ id, title: c.title, price: c.price, daysSince: Math.round(since), usualDays: Math.round(usual) })
  }
  await logDecision(payload, 'running_low', { decision: 'allowed', violations: [] }, userId, { shown: items.length })
  return { items, needsConsent: false }
}

// ---- assistant -------------------------------------------------------------------------------------------------------

const API_URL = () => (process.env.CA7_API_URL || 'http://127.0.0.1:11434').replace(/\/$/, '')

/** The AI shopping assistant: the model gets the real catalog; its answer is checked before the customer sees it. */
export async function assistantAnswer(payload: Payload, messages: { role: 'user' | 'assistant'; content: string }[], userId?: string | number | null) {
  const [catalog, policy] = await Promise.all([loadCatalog(payload), loadPolicy(payload)])
  const lines = catalog.slice(0, 80).map((c) => `- ${c.title}: ${c.price == null ? 'no price' : `$${(c.price / 100).toFixed(2)}`}, ${(c.inventory ?? 0) > 0 ? 'in stock' : 'out of stock'}`).join('\n')
  const system = `You are the CA7 shopping assistant. Only recommend products from this list and use exactly these prices and stock. If you are unsure, say so. Never invent discounts.\n\n${lines}`
  let raw = ''
  try {
    const res = await fetch(`${API_URL()}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.CA7_MODEL || 'ca7', stream: false, messages: [{ role: 'system', content: system }, ...messages.slice(-10)] }), signal: AbortSignal.timeout(90_000) })
    if (!res.ok) throw new Error(String(res.status))
    raw = ((await res.json()) as { message?: { content?: string } }).message?.content ?? ''
  } catch {
    return { text: 'The assistant is offline right now. You can still search the shop.', decision: 'allowed' as const, offline: true }
  }
  const check = checkAnswerText(raw, catalog, policy)
  await logDecision(payload, 'assistant', check, userId, { chars: raw.length })
  if (check.decision === 'blocked') return { text: 'I could not give a reliable answer to that. Please check the product pages for prices and stock.', decision: 'blocked' as const, offline: false }
  return { text: check.text, decision: check.decision, offline: false }
}
