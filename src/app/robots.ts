import { getServerSideURL } from '@/utilities/getURL'

export default function robots() {
  const baseUrl = getServerSideURL()
  return {
    host: baseUrl,
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/*/dashboard', '/*/account', '/*/checkout', '/*/orders'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
