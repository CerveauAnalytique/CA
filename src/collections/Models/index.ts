import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrPublished } from '@/access/adminOrPublished'
import { statusField } from '@/fields/status'

/**
 * AI models offered on the platform. Phylena (phylena.com) reads the
 * published ones from `GET /api/models` and shows them in its model picker.
 */
export const Models: CollectionConfig = {
  slug: 'models',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublished,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'gatewayModel', 'category', 'status', 'isDefault'],
    group: 'AI',
  },
  defaultSort: 'name',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Shown to users, e.g. "Qwen3 1.7B".' },
    },
    slugField({ useAsSlug: 'name', position: undefined }),
    {
      name: 'gatewayModel',
      type: 'text',
      label: 'Gateway model ID',
      required: true,
      admin: {
        description:
          'Exact model ID the Phylena gateway runs, e.g. "qwen3:1.7b" (local Ollama) or "remote/gpt-4o-mini" (an OpenAI-compatible provider).',
      },
    },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'ollama',
      options: [
        { label: 'Local (Ollama)', value: 'ollama' },
        { label: 'Remote (OpenAI-compatible)', value: 'remote' },
      ],
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'chat',
      options: [
        { label: 'Chat', value: 'chat' },
        { label: 'Reasoning', value: 'reasoning' },
        { label: 'Code', value: 'code' },
        { label: 'Vision', value: 'vision' },
        { label: 'Embeddings', value: 'embeddings' },
      ],
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'contextLength',
      type: 'number',
      label: 'Context length (tokens)',
      min: 0,
    },
    {
      name: 'supportsReasoning',
      type: 'checkbox',
      label: 'Supports reasoning (thinking) mode',
      defaultValue: false,
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: 'Default model',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Used when a user has not picked a model.' },
    },
    statusField,
  ],
  timestamps: true,
}
