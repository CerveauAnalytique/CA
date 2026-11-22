import { decryptSecret } from '@/lib/secrets'

/**
 * Pulls the latest values from the platform tools that run next to CA7 (see platform/README.md).
 * The address always comes from the server environment (OPENREMOTE_URL / THINGSBOARD_URL), never from the customer,
 * so a customer cannot point the server at another machine.
 */
type Src = { type: string; realm?: string | null; clientId?: string | null; assetId?: string | null; credentials?: string | null }

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'boolean' ? (v ? 1 : 0) : undefined)

async function json(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}.`)
  return res.json()
}

export async function pullOpenRemote(s: Src): Promise<Record<string, unknown>[]> {
  const base = (process.env.OPENREMOTE_URL || '').replace(/\/$/, '')
  if (!base) throw new Error('OPENREMOTE_URL is not set on the server.')
  if (!s.realm || !s.clientId || !s.credentials) throw new Error('Realm, client id and client secret are required.')
  const token = await json(`${base}/auth/realms/${encodeURIComponent(s.realm)}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: s.clientId, client_secret: decryptSecret(s.credentials) }),
  })
  const auth = { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' }
  const toRow = (a: { id?: string; name?: string; attributes?: Record<string, { value?: unknown; timestamp?: number }> }) => {
    const row: Record<string, unknown> = { asset: a.name ?? a.id }
    let ts = 0
    for (const [k, attr] of Object.entries(a.attributes ?? {})) {
      const n = num(attr?.value)
      if (n !== undefined) row[k] = n
      if (attr?.timestamp && attr.timestamp > ts) ts = attr.timestamp
    }
    if (ts) row.timestamp = new Date(ts).toISOString()
    return row
  }
  const realm = encodeURIComponent(s.realm)
  if (s.assetId) return [toRow(await json(`${base}/api/${realm}/asset/${encodeURIComponent(s.assetId)}`, { headers: auth }))]
  const list = await json(`${base}/api/${realm}/asset/query`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 50 }) })
  return (Array.isArray(list) ? list : []).map(toRow)
}

export async function pullThingsBoard(s: Src): Promise<Record<string, unknown>[]> {
  const base = (process.env.THINGSBOARD_URL || '').replace(/\/$/, '')
  if (!base) throw new Error('THINGSBOARD_URL is not set on the server.')
  if (!s.clientId || !s.credentials || !s.assetId) throw new Error('User name, password and device id are required.')
  const login = await json(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: s.clientId, password: decryptSecret(s.credentials) }) })
  const data = await json(`${base}/api/plugins/telemetry/DEVICE/${encodeURIComponent(s.assetId)}/values/timeseries?useStrictDataTypes=true`, { headers: { 'X-Authorization': `Bearer ${login.token}` } })
  const row: Record<string, unknown> = { device: s.assetId }
  let ts = 0
  for (const [k, arr] of Object.entries(data as Record<string, { ts: number; value: unknown }[]>)) {
    const p = arr?.[0]
    const n = num(p?.value)
    if (n !== undefined) row[k] = n
    if (p?.ts && p.ts > ts) ts = p.ts
  }
  if (ts) row.timestamp = new Date(ts).toISOString()
  return [row]
}

export const IOT_TYPES = ['openremote', 'thingsboard'] as const
export const pullIot = (s: Src) => (s.type === 'openremote' ? pullOpenRemote(s) : pullThingsBoard(s))
