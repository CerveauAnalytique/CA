import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { SitePages } from '@/collections/SitePages'

const published = ({ req: { user } }: { req: { user?: { roles?: string[] | null } | null } }) => (user?.roles?.includes('admin') ? true : { published: { equals: true } })
const blocksField = SitePages.fields.find((f) => 'name' in f && f.name === 'blocks')!

export const SupportTopics: CollectionConfig = {
  slug: 'support-topics',
  labels: { singular: 'Help topic', plural: 'Help topics' },
  admin: { group: 'Support', useAsTitle: 'title', defaultColumns: ['title', 'slug', 'order'] },
  access: { read: () => true, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'text' },
    { name: 'badge', type: 'text', admin: { description: 'Two letters shown in the topic tile, for example Ac.' } },
    { name: 'order', type: 'number', defaultValue: 100 },
  ],
}

export const SupportArticles: CollectionConfig = {
  slug: 'support-articles',
  labels: { singular: 'Help article', plural: 'Help articles' },
  admin: { group: 'Support', useAsTitle: 'title', defaultColumns: ['title', 'topic', 'helpful', 'published'] },
  access: { read: published, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'topic', type: 'relationship', relationTo: 'support-topics', required: true, index: true },
    { ...(blocksField as object), name: 'blocks' } as never,
    { name: 'popular', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Shown under "Popular" on the help center.' } },
    { name: 'helpful', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true, description: 'Members who said it helped.' } },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}

/** A request for the support team. Anyone can send one (through the rate-limited route); only admins read them. */
export const SupportRequests: CollectionConfig = {
  slug: 'support-requests',
  labels: { singular: 'Support request', plural: 'Support requests' },
  admin: { group: 'Support', useAsTitle: 'subject', defaultColumns: ['createdAt', 'subject', 'email', 'status'] },
  access: { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'subject', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'name', type: 'text' },
    { name: 'topic', type: 'relationship', relationTo: 'support-topics' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'status', type: 'select', defaultValue: 'open', index: true, options: [{ label: 'Open', value: 'open' }, { label: 'Answered', value: 'answered' }, { label: 'Closed', value: 'closed' }] },
    { name: 'reply', type: 'textarea', admin: { description: 'Your answer. Setting the status to Answered e-mails it to the customer.' } },
  ],
}
