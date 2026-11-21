/** Client for the Marketplace API (https://github.com/CerveauAnalytique/Marketplace, src/api). */

export const MARKETPLACE_API_URL = (
  process.env.MARKETPLACE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '')

/** Where users log in and publish apps (the Marketplace web app). */
export const MARKETPLACE_WEB_URL = (
  process.env.NEXT_PUBLIC_MARKETPLACE_WEB_URL || 'http://127.0.0.1:5011'
).replace(/\/$/, '')

export type MarketApp = {
  id: string
  name: string
  description: string
  category: string
  developer: string
  price: string
  version: string
  rating: number
  downloads: number
  featured: boolean
  icon_url: string | null
  status: string
}

/** Icons and downloads go through our own proxy so the backend never has to be public. */
export const marketAsset = (path: string | null | undefined) =>
  path ? `/api/ca/market/${path.replace(/^\//, '')}` : null

export const marketDownloadUrl = (id: string) => `/api/ca/market/api/apps/${id}/download`

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${MARKETPLACE_API_URL}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Returns null when the Marketplace API is unreachable. */
export async function listApps(opts: { q?: string; category?: string; sort?: string } = {}) {
  const params = new URLSearchParams()
  if (opts.q) params.set('q', opts.q)
  if (opts.category && opts.category !== 'All Categories') params.set('category', opts.category)
  params.set('sort', opts.sort === 'new' ? 'new' : 'popular')
  return get<MarketApp[]>(`/api/apps?${params}`)
}

export async function getApp(id: string) {
  if (!/^[\w-]+$/.test(id)) return null
  return get<MarketApp>(`/api/apps/${id}`)
}

export async function getCategories() {
  const data = await get<{ categories: string[] }>('/api/categories')
  return data?.categories ?? []
}
