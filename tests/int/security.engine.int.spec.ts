import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { activeBlock, cleanup, recordEvent, reviewAlert, setSuspended, verifyOrderPrices } from '@/lib/security/engine'
import { cleanEvidence, hashIp, maskEmail, maskIp } from '@/lib/security/privacy'
import { levelOf } from '@/lib/security/config'

let payload: Payload
const cleanDb = async () => {
  for (const c of ['security-events', 'security-alerts', 'security-blocks'] as const) await payload.delete({ collection: c, where: { id: { exists: true } }, overrideAccess: true })
}

describe('security engine', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await cleanDb()
  })
  afterAll(cleanDb)

  it('maps scores to the four levels', () => {
    expect([0, 29, 30, 59, 60, 79, 80, 100].map(levelOf)).toEqual(['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL', 'CRITICAL'])
  })

  it('logs a normal login and does not alert', async () => {
    const v = await recordEvent(payload, { category: 'login_ok', ip: '203.0.113.5', userId: 'u-normal' })
    expect(v.level).toBe('LOW')
    expect((await payload.count({ collection: 'security-alerts', overrideAccess: true })).totalDocs).toBe(0)
  })

  it('brute force: HIGH at the 5th failed login, one alert and a restriction, not a second alert', async () => {
    let last
    for (let i = 0; i < 4; i++) last = await recordEvent(payload, { category: 'login_failed', ip: '198.51.100.7', email: `u${i}@x.nl` })
    expect(last!.level).toBe('LOW')
    const fifth = await recordEvent(payload, { category: 'login_failed', ip: '198.51.100.7', email: 'u0@x.nl' })
    expect(fifth.level).toBe('HIGH')
    expect(fifth.rules).toContain('brute_force')
    const sixth = await recordEvent(payload, { category: 'login_failed', ip: '198.51.100.7', email: 'u0@x.nl' })
    expect(sixth.level).toBe('HIGH')
    const block = await activeBlock(payload, { ipHash: hashIp('198.51.100.7') })
    expect(block?.level).toBe('HIGH')
    expect((await payload.count({ collection: 'security-alerts', where: { level: { equals: 'HIGH' } }, overrideAccess: true })).totalDocs).toBe(1)
  })

  it('a false positive lifts what the alert blocked', async () => {
    const alert = (await payload.find({ collection: 'security-alerts', limit: 1, overrideAccess: true })).docs[0]
    await reviewAlert(payload, alert.id, 'false_positive', 'admin-1')
    expect(await activeBlock(payload, { ipHash: hashIp('198.51.100.7') })).toBeNull()
  })

  it('credential stuffing (5 different e-mails from one network) is CRITICAL', async () => {
    let v
    for (let i = 0; i < 5; i++) v = await recordEvent(payload, { category: 'login_failed', ip: '192.0.2.44', email: `victim${i}@x.nl` })
    expect(v!.level).toBe('CRITICAL')
    expect(v!.rules).toContain('credential_stuffing')
    expect(v!.action).toContain('blocked')
  })

  it('privilege escalation and price manipulation are CRITICAL at once, and end the sessions of the user', async () => {
    const u = await payload.create({ collection: 'users', data: { email: `esc-${Date.now()}@example.com`, password: 'test-password-123', roles: ['customer'] }, overrideAccess: true })
    await payload.update({ collection: 'users', id: u.id, data: { roles: ['customer'] }, overrideAccess: true })
    const v = await recordEvent(payload, { category: 'privilege_escalation', ip: '192.0.2.99', userId: u.id })
    expect(v.level).toBe('CRITICAL')
    expect((await activeBlock(payload, { userId: u.id }))?.level).toBe('CRITICAL')
    // a rule about one account must not lock out everybody on the same network
    expect(await activeBlock(payload, { ipHash: hashIp('192.0.2.99') })).toBeNull()
    const p = await recordEvent(payload, { category: 'price_manipulation', ip: '192.0.2.98', userId: 'someone' })
    expect(p.level).toBe('CRITICAL')
    await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  })

  it('a suspended account is marked and nothing is deleted', async () => {
    const u = await payload.create({ collection: 'users', data: { email: `sus-${Date.now()}@example.com`, password: 'test-password-123' }, overrideAccess: true })
    await setSuspended(payload, u.id, true, 'test')
    const after = (await payload.findByID({ collection: 'users', id: u.id, overrideAccess: true })) as unknown as { suspended: boolean }
    expect(after.suspended).toBe(true)
    await setSuspended(payload, u.id, false)
    expect(((await payload.findByID({ collection: 'users', id: u.id, overrideAccess: true })) as unknown as { suspended: boolean }).suspended).toBe(false)
    await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  })

  it('an admin can switch a rule off or change its threshold', async () => {
    await payload.create({ collection: 'security-rules', data: { key: 'bot_scraping', enabled: false }, overrideAccess: true })
    let v
    for (let i = 0; i < 6; i++) v = await recordEvent(payload, { category: 'rate_limited', ip: '192.0.2.77' })
    expect(v!.level).toBe('LOW')
    await payload.delete({ collection: 'security-rules', where: { key: { equals: 'bot_scraping' } }, overrideAccess: true })
    for (let i = 0; i < 5; i++) v = await recordEvent(payload, { category: 'rate_limited', ip: '192.0.2.78' })
    expect(v!.level).toBe('MEDIUM')
  })

  it('removes events older than the retention period', async () => {
    const old = await payload.create({ collection: 'security-events', data: { category: 'login_ok', level: 'LOW', score: 0, createdAt: new Date(Date.now() - 400 * 86400_000).toISOString() } as never, overrideAccess: true })
    const res = await cleanup(payload)
    expect(res.eventsDeleted).toBeGreaterThanOrEqual(1)
    expect((await payload.find({ collection: 'security-events', where: { id: { equals: old.id } }, overrideAccess: true })).totalDocs).toBe(0)
  })
})

describe('order prices and privacy', () => {
  it('compares the order amount with the real prices', () => {
    expect(verifyOrderPrices([{ quantity: 2, price: 4900 }, { quantity: 1, price: 12900 }], 22700)).toEqual({ ok: true, expected: 22700 })
    expect(verifyOrderPrices([{ quantity: 2, price: 4900 }], 100).ok).toBe(false)
    expect(verifyOrderPrices([{ quantity: 1, price: undefined }], 100).ok).toBe(true)
  })
  it('masks addresses and keeps secrets out of the evidence', () => {
    expect(maskIp('192.168.1.55')).toBe('192.168.1.0')
    expect(maskEmail('erik@example.com')).toBe('e***@example.com')
    expect(hashIp('1.2.3.4')).toHaveLength(32)
    expect(hashIp('1.2.3.4')).not.toContain('1.2.3.4')
    expect(cleanEvidence({ password: 'x', token: 'y', cardNumber: 'z', email: 'erik@example.com', route: 'chat' })).toEqual({ email: 'e***@example.com', route: 'chat' })
  })
})
