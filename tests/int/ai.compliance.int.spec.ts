import { describe, it, expect } from 'vitest'
import { catalogAnswer } from '@/lib/ai/engine'
import { checkAnswerText, checkProposal, DEFAULT_POLICY, mergePolicy, type CatalogItem } from '@/lib/ai/compliance'

const catalog: CatalogItem[] = [
  { id: '1', title: 'CA7 Sensor Kit', price: 4900, inventory: 20 },
  { id: '2', title: 'CA7 Camera Module', price: 12900, inventory: 0 },
]

describe('Compliance Engine: proposals', () => {
  it('lets true claims through', () => {
    const r = checkProposal([{ id: '1', price: 4900, inStock: true }], catalog, DEFAULT_POLICY, false)
    expect(r.decision).toBe('allowed')
    expect(r.shown).toHaveLength(1)
  })
  it('corrects a wrong price and a false stock claim', () => {
    const r = checkProposal([{ id: '1', price: 100 }, { id: '2', price: 12900, inStock: true }], catalog, DEFAULT_POLICY, false)
    expect(r.decision).toBe('corrected')
    expect(r.violations.map((v) => v.rule).sort()).toEqual(['price_match', 'stock_match'])
    expect(r.shown.find((s) => s.id === '1')?.price).toBe(4900)
    expect(r.shown.find((s) => s.id === '2')?.inStock).toBe(false)
  })
  it('blocks unknown products, invented discounts and discounts over the maximum', () => {
    expect(checkProposal([{ id: '99' }], catalog, DEFAULT_POLICY, false).decision).toBe('blocked')
    expect(checkProposal([{ id: '1', discountPercent: 10 }], catalog, DEFAULT_POLICY, false).decision).toBe('blocked')
    const real = [{ ...catalog[0], discountPercent: 50 }]
    expect(checkProposal([{ id: '1', discountPercent: 50 }], real, DEFAULT_POLICY, false).violations.some((v) => v.rule === 'max_discount_percent')).toBe(true)
    const ok = [{ ...catalog[0], discountPercent: 10 }]
    expect(checkProposal([{ id: '1', discountPercent: 10 }], ok, DEFAULT_POLICY, false).decision).toBe('allowed')
  })
  it('blocks personal data without consent and allows it with consent', () => {
    expect(checkProposal([{ id: '1', usesPersonalData: true }], catalog, DEFAULT_POLICY, false).decision).toBe('blocked')
    expect(checkProposal([{ id: '1', usesPersonalData: true }], catalog, DEFAULT_POLICY, true).decision).toBe('allowed')
  })
  it('an admin can change what a rule does', () => {
    const policy = mergePolicy([{ key: 'price_match', enabled: true, action: 'block' }, { key: 'consent_required', enabled: false }])
    expect(checkProposal([{ id: '1', price: 1 }], catalog, policy, false).decision).toBe('blocked')
    expect(checkProposal([{ id: '1', usesPersonalData: true }], catalog, policy, false).decision).toBe('allowed')
  })
})

describe('Compliance Engine: answers', () => {
  it('corrects a wrong price in the text', () => {
    const r = checkAnswerText('The CA7 Sensor Kit costs $19.00 and is great.', catalog, DEFAULT_POLICY)
    expect(r.decision).toBe('corrected')
    expect(r.text).toContain('$49.00')
    expect(r.text).not.toContain('$19.00')
  })
  it('corrects a false in-stock claim', () => {
    const r = checkAnswerText('The CA7 Camera Module is in stock today.', catalog, DEFAULT_POLICY)
    expect(r.decision).toBe('corrected')
    expect(r.text).toContain('out of stock')
  })
  it('leaves correct answers alone and does not guess when two products share a sentence', () => {
    expect(checkAnswerText('The CA7 Sensor Kit costs $49.00.', catalog, DEFAULT_POLICY).decision).toBe('allowed')
    expect(checkAnswerText('CA7 Sensor Kit is $49.00 and CA7 Camera Module is $129.00.', catalog, DEFAULT_POLICY).decision).toBe('allowed')
  })
  it('blocks the whole answer when a rule says block', () => {
    const r = checkAnswerText('The CA7 Sensor Kit costs $1.00.', catalog, mergePolicy([{ key: 'price_match', action: 'block' }]))
    expect(r.decision).toBe('blocked')
    expect(r.text).toBe('')
  })
})

describe('assistant without a language model', () => {
  it('answers from the catalog with the real price and stock', () => {
    const r = catalogAnswer('how much is the camera module', catalog)
    expect(r.count).toBeGreaterThan(0)
    expect(r.text).toContain('CA7 Camera Module: $129.00, out of stock.')
  })
  it('says so when nothing fits', () => {
    expect(catalogAnswer('xyzzy', catalog).count).toBe(0)
  })
})
