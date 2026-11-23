import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrPublished } from '@/access/adminOrPublished'
import { statusField } from '@/fields/status'

/**
 * Datasets offered on the platform. Phylena (phylena.com) reads the
 * published ones from `GET /api/datasets` and lists them for its users.
 */
export const Datasets: CollectionConfig = {
  slug: 'datasets',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublished,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'format', 'rows', 'status'],
    group: 'AI',
  },
  defaultSort: 'name',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField({ useAsSlug: 'name', position: undefined }),
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'general',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Carbon & Climate', value: 'carbon' },
        { label: 'Finance', value: 'finance' },
        { label: 'Health', value: 'health' },
        { label: 'Text & Language', value: 'text' },
        { label: 'Vision', value: 'vision' },
      ],
      required: true,
    },
    {
      name: 'format',
      type: 'select',
      defaultValue: 'csv',
      options: [
        { label: 'CSV', value: 'csv' },
        { label: 'JSON', value: 'json' },
        { label: 'JSON Lines', value: 'jsonl' },
        { label: 'Parquet', value: 'parquet' },
        { label: 'Text', value: 'text' },
        { label: 'Other', value: 'other' },
      ],
      required: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'rows', type: 'number', label: 'Rows', min: 0 },
        { name: 'size', type: 'text', label: 'Size', admin: { description: 'e.g. "12 MB"' } },
        { name: 'license', type: 'text', label: 'License', admin: { description: 'e.g. "CC BY 4.0"' } },
      ],
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Upload the dataset file, or use a download URL below.' },
    },
    {
      name: 'downloadUrl',
      type: 'text',
      label: 'Download URL',
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
    },
    statusField,
  ],
  timestamps: true,
}
