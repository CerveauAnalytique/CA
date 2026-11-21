/**
 * Small in-memory rate limiter (per server instance). Good enough to stop one visitor from
 * burning the model server; use a shared store such as Redis when you run several instances.
 */
type Bucket = { hits: number[] }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const b = buckets.get(key) ?? { hits: [] }
  b.hits = b.hits.filter((t) => now - t < windowMs)
  if (b.hits.length >= limit) {
    buckets.set(key, b)
    return { ok: false as const, retryAfter: Math.ceil((windowMs - (now - b.hits[0])) / 1000) }
  }
  b.hits.push(now)
  buckets.set(key, b)
  // keep the map small
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.hits.length || now - v.hits[v.hits.length - 1] > windowMs) buckets.delete(k)
  return { ok: true as const, remaining: limit - b.hits.length }
}

export function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return fwd || request.headers.get('x-real-ip') || 'unknown'
}
