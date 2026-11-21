import { loadCatalog, loadPolicy, loadSettings, logDecision, recommend } from '@/lib/ai/engine'
import { checkProposal } from '@/lib/ai/compliance'
import { whoAmI } from '@/lib/ai/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ca/ai/offers  Bundles of products that are bought together. A discount is only shown when it exists
 * (the rule bundle_discount_percent in AI Control Center > Policy rules, default none) and stays under max_discount_percent.
 */
export async function GET(request: Request) {
  const { payload, user, consent } = await whoAmI(request)
  if (!(await loadSettings(payload)).flags.offers) return Response.json({ offers: [], disabled: true })
  const [catalog, policy, rec] = await Promise.all([loadCatalog(payload), loadPolicy(payload), recommend(payload, { userId: user?.id, consent, limit: 4 })])
  const rule = (await payload.find({ collection: 'ai-policy-rules', where: { key: { equals: 'bundle_discount_percent' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as unknown as { value?: number; enabled?: boolean } | undefined
  const percent = rule?.enabled !== false ? (rule?.value ?? 0) : 0
  const offers = rec.items.slice(0, 3).map((r) => ({ productId: r.id, title: r.title, price: r.price, discountPercent: percent || undefined, sponsored: r.sponsored }))
  // a discount from the rule counts as real for the check (it is the shop's own rule)
  const withRule = catalog.map((c) => ({ ...c, discountPercent: percent || undefined }))
  const check = checkProposal(offers.map((o) => ({ id: o.productId, price: o.price, discountPercent: o.discountPercent })), withRule, policy, consent)
  await logDecision(payload, 'offers', check, user?.id, { shown: check.shown.length })
  const ok = new Set(check.shown.map((s) => s.id))
  return Response.json({ offers: offers.filter((o) => ok.has(o.productId)) })
}
