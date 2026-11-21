import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { publishedOrAdmin } from '@/access/publishedOrAdmin'
import { slugFromName } from '@/hooks/slugFromName'

/** Dataset catalog entry (modelled on Prysel's Dataset / DatasetVersion). */
export const Datasets: CollectionConfig = {
  slug: 'datasets',
  labels: { singular: 'Dataset', plural: 'Datasets' },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publishedOrAdmin,
    update: adminOnly,
  },
  admin: {
    group: 'Catalog',
    useAsTitle: 'name',
    defaultColumns: ['name', 'format', 'rowCount', 'version', 'published'],
  },
  defaultSort: '-downloads',
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Generated from the name when empty.' },
      hooks: { beforeValidate: [slugFromName] },
    },
    { name: 'publisher', type: 'text', defaultValue: 'CA7', admin: { position: 'sidebar' } },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'summary', type: 'textarea', required: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'other',
      options: [
        { label: 'Cameras', value: 'cameras' },
        { label: 'Sensors', value: 'sensors' },
        { label: 'Logs', value: 'logs' },
        { label: 'Business', value: 'business' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'format',
      type: 'select',
      defaultValue: 'csv',
      options: [
        { label: 'CSV', value: 'csv' },
        { label: 'Parquet', value: 'parquet' },
        { label: 'JSON Lines', value: 'jsonl' },
        { label: 'JSON', value: 'json' },
        { label: 'Images', value: 'images' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'version', type: 'text', defaultValue: 'v1.0' },
    { name: 'license', type: 'text', defaultValue: 'CC-BY-4.0' },
    { name: 'rowCount', type: 'number' },
    { name: 'columnCount', type: 'number' },
    { name: 'sizeBytes', type: 'number' },
    { name: 'downloads', type: 'number', defaultValue: 0 },
    { name: 'tags', type: 'text', hasMany: true },
    {
      name: 'schemaColumns',
      type: 'array',
      labels: { singular: 'Column', plural: 'Schema' },
      fields: [
        { name: 'column', type: 'text', required: true },
        { name: 'type', type: 'text', required: true },
        { name: 'description', type: 'text' },
      ],
    },
    { name: 'downloadUrl', type: 'text', admin: { description: 'Link to the data files.' } },
    { name: 'datasetCard', type: 'textarea', admin: { description: 'Markdown description.' } },
  ],
}
