import type { Payload } from 'payload'

/** Collections a logged-in user can read and export (access rules still apply per user). */
export const DATA_COLLECTIONS = [
  { slug: 'products', label: 'Products' },
  { slug: 'orders', label: 'Orders' },
  { slug: 'carts', label: 'Carts' },
  { slug: 'addresses', label: 'Addresses' },
  { slug: 'transactions', label: 'Transactions' },
  { slug: 'posts', label: 'Posts' },
  { slug: 'pages', label: 'Pages' },
  { slug: 'categories', label: 'Categories' },
  { slug: 'media', label: 'Media' },
  { slug: 'form-submissions', label: 'Form submissions' },
] as const

export type CollectionSlug = (typeof DATA_COLLECTIONS)[number]['slug']

type AnyUser = Parameters<Payload['find']>[0]['user']

export async function getCounts(payload: Payload, user: AnyUser) {
  return Promise.all(
    DATA_COLLECTIONS.map(async (c) => {
      try {
        const { totalDocs } = await payload.count({
          collection: c.slug,
          overrideAccess: false,
          user,
        })
        return { ...c, count: totalDocs }
      } catch {
        return { ...c, count: 0 }
      }
    }),
  )
}

const SECRET_USER_FIELDS = ['apiKey', 'apiKeyIndex', 'enableAPIKey', 'hash', 'salt', 'loginAttempts', 'lockUntil']

export async function buildExport(payload: Payload, user: AnyUser, only?: string[]) {
  const wanted = DATA_COLLECTIONS.filter((c) => !only || only.includes(c.slug))
  const data: Record<string, unknown> = {}

  for (const c of wanted) {
    try {
      const res = await payload.find({
        collection: c.slug,
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        user,
      })
      data[c.slug] = res.docs
    } catch {
      data[c.slug] = []
    }
  }

  const profile: Record<string, unknown> = { ...(user as Record<string, unknown>) }
  SECRET_USER_FIELDS.forEach((k) => delete profile[k])

  return {
    exportedAt: new Date().toISOString(),
    source: 'Cerveau Analytique',
    user: profile,
    collections: data,
  }
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}
