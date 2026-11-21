import type { MetadataRoute } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LOCALES } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

const PAGES = ['', '/pricing', '/models', '/datasets', '/shop', '/products', '/ai', '/about', '/contact', '/docs', '/api', '/research', '/community', '/status']

/** Every public page in every language, each with links to its translations (hreflang). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL()
  const paths = [...PAGES]

  try {
    const payload = await getPayload({ config: configPromise })
    for (const [collection, prefix] of [['ai-models', '/models'], ['datasets', '/datasets']] as const) {
      const { docs } = await payload.find({ collection, limit: 500, depth: 0, overrideAccess: false, select: { slug: true } })
      docs.forEach((d) => d.slug && paths.push(`${prefix}/${d.slug}`))
    }
  } catch {
    /* the static pages are still listed */
  }

  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: 'weekly' as const,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${path}`])),
      },
    })),
  )
}
