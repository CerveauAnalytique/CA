/**
 * Domains:
 *  - cloud.ca7.io: the whole site (account, settings, shop, pricing, docs, admin)
 *  - ca7.io, ca7.nl, ca7.be: the CA7 chat. Every other page on these domains goes to cloud.ca7.io.
 * Other hosts (localhost, preview URLs) are not touched. Change them with the environment variables
 * CA7_CLOUD_HOST and CA7_CHAT_HOSTS (comma separated).
 */
const clean = (h: string) => h.trim().toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '')

export const CLOUD_HOST = clean(process.env.CA7_CLOUD_HOST || 'cloud.ca7.io')
export const CHAT_HOSTS = (process.env.CA7_CHAT_HOSTS || 'ca7.io,ca7.nl,ca7.be').split(',').map(clean).filter(Boolean)

/** Default language of a domain when the visitor has no language yet. */
const HOST_LOCALE: Record<string, string> = { 'ca7.nl': 'nl', 'ca7.be': 'nl' }

export const hostOf = (header: string | null) => clean(header || '')
export const isChatHost = (host: string) => CHAT_HOSTS.includes(host)
export const hostLocale = (host: string) => HOST_LOCALE[host]
