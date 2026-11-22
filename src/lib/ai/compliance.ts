/**
 * Compliance Engine: everything the AI wants to show a customer is checked against the real prices, stock, discounts and
 * the customer's consent. Plain code (no AI), so it keeps working when the model is down. What does not match is blocked or corrected.
 */
export type CatalogItem = { id: string; slug?: string; title: string; price: number | null; inventory: number | null; discountPercent?: number }

export type PolicyRule = { key: string; enabled: boolean; action: 'block' | 'correct' | 'log'; value?: number | null }

export const DEFAULT_POLICY: PolicyRule[] = [
  { key: 'price_match', enabled: true, action: 'correct' },
  { key: 'stock_match', enabled: true, action: 'correct' },
  { key: 'discount_valid', enabled: true, action: 'block' },
  { key: 'max_discount_percent', enabled: true, action: 'block', value: 30 },
  { key: 'consent_required', enabled: true, action: 'block' },
  { key: 'no_unknown_products', enabled: true, action: 'block' },
]

export type Violation = { rule: string; detail: string; action: PolicyRule['action'] }
export type Decision = { decision: 'allowed' | 'corrected' | 'blocked'; violations: Violation[] }

export function mergePolicy(rows: { key: string; enabled?: boolean | null; action?: string | null; value?: number | null }[]): PolicyRule[] {
  const by = new Map(rows.map((r) => [r.key, r]))
  return DEFAULT_POLICY.map((d) => {
    const o = by.get(d.key)
    return o ? { key: d.key, enabled: o.enabled !== false, action: (o.action as PolicyRule['action']) ?? d.action, value: o.value ?? d.value } : d
  })
}

const rule = (policy: PolicyRule[], key: string) => policy.find((r) => r.key === key && r.enabled)

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

/** A proposal from the AI: products it wants to show, with the claims it makes about them. */
export type Proposal = { id: string; price?: number | null; inStock?: boolean; discountPercent?: number; usesPersonalData?: boolean }

export function checkProposal(items: Proposal[], catalog: CatalogItem[], policy: PolicyRule[], consent: boolean) {
  const by = new Map(catalog.map((c) => [c.id, c]))
  const violations: Violation[] = []
  const shown: Proposal[] = []
  for (const p of items) {
    const real = by.get(p.id)
    const bad: Violation[] = []
    const r = (key: string, detail: string) => {
      const pr = rule(policy, key)
      if (pr) bad.push({ rule: key, detail, action: pr.action })
    }
    if (!real) r('no_unknown_products', `Product ${p.id} does not exist.`)
    else {
      if (p.price != null && real.price != null && p.price !== real.price) r('price_match', `${real.title}: price ${money(p.price)} is not the real price ${money(real.price)}.`)
      if (p.inStock === true && (real.inventory ?? 0) <= 0) r('stock_match', `${real.title} is not in stock.`)
      if (p.discountPercent != null) {
        const max = rule(policy, 'max_discount_percent')?.value ?? 100
        if (p.discountPercent > max) r('max_discount_percent', `${real.title}: ${p.discountPercent}% is above the allowed ${max}%.`)
        if ((real.discountPercent ?? 0) !== p.discountPercent) r('discount_valid', `${real.title}: ${p.discountPercent}% is not a discount that exists.`)
      }
    }
    if (p.usesPersonalData && !consent) r('consent_required', 'Personal data used without the consent of the customer.')
    violations.push(...bad)
    // a blocking violation removes the product; a correcting one replaces the claim with the real data
    if (bad.some((v) => v.action === 'block')) continue
    shown.push(bad.length && real ? { id: p.id, price: real.price, inStock: (real.inventory ?? 0) > 0, discountPercent: real.discountPercent } : p)
  }
  const decision: Decision['decision'] = !violations.length ? 'allowed' : violations.some((v) => v.action === 'block') ? 'blocked' : violations.some((v) => v.action === 'correct') ? 'corrected' : 'allowed'
  return { decision, violations, shown }
}

/**
 * Checks the text of an AI answer. Prices written next to a product name must be the real price (corrected in the text),
 * and "in stock" claims must be true. Returns the text that may be shown.
 */
export function checkAnswerText(text: string, catalog: CatalogItem[], policy: PolicyRule[]) {
  const violations: Violation[] = []
  let out = text
  const sentences = text.split(/(?<=[.!?\n])\s+/)
  for (const s of sentences) {
    const mentioned = catalog.filter((c) => c.title.length >= 3 && s.toLowerCase().includes(c.title.toLowerCase()))
    if (mentioned.length !== 1) continue // with several products in one sentence a price cannot be tied to one
    const item = mentioned[0]
    const priceRule = rule(policy, 'price_match')
    if (priceRule && item.price != null) {
      for (const m of s.matchAll(/[$€]\s?(\d{1,6}(?:[.,]\d{1,2})?)/g)) {
        const said = Math.round(parseFloat(m[1].replace(',', '.')) * 100)
        if (said !== item.price) {
          violations.push({ rule: 'price_match', detail: `${item.title}: said ${m[0]}, real ${money(item.price)}`, action: priceRule.action })
          if (priceRule.action === 'correct') out = out.replace(m[0], money(item.price))
        }
      }
    }
    const stockRule = rule(policy, 'stock_match')
    if (stockRule && /\b(in stock|available|op voorraad)\b/i.test(s) && !/\b(not|no longer|out of)\b/i.test(s) && (item.inventory ?? 0) <= 0) {
      violations.push({ rule: 'stock_match', detail: `${item.title} is not in stock`, action: stockRule.action })
      if (stockRule.action === 'correct') out = out.replace(s, `${item.title} is currently out of stock.`)
    }
  }
  const blocked = violations.some((v) => v.action === 'block')
  const decision: Decision['decision'] = !violations.length ? 'allowed' : blocked ? 'blocked' : violations.some((v) => v.action === 'correct') ? 'corrected' : 'allowed'
  return { decision, violations, text: blocked ? '' : out }
}
