import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // The chat was renamed from Neuriy to CA7; keep old links working.
  const chatRename = {
    destination: '/chat-ca7',
    permanent: true,
    source: '/chat-neuriy',
  }

  return [internetExplorerRedirect, chatRename]
}
