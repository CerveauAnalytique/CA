import { describe, expect, it } from 'vitest'
import { adminSlug, adminToken, verifyAdminLink, signGateCookie, verifyGateCookie } from '@/lib/adminGate'
import { rateLimit } from '@/lib/rateLimit'

describe('admin link', () => {
  it('never uses a language code as the first part of the address', () => {
    for (const name of ['en', 'nl', 'de', 'fr', 'es', 'pl', 'ar']) {
      expect(adminSlug({ name })).toBe(`${name}-admin`)
    }
    expect(adminSlug({ name: 'Erick Son' })).toBe('erick-son')
    expect(adminSlug({ email: 'dev@example.com' })).toBe('dev')
  })

  it('only accepts the right token for the right user', async () => {
    const user = { id: 7, name: 'Dev' }
    const token = await adminToken(7)
    expect(await verifyAdminLink(user, 'dev', token)).toBe(true)
    expect(await verifyAdminLink(user, 'dev', token.slice(0, -1) + '0')).toBe(false)
    expect(await verifyAdminLink({ id: 8, name: 'Dev' }, 'dev', token)).toBe(false)
    expect(await verifyAdminLink(user, 'someone-else', token)).toBe(false)
  })

  it('signs and checks the gate cookie', async () => {
    const cookie = await signGateCookie()
    expect(await verifyGateCookie(cookie)).toBe(true)
    expect(await verifyGateCookie(cookie.replace(/.$/, '0'))).toBe(false)
    expect(await verifyGateCookie('1.abc')).toBe(false)
    expect(await verifyGateCookie(undefined)).toBe(false)
  })
})

describe('rate limit', () => {
  it('blocks after the limit and keeps visitors apart', () => {
    const key = `t-${Math.random()}`
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true)
    const blocked = rateLimit(key, 3, 60_000)
    expect(blocked.ok).toBe(false)
    expect(rateLimit(`${key}-other`, 3, 60_000).ok).toBe(true)
  })
})
