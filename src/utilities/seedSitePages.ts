import type { Payload } from 'payload'
import seed from '@/seed/site-pages.json'

/** Puts the content pages in the database the first time (the database is the source of truth after that). */
export async function seedSitePagesIfEmpty(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'site-pages', overrideAccess: true })
  if (totalDocs > 0) return
  for (const p of seed as Array<Record<string, unknown>>) {
    try {
      await payload.create({ collection: 'site-pages', data: p as never, overrideAccess: true })
    } catch (e) {
      payload.logger.error(`Could not seed page ${String(p.slug)}: ${(e as Error).message}`)
    }
  }
}
