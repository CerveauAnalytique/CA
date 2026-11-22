import http from 'node:http'
import { generateKeyPairSync, createHash, randomBytes } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { encryptSecret, decryptSecret } from '@/lib/secrets'
import { pullOpenRemote, pullThingsBoard } from '@/lib/iot'
import { enabled, findClient, jwks, makeCode, pkceOk, readCode, signJwt, verifyJwt, issuer } from '@/lib/oidc'

describe('secrets', () => {
  it('encrypts and decrypts, and a changed blob is rejected', () => {
    const blob = encryptSecret('s3cret!')
    expect(blob).not.toContain('s3cret')
    expect(decryptSecret(blob)).toBe('s3cret!')
    expect(() => decryptSecret(blob.slice(0, -2) + 'AA')).toThrow()
  })
})

describe('OpenRemote and ThingsBoard pulls (against a fake server)', () => {
  let server: http.Server
  const seen: string[] = []
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      seen.push(`${req.method} ${req.url}`)
      const send = (o: unknown) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)) }
      if (req.url?.includes('/protocol/openid-connect/token')) return send({ access_token: 'or-token' })
      if (req.url?.endsWith('/asset/query')) return send([{ id: 'a1', name: 'Freezer', attributes: { temperature: { value: 21.5, timestamp: 1700000000000 }, label: { value: 'x' }, door: { value: true } } }])
      if (req.url?.includes('/api/auth/login')) return send({ token: 'tb-token' })
      if (req.url?.includes('/values/timeseries')) return send({ temperature: [{ ts: 1700000000000, value: 4.2 }], note: [{ ts: 1, value: 'text' }] })
      res.statusCode = 404; res.end('{}')
    })
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    process.env.OPENREMOTE_URL = url
    process.env.THINGSBOARD_URL = url
  })
  afterAll(() => { server.close() })

  it('reads numeric attributes of OpenRemote assets', async () => {
    const rows = await pullOpenRemote({ type: 'openremote', realm: 'master', clientId: 'ca7', credentials: encryptSecret('pw') })
    expect(rows).toEqual([{ asset: 'Freezer', temperature: 21.5, door: 1, timestamp: new Date(1700000000000).toISOString() }])
  })

  it('reads the latest ThingsBoard telemetry', async () => {
    const rows = await pullThingsBoard({ type: 'thingsboard', clientId: 'a@b.nl', assetId: 'dev-1', credentials: encryptSecret('pw') })
    expect(rows[0]).toMatchObject({ device: 'dev-1', temperature: 4.2 })
    expect(rows[0]).not.toHaveProperty('note')
  })

  it('asks for the missing settings', async () => {
    await expect(pullOpenRemote({ type: 'openremote' })).rejects.toThrow(/required/)
  })
})

describe('CA7 as OpenID Connect provider', () => {
  beforeAll(() => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    process.env.CA7_OIDC_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().replace(/\n/g, '\\n')
    process.env.CA7_OIDC_CLIENTS = JSON.stringify([{ id: 'tb', secret: 'shh', redirectUris: ['https://tb.example.com/login/oauth2/code/'] }])
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://cloud.ca7.io'
  })

  it('is on only when a key and a client are configured', () => {
    expect(enabled()).toBe(true)
    expect(findClient('tb')?.id).toBe('tb')
    expect(findClient('other')).toBeUndefined()
    expect(jwks().keys[0]).toMatchObject({ kty: 'RSA', alg: 'RS256', use: 'sig' })
  })

  it('signs tokens that verify, and rejects changed or expired ones', () => {
    const now = Math.floor(Date.now() / 1000)
    const t = signJwt({ iss: issuer(), sub: '1', exp: now + 60 })
    expect(verifyJwt(t)?.sub).toBe('1')
    const [h, b, s] = t.split('.')
    const forged = Buffer.from(JSON.stringify({ iss: issuer(), sub: '2', exp: now + 60 })).toString('base64url')
    expect(verifyJwt(`${h}.${forged}.${s}`)).toBeNull()
    expect(verifyJwt(signJwt({ iss: issuer(), sub: '1', exp: now - 5 }))).toBeNull()
    expect(verifyJwt(signJwt({ iss: 'https://evil', sub: '1', exp: now + 60 }))).toBeNull()
    void b
  })

  it('codes work once and only if unchanged; PKCE is checked', () => {
    const verifier = randomBytes(24).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const code = makeCode({ uid: '7', cid: 'tb', ru: 'https://tb.example.com/login/oauth2/code/x', cc: challenge })
    const p = readCode(code)!
    expect(p.uid).toBe('7')
    expect(readCode(code)).toBeNull() // second use
    expect(readCode(code.slice(0, -2) + 'AA')).toBeNull()
    expect(pkceOk(p.cc, verifier)).toBe(true)
    expect(pkceOk(p.cc, 'wrong')).toBe(false)
    expect(pkceOk(undefined, null)).toBe(true)
  })
})
