import type { Payload } from 'payload'
import seed from '@/seed/support.json'

/** Puts the help topics and articles in the database the first time. The database is the source of truth after that. */
export async function seedSupportIfEmpty(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'support-topics', overrideAccess: true })
  if (totalDocs > 0) return
  const ids = new Map<string, number>()
  for (const t of seed.topics) {
    const doc = await payload.create({ collection: 'support-topics', data: t, overrideAccess: true })
    ids.set(t.slug, doc.id)
  }
  for (const a of seed.articles) {
    const { topicSlug, ...rest } = a
    try {
      await payload.create({ collection: 'support-articles', data: { ...rest, topic: ids.get(topicSlug)! } as never, overrideAccess: true })
    } catch (e) {
      payload.logger.error(`Could not seed help article ${a.slug}: ${(e as Error).message}`)
    }
  }
}
