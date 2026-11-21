import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

/**
 * Content pages kept in the database (about, privacy, cookies, docs, research, ...), shown by the Flutter app.
 * Edit them in the admin panel. Seeded from src/seed/site-pages.json when the collection is empty.
 */
export const SitePages: CollectionConfig = {
  slug: 'site-pages',
  admin: { group: 'Content', useAsTitle: 'title', defaultColumns: ['title', 'slug', 'section', 'updatedAt'] },
  access: { read: ({ req: { user } }) => (user?.roles?.includes('admin') ? true : { published: { equals: true } }), create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { description: 'The address without language, for example about or docs/quickstart.' } },
    {
      name: 'section',
      type: 'select',
      defaultValue: 'company',
      options: [
        { label: 'Company', value: 'company' },
        { label: 'Legal', value: 'legal' },
        { label: 'Product', value: 'product' },
        { label: 'Docs', value: 'docs' },
        { label: 'Research', value: 'research' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'eyebrow', type: 'text' },
    { name: 'subtitle', type: 'textarea' },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        { slug: 'heading', labels: { singular: 'Heading', plural: 'Headings' }, fields: [{ name: 'level', type: 'select', defaultValue: '2', options: [{ label: 'H2', value: '2' }, { label: 'H3', value: '3' }] }, { name: 'text', type: 'text', required: true }] },
        { slug: 'paragraph', labels: { singular: 'Paragraph', plural: 'Paragraphs' }, fields: [{ name: 'text', type: 'textarea', required: true }] },
        { slug: 'list', labels: { singular: 'List', plural: 'Lists' }, fields: [{ name: 'items', type: 'array', fields: [{ name: 'text', type: 'text', required: true }] }] },
        { slug: 'code', labels: { singular: 'Code', plural: 'Code' }, fields: [{ name: 'code', type: 'textarea', required: true }] },
        { slug: 'callout', labels: { singular: 'Callout', plural: 'Callouts' }, fields: [{ name: 'text', type: 'textarea', required: true }] },
        { slug: 'cards', labels: { singular: 'Cards', plural: 'Cards' }, fields: [{ name: 'items', type: 'array', fields: [{ name: 'title', type: 'text', required: true }, { name: 'text', type: 'textarea' }, { name: 'meta', type: 'text' }] }] },
      ],
    },
  ],
}
