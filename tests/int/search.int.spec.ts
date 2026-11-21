import { describe, it, expect } from 'vitest'
import { score } from '@/lib/search'

describe('smart search scoring', () => {
  it('finds exact, prefix and typo matches, best first', () => {
    const exact = score('quickstart', 'Quickstart', '')
    const prefix = score('quick', 'Quickstart', '')
    const typo = score('quickstrt', 'Quickstart', '')
    expect(exact).toBeGreaterThan(prefix)
    expect(prefix).toBeGreaterThan(typo)
    expect(typo).toBeGreaterThan(0)
  })
  it('needs every word to match', () => {
    expect(score('api key', 'API Reference', 'Create a key in your dashboard')).toBeGreaterThan(0)
    expect(score('api banana', 'API Reference', 'Create a key')).toBe(0)
  })
  it('counts the title more than the text, and ignores accents and case', () => {
    expect(score('sensor', 'CA7 Sensor Kit', '')).toBeGreaterThan(score('sensor', 'Kit', 'a sensor'))
    expect(score('cafe', 'Café menu', '')).toBeGreaterThan(0)
  })
  it('returns 0 for nothing alike', () => {
    expect(score('zzzz', 'Pricing', 'Choose your pack')).toBe(0)
    expect(score('', 'Pricing', '')).toBe(0)
  })
})
