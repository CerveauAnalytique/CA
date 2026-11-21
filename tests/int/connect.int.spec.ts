import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { parseCsv, assertPublicUrl, saveRecords } from '@/lib/connect'
import { analyze, isAnomaly } from '@/lib/intelligence'
import { LIMITS, countApiCall, limitsOf } from '@/lib/limits'

describe('helpers', () => {
  it('parses csv with quotes and numbers', () => {
    expect(parseCsv('name,temp\n"A, b",21.5\nC,3\n')).toEqual([{ name: 'A, b', temp: 21.5 }, { name: 'C', temp: 3 }])
  })
  it('marks unusual values only with enough history', () => {
    const h = Array.from({ length: 50 }, (_, i) => 20 + (i % 3))
    expect(isAnomaly(h, 21)).toBe(false)
    expect(isAnomaly(h, 90)).toBe(true)
    expect(isAnomaly([1, 2], 500)).toBe(false)
  })
  it('analyzes fields and finds anomalies only when allowed', () => {
    const recs = [...Array.from({ length: 40 }, () => ({ data: { t: 20 } })), { data: { t: 20.5 } }, { data: { t: 200 } }]
    expect(analyze(recs, true)[0].anomalies.length).toBe(1)
    expect(analyze(recs, false)[0].anomalies.length).toBe(0)
  })
  it('blocks private and local addresses', async () => {
    for (const u of ['http://127.0.0.1/x', 'http://10.0.0.5/', 'http://169.254.169.254/', 'http://[::1]/', 'ftp://example.com/']) {
      await expect(assertPublicUrl(u)).rejects.toThrow()
    }
  })
  it('gives bigger packs more room', () => {
    expect(LIMITS.free.sources).toBeLessThan(LIMITS.hobby.sources)
    expect(limitsOf({ id: 1, roles: ['admin'] }).apiCalls).toBe(Infinity)
  })
})

describe('limits in the database', () => {
  let payload: Payload
  let userId: number
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const u = await payload.create({ collection: 'users', data: { email: `limit-${Date.now()}@example.com`, password: 'test-password-123', roles: ['customer'] }, overrideAccess: true })
    userId = u.id as number
    // the first account of a new database becomes admin; this test needs a normal customer
    await payload.update({ collection: 'users', id: userId, data: { roles: ['customer'] }, overrideAccess: true })
  })
  afterAll(async () => {
    await payload.delete({ collection: 'data-records', where: { owner: { equals: userId } }, overrideAccess: true })
    await payload.delete({ collection: 'data-sources', where: { owner: { equals: userId } }, overrideAccess: true })
    await payload.delete({ collection: 'users', id: userId, overrideAccess: true })
  })

  it('stops the 4th data source on the Free pack', async () => {
    const user = await payload.findByID({ collection: 'users', id: userId, overrideAccess: true })
    for (let i = 0; i < 3; i++) {
      await payload.create({ collection: 'data-sources', data: { name: `s${i}`, type: 'push' } as never, user: { ...user, collection: 'users' }, overrideAccess: false })
    }
    await expect(
      payload.create({ collection: 'data-sources', data: { name: 'one too many', type: 'push' } as never, user: { ...user, collection: 'users' }, overrideAccess: false }),
    ).rejects.toThrow(/allows 3 data sources/)
  })

  it('stores records, counts them and stops at the API call limit', async () => {
    const user = (await payload.findByID({ collection: 'users', id: userId, overrideAccess: true })) as never as { id: number }
    const src = (await payload.find({ collection: 'data-sources', where: { owner: { equals: userId } }, limit: 1, overrideAccess: true })).docs[0]
    const r = await saveRecords(payload, user, src.id, [{ temperature: 21 }, { temperature: 22 }])
    expect(r.stored).toBe(2)
    await payload.update({ collection: 'users', id: userId, data: { usageMonth: new Date().toISOString().slice(0, 7), apiCallsMonth: LIMITS.free.apiCalls }, overrideAccess: true })
    expect((await countApiCall(payload, user)).ok).toBe(false)
  })
})
