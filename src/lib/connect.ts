import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { Payload } from 'payload'
import { limitsOf } from '@/lib/limits'
import { runAutomations } from '@/lib/automation'

type User = { id: string | number; plan?: string | null; roles?: string[] | null }

function isPrivateIp(ip: string) {
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true
  const m = ip.replace(/^::ffff:/, '').split('.').map(Number)
  if (m.length !== 4) return false
  const [a, b] = m
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
}

/** Only public https/http addresses: stops customers from making the server call internal services. */
export async function assertPublicUrl(raw: string) {
  const url = new URL(raw)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only http(s) URLs are allowed.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address)
  if (!ips.length || ips.some(isPrivateIp)) throw new Error('That address is not allowed.')
  return url
}

export function getPath(obj: unknown, path?: string | null) {
  if (!path) return obj
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)
}

/** Stores records for a source (checks the storage limit of the pack) and runs the automations. */
export async function saveRecords(payload: Payload, user: User, sourceId: string | number, rows: Record<string, unknown>[]) {
  const limits = limitsOf(user)
  const { totalDocs } = await payload.count({ collection: 'data-records', where: { owner: { equals: user.id } }, overrideAccess: true })
  const room = Math.max(0, limits.records - totalDocs)
  const take = rows.slice(0, room)
  const now = new Date().toISOString()
  for (const data of take) {
    await payload.create({
      collection: 'data-records',
      data: { owner: Number(user.id), source: Number(sourceId), data: data as never, recordedAt: String((data as { timestamp?: string }).timestamp ?? now) },
      overrideAccess: true,
    })
  }
  const { totalDocs: sourceTotal } = await payload.count({ collection: 'data-records', where: { source: { equals: sourceId } }, overrideAccess: true })
  await payload.update({
    collection: 'data-sources',
    id: sourceId,
    data: { lastSyncAt: now, lastError: take.length < rows.length ? 'Storage limit of your pack reached.' : null, recordCount: sourceTotal },
    overrideAccess: true,
  })
  if (take.length) await runAutomations(payload, user, sourceId, take)
  return { stored: take.length, skipped: rows.length - take.length }
}

/** Fetches a REST source and stores what it returns. */
export async function syncRest(payload: Payload, user: User, source: { id: string | number; url?: string | null; headers?: unknown; recordsPath?: string | null }) {
  if (!source.url) throw new Error('This source has no URL.')
  const url = await assertPublicUrl(source.url)
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...((source.headers as Record<string, string>) ?? {}) },
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`The API answered ${res.status}.`)
  const json = await res.json()
  const list = getPath(json, source.recordsPath)
  const rows = (Array.isArray(list) ? list : [list]).filter((r) => r && typeof r === 'object').slice(0, 5000) as Record<string, unknown>[]
  return saveRecords(payload, user, source.id, rows)
}

/** Very small CSV parser (quotes, commas, newlines). Numbers become numbers. */
export function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = []
  let cur: string[] = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',' || c === ';') { cur.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      cur.push(cell); cell = ''
      if (cur.some((v) => v !== '')) rows.push(cur)
      cur = []
    } else cell += c
  }
  cur.push(cell)
  if (cur.some((v) => v !== '')) rows.push(cur)
  const [head, ...body] = rows
  if (!head) return []
  return body.map((r) => Object.fromEntries(head.map((h, i) => {
    const v = (r[i] ?? '').trim()
    return [h.trim(), v !== '' && !Number.isNaN(Number(v)) ? Number(v) : v]
  })))
}
