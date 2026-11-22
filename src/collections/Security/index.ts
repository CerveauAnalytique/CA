import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

/** Only admins read or change security data; nothing here is created from the outside (the engine uses the server). */
const adminAccess = { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly }

export const SecurityEvents: CollectionConfig = {
  slug: 'security-events',
  labels: { singular: 'Activity', plural: 'Activity log' },
  admin: { group: 'Security', useAsTitle: 'category', defaultColumns: ['createdAt', 'category', 'level', 'score', 'userId', 'ipMasked'] },
  access: adminAccess,
  fields: [
    { name: 'category', type: 'text', required: true, index: true },
    { name: 'level', type: 'select', required: true, defaultValue: 'LOW', index: true, options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((v) => ({ label: v, value: v })) },
    { name: 'score', type: 'number', defaultValue: 0 },
    { name: 'userId', type: 'text', index: true },
    { name: 'ipHash', type: 'text', index: true, admin: { description: 'Keyed hash of the IP address (GDPR). Used to count, never shown to customers.' } },
    { name: 'ipMasked', type: 'text', admin: { description: 'Last part removed, e.g. 192.168.1.0' } },
    { name: 'rules', type: 'text', admin: { description: 'Rules that fired' } },
    { name: 'evidence', type: 'json', admin: { description: 'Masked details. Never passwords, tokens or payment data.' } },
    { name: 'blocked', type: 'checkbox', defaultValue: false },
  ],
}

export const SecurityAlerts: CollectionConfig = {
  slug: 'security-alerts',
  labels: { singular: 'Alert', plural: 'Alerts' },
  admin: { group: 'Security', useAsTitle: 'summary', defaultColumns: ['createdAt', 'level', 'summary', 'status'] },
  access: adminAccess,
  fields: [
    { name: 'summary', type: 'text', required: true },
    { name: 'level', type: 'select', required: true, options: ['MEDIUM', 'HIGH', 'CRITICAL'].map((v) => ({ label: v, value: v })), index: true },
    { name: 'status', type: 'select', defaultValue: 'open', index: true, options: [{ label: 'Open', value: 'open' }, { label: 'Confirmed', value: 'confirmed' }, { label: 'False positive', value: 'false_positive' }] },
    { name: 'event', type: 'relationship', relationTo: 'security-events' },
    { name: 'userId', type: 'text' },
    { name: 'note', type: 'textarea' },
    { name: 'reviewedBy', type: 'text' },
    { name: 'notified', type: 'checkbox', defaultValue: false },
  ],
}

export const SecurityBlocks: CollectionConfig = {
  slug: 'security-blocks',
  labels: { singular: 'Block', plural: 'Blocks' },
  admin: { group: 'Security', useAsTitle: 'reason', defaultColumns: ['createdAt', 'subjectType', 'reason', 'until', 'active'] },
  access: adminAccess,
  fields: [
    { name: 'subjectType', type: 'select', required: true, options: [{ label: 'User', value: 'user' }, { label: 'IP address (hash)', value: 'ip' }] },
    { name: 'subjectId', type: 'text', required: true, index: true },
    { name: 'reason', type: 'text', required: true },
    { name: 'level', type: 'select', defaultValue: 'HIGH', options: ['HIGH', 'CRITICAL'].map((v) => ({ label: v, value: v })) },
    { name: 'until', type: 'date', required: true, index: true },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
    { name: 'alert', type: 'relationship', relationTo: 'security-alerts' },
  ],
}

/** The default rules live in code (src/lib/security/config.ts); a row here overrides one: change score or threshold, or switch it off. */
export const SecurityRules: CollectionConfig = {
  slug: 'security-rules',
  labels: { singular: 'Rule', plural: 'Rules' },
  admin: { group: 'Security', useAsTitle: 'key', defaultColumns: ['key', 'enabled', 'score', 'threshold', 'windowMinutes'] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, admin: { description: 'The key of a built-in rule, for example brute_force.' } },
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'score', type: 'number', min: 0, max: 100 },
    { name: 'threshold', type: 'number', min: 1 },
    { name: 'windowMinutes', type: 'number', min: 1 },
  ],
}
