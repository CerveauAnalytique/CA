import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { publishedOrAdmin } from '@/access/publishedOrAdmin'
import { slugFromName } from '@/hooks/slugFromName'

/** AI model registry entry (modelled on Prysel's ModelArtifact / ModelVersion). */
export const AiModels: CollectionConfig = {
  slug: 'ai-models',
  labels: { singular: 'AI model', plural: 'AI models' },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publishedOrAdmin,
    update: adminOnly,
  },
  admin: {
    group: 'Catalog',
    useAsTitle: 'name',
    defaultColumns: ['name', 'framework', 'stage', 'version', 'published'],
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
      name: 'task',
      type: 'select',
      options: [
        { label: 'Text generation', value: 'text-generation' },
        { label: 'Data analysis', value: 'data-analysis' },
        { label: 'Classification', value: 'classification' },
        { label: 'Regression', value: 'regression' },
        { label: 'Computer vision', value: 'vision' },
        { label: 'Anomaly detection', value: 'anomaly-detection' },
        { label: 'Forecasting', value: 'forecasting' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'other',
    },
    {
      name: 'framework',
      type: 'select',
      options: [
        { label: 'Ollama', value: 'ollama' },
        { label: 'PyTorch', value: 'pytorch' },
        { label: 'TensorFlow', value: 'tensorflow' },
        { label: 'scikit-learn', value: 'sklearn' },
        { label: 'XGBoost', value: 'xgboost' },
        { label: 'ONNX', value: 'onnx' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'other',
    },
    { name: 'baseModel', type: 'text', admin: { description: 'For example qwen2.5:7b' } },
    {
      name: 'chatModel',
      type: 'text',
      label: 'Chat model ID',
      admin: {
        position: 'sidebar',
        description:
          'The model the Phylena chat (phylena.com) runs for this entry, for example ca7 or qwen2.5:7b. Leave empty if it cannot be used in the chat.',
      },
    },
    { name: 'version', type: 'text', defaultValue: 'v1.0' },
    {
      name: 'stage',
      type: 'select',
      defaultValue: 'development',
      options: [
        { label: 'Development', value: 'development' },
        { label: 'Staging', value: 'staging' },
        { label: 'Production', value: 'production' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'license', type: 'text', defaultValue: 'Apache-2.0' },
    { name: 'sizeBytes', type: 'number' },
    { name: 'downloads', type: 'number', defaultValue: 0 },
    { name: 'tags', type: 'text', hasMany: true },
    {
      name: 'metrics',
      type: 'array',
      labels: { singular: 'Metric', plural: 'Metrics' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'installCommand',
      type: 'textarea',
      admin: { description: 'Shown as a code block on the model page.' },
    },
    { name: 'downloadUrl', type: 'text', admin: { description: 'Link to the weights or the source.' } },
    { name: 'modelCard', type: 'textarea', admin: { description: 'Markdown model card.' } },
  ],
}
