import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'
import { seedDemoShop } from '@/lib/demoShop'
import { GET, POST } from '@/app/(app)/api/ca/v1/[[...path]]/route'

const call = (fn: typeof GET, path: string[], key?: string, init: RequestInit = {}, qs = '') =>
  fn(new Request(`http://localhost/api/ca/v1/${path.join('/')}${qs}`, { ...init, headers: { 'content-type': 'application/json', ...(key ? { Authorization: `users API-Key ${key}` } : {}) } }), { params: Promise.resolve({ path }) })

describe('API gateway /api/ca/v1', () => {
  let payload: Payload
  let key: string
  let sourceId: number
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    key = `ca_test_${Date.now()}`
    const u = await payload.create({ collection: 'users', data: { email: `gw-${Date.now()}@example.com`, password: 'test-password-123', roles: ['customer'], enableAPIKey: true, apiKey: key } as never, overrideAccess: true })
    const s = await payload.create({ collection: 'data-sources', data: { name: 'gw', type: 'push', owner: u.id } as never, overrideAccess: true })
    sourceId = s.id as number
    await seedDemoShop(payload)
  })

  it('lists the endpoints without a key', async () => {
    const r = await call(GET, [])
    expect(r.status).toBe(200)
    expect((await r.json()).endpoints.length).toBeGreaterThan(5)
  })
  it('rejects a missing or wrong key', async () => {
    expect((await call(GET, ['me'])).status).toBe(401)
    expect((await call(GET, ['me'], 'nope')).status).toBe(401)
  })
  it('shows account, pack and usage', async () => {
    const body = await (await call(GET, ['me'], key)).json()
    expect(body.pack).toBe('free')
    expect(body.usage.apiCalls).toBeGreaterThan(0)
  })
  it('lists and finds shop products, seeding is idempotent', async () => {
    expect((await seedDemoShop(payload)).created).toBe(0)
    const list = await (await call(GET, ['products'], key)).json()
    expect(list.products.length).toBeGreaterThanOrEqual(5)
    const one = await (await call(GET, ['products', 'iot-gateway-box'], key)).json()
    expect(one.price).toBe(14900)
    expect(one.description).toContain('MQTT')
    const found = await (await call(GET, ['products'], key, {}, '?q=sensor')).json()
    expect(found.products.map((p: { slug: string }) => p.slug)).toContain('smart-temperature-sensor')
    expect((await call(GET, ['products', 'missing'], key)).status).toBe(404)
  })
  it('stores and reads records, only in own sources', async () => {
    const post = await call(POST, ['records'], key, { method: 'POST', body: JSON.stringify({ source: sourceId, records: [{ t: 20 }, { t: 21 }] }) })
    expect((await post.json()).stored).toBe(2)
    const got = await (await call(GET, ['records'], key, {}, `?source=${sourceId}`)).json()
    expect(got.total).toBe(2)
    const other = await call(POST, ['records'], key, { method: 'POST', body: JSON.stringify({ source: 999999, records: [{ t: 1 }] }) })
    expect(other.status).toBe(404)
  })
  it('lists own orders and sources', async () => {
    expect((await (await call(GET, ['orders'], key)).json()).orders).toEqual([])
    expect((await (await call(GET, ['sources'], key)).json()).sources[0].id).toBe(sourceId)
  })
  it('enforces the monthly pack limit', async () => {
    const k = `ca_lim_${Date.now()}`
    await payload.create({ collection: 'users', data: { email: `gwl-${Date.now()}@example.com`, password: 'test-password-123', roles: ['customer'], enableAPIKey: true, apiKey: k, usageMonth: new Date().toISOString().slice(0, 7), apiCallsMonth: 1000 } as never, overrideAccess: true })
    expect((await call(GET, ['me'], k)).status).toBe(402)
  })
})
