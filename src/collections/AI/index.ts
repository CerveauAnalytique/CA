import type { CollectionConfig, GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

const adminAccess = { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly }

/** Every AI answer that was checked by the Compliance Engine, and what it decided. */
export const AiDecisions: CollectionConfig = {
  slug: 'ai-decisions',
  labels: { singular: 'Compliance decision', plural: 'Compliance decisions' },
  admin: { group: 'AI Control Center', useAsTitle: 'feature', defaultColumns: ['createdAt', 'feature', 'decision', 'violations'] },
  access: adminAccess,
  fields: [
    { name: 'feature', type: 'select', required: true, index: true, options: ['assistant', 'recommendations', 'offers', 'running_low', 'search'].map((v) => ({ label: v, value: v })) },
    { name: 'decision', type: 'select', required: true, index: true, options: [{ label: 'Allowed', value: 'allowed' }, { label: 'Corrected', value: 'corrected' }, { label: 'Blocked', value: 'blocked' }] },
    { name: 'violations', type: 'number', defaultValue: 0 },
    { name: 'userId', type: 'text' },
    { name: 'trace', type: 'json', admin: { description: 'What was proposed, what the checks found. No personal data.' } },
  ],
}

export const AiPolicyRules: CollectionConfig = {
  slug: 'ai-policy-rules',
  labels: { singular: 'Policy rule', plural: 'Policy rules' },
  admin: { group: 'AI Control Center', useAsTitle: 'key', defaultColumns: ['key', 'enabled', 'action'] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, admin: { description: 'price_match, stock_match, discount_valid, consent_required, no_medical_claims, max_discount_percent ...' } },
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'action', type: 'select', defaultValue: 'block', options: [{ label: 'Block the answer', value: 'block' }, { label: 'Correct it', value: 'correct' }, { label: 'Only log', value: 'log' }] },
    { name: 'value', type: 'number', admin: { description: 'For rules with a number, such as max_discount_percent.' } },
  ],
}

export const AiSponsored: CollectionConfig = {
  slug: 'ai-sponsored',
  labels: { singular: 'Sponsored placement', plural: 'Sponsored placements' },
  admin: { group: 'AI Control Center', useAsTitle: 'label', defaultColumns: ['label', 'product', 'active'] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'product', type: 'relationship', relationTo: 'products', required: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'boost', type: 'number', defaultValue: 1.5, min: 1, max: 5, admin: { description: 'Multiplier on the ranking score. Always shown to the customer as "Sponsored".' } },
  ],
}

export const AiSettings: GlobalConfig = {
  slug: 'ai-settings',
  label: 'AI settings',
  access: { read: adminOnly, update: adminOnly },
  admin: { group: 'AI Control Center' },
  fields: [
    {
      type: 'group',
      name: 'flags',
      label: 'Feature flags',
      fields: [
        { name: 'assistant', type: 'checkbox', defaultValue: true, label: 'AI shopping assistant' },
        { name: 'recommendations', type: 'checkbox', defaultValue: true },
        { name: 'offers', type: 'checkbox', defaultValue: true, label: 'Personal offers' },
        { name: 'runningLow', type: 'checkbox', defaultValue: true, label: '"Running low?" suggestions' },
        { name: 'smartSearch', type: 'checkbox', defaultValue: true },
      ],
    },
    { name: 'activeVersion', type: 'text', defaultValue: 'v1', admin: { description: 'The ranking model version that is used. Set it back to an older version to roll back.' } },
    {
      name: 'rankingVersions',
      type: 'array',
      admin: { description: 'Weights of the ranking. Add a version, switch to it above, roll back by switching back.' },
      defaultValue: [{ version: 'v1', popularity: 1, coPurchase: 2, personal: 3, note: 'Default' }],
      fields: [
        { name: 'version', type: 'text', required: true },
        { name: 'popularity', type: 'number', defaultValue: 1 },
        { name: 'coPurchase', type: 'number', defaultValue: 2 },
        { name: 'personal', type: 'number', defaultValue: 3 },
        { name: 'note', type: 'text' },
      ],
    },
    { name: 'lastRecommendationJob', type: 'date', admin: { readOnly: true } },
    { name: 'lastRecommendationJobStatus', type: 'text', admin: { readOnly: true } },
  ],
}
