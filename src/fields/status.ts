import type { Field } from 'payload'

/** Published items are public (e.g. listed in Phylena); drafts are admin-only. */
export const statusField: Field = {
  name: 'status',
  type: 'select',
  defaultValue: 'published',
  index: true,
  options: [
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
  ],
  required: true,
  admin: {
    position: 'sidebar',
  },
}
