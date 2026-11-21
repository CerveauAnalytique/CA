import type { Access, CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { randomBytes } from 'node:crypto'
import { checkRole } from '@/access/utilities'
import { limitsOf } from '@/lib/limits'
import { encryptSecret } from '@/lib/secrets'

/** Admin sees all; a customer sees only what they own. */
const ownOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (checkRole(['admin'], user)) return true
  return { owner: { equals: user.id } }
}
const loggedIn: Access = ({ req: { user } }) => Boolean(user)

/** A customer can only create things for themselves. */
const forceOwner: CollectionBeforeValidateHook = ({ data, req: { user }, operation }) => {
  if (!user || !data) return data
  if (operation === 'create' && !checkRole(['admin'], user)) data.owner = user.id
  if (operation === 'update' && !checkRole(['admin'], user)) delete data.owner
  return data
}

/** Checks the pack limit and creates the token that push sources use. */
const onCreateSource: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data
  const user = req.user
  const owner = (data.owner as string | number | undefined) ?? user?.id
  if (user && !checkRole(['admin'], user)) {
    const max = limitsOf(user as never).sources
    const { totalDocs } = await req.payload.count({ collection: 'data-sources', where: { owner: { equals: owner } }, overrideAccess: true })
    if (totalDocs >= max) throw new APIError(`Your pack allows ${max} data sources. Upgrade your pack at /pricing.`, 402)
  }
  if (data.type === 'openremote' || data.type === 'thingsboard') {
    if (user && !checkRole(['admin'], user) && (user as { plan?: string }).plan !== 'enterprise') throw new APIError('Platform sources are part of the Enterprise pack.', 402)
  }
  if (data.type === 'push' || data.type === 'camera') data.ingestToken = `cs_${randomBytes(20).toString('hex')}`
  return data
}

/** The secret is encrypted into `credentials` and then dropped, so it is never stored in plain text. */
const encryptCredentials: CollectionBeforeChangeHook = ({ data }) => {
  if (typeof data.secret === 'string' && data.secret) data.credentials = encryptSecret(data.secret)
  delete data.secret
  return data
}

const ownerField = {
  name: 'owner',
  type: 'relationship' as const,
  relationTo: 'users' as const,
  required: true,
  index: true,
  admin: { position: 'sidebar' as const },
}

/** A connected data source: REST API, CSV file or a push source (IoT, MQTT bridge, camera agent). */
export const DataSources: CollectionConfig = {
  slug: 'data-sources',
  admin: { group: 'Data', useAsTitle: 'name', defaultColumns: ['name', 'type', 'owner', 'lastSyncAt', 'recordCount'] },
  access: { read: ownOrAdmin, update: ownOrAdmin, delete: ownOrAdmin, create: loggedIn },
  hooks: { beforeValidate: [forceOwner], beforeChange: [onCreateSource, encryptCredentials] },
  fields: [
    ownerField,
    { name: 'name', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'REST API', value: 'rest' },
        { label: 'CSV file', value: 'csv' },
        { label: 'Push (IoT, MQTT bridge, scripts)', value: 'push' },
        { label: 'Camera (desktop agent)', value: 'camera' },
        { label: 'OpenRemote (platform)', value: 'openremote' },
        { label: 'ThingsBoard (platform)', value: 'thingsboard' },
      ],
    },
    { name: 'realm', type: 'text', admin: { description: 'OpenRemote: the realm.', condition: (d) => d?.type === 'openremote' } },
    { name: 'clientId', type: 'text', admin: { description: 'OpenRemote: service user (client id). ThingsBoard: user name.', condition: (d) => d?.type === 'openremote' || d?.type === 'thingsboard' } },
    { name: 'assetId', type: 'text', admin: { description: 'OpenRemote: asset id (empty = all assets). ThingsBoard: device id.', condition: (d) => d?.type === 'openremote' || d?.type === 'thingsboard' } },
    {
      name: 'secret',
      type: 'text',
      virtual: true,
      access: { read: () => false },
      admin: { description: 'Client secret or password. Stored encrypted, never shown again.', condition: (d) => d?.type === 'openremote' || d?.type === 'thingsboard' },
    },
    { name: 'credentials', type: 'text', access: { read: () => false, create: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'url', type: 'text', admin: { description: 'REST: the URL that returns JSON.' } },
    { name: 'headers', type: 'json', admin: { description: 'REST: extra request headers, e.g. {"Authorization":"Bearer ..."}' } },
    { name: 'recordsPath', type: 'text', admin: { description: 'REST: where the list is in the JSON, e.g. data.items' } },
    { name: 'ingestToken', type: 'text', access: { read: ({ req: { user } }) => Boolean(user) }, admin: { readOnly: true } },
    { name: 'lastSyncAt', type: 'date' },
    { name: 'lastError', type: 'text' },
    { name: 'recordCount', type: 'number', defaultValue: 0 },
  ],
}

export const DataRecords: CollectionConfig = {
  slug: 'data-records',
  admin: { group: 'Data', defaultColumns: ['source', 'recordedAt', 'owner'] },
  access: { read: ownOrAdmin, update: ({ req: { user } }) => checkRole(['admin'], user), delete: ownOrAdmin, create: ({ req: { user } }) => checkRole(['admin'], user) },
  fields: [
    ownerField,
    { name: 'source', type: 'relationship', relationTo: 'data-sources', required: true, index: true },
    { name: 'data', type: 'json', required: true },
    { name: 'recordedAt', type: 'date', index: true, defaultValue: () => new Date().toISOString() },
  ],
}

const onCreateAutomation: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create' || !req.user || checkRole(['admin'], req.user)) return data
  const lim = limitsOf(req.user as never)
  if (!lim.automation) throw new APIError('Automation is part of the Business pack. Upgrade your pack at /pricing.', 402)
  const { totalDocs } = await req.payload.count({ collection: 'automations', where: { owner: { equals: req.user.id } }, overrideAccess: true })
  if (totalDocs >= lim.automations) throw new APIError(`Your pack allows ${lim.automations} automations.`, 402)
  return data
}

export const Automations: CollectionConfig = {
  slug: 'automations',
  admin: { group: 'Data', useAsTitle: 'name', defaultColumns: ['name', 'source', 'field', 'operator', 'threshold', 'enabled'] },
  access: { read: ownOrAdmin, update: ownOrAdmin, delete: ownOrAdmin, create: loggedIn },
  hooks: { beforeValidate: [forceOwner], beforeChange: [onCreateAutomation] },
  fields: [
    ownerField,
    { name: 'name', type: 'text', required: true },
    { name: 'source', type: 'relationship', relationTo: 'data-sources', required: true },
    { name: 'field', type: 'text', required: true, admin: { description: 'The field in your data, e.g. temperature' } },
    {
      name: 'operator',
      type: 'select',
      required: true,
      defaultValue: 'gt',
      options: [
        { label: 'greater than', value: 'gt' },
        { label: 'less than', value: 'lt' },
        { label: 'equals', value: 'eq' },
        { label: 'anomaly (unusual value)', value: 'anomaly' },
      ],
    },
    { name: 'threshold', type: 'number' },
    {
      name: 'action',
      type: 'select',
      required: true,
      defaultValue: 'email',
      options: [
        { label: 'Send e-mail', value: 'email' },
        { label: 'Call a webhook', value: 'webhook' },
      ],
    },
    { name: 'target', type: 'text', required: true, admin: { description: 'E-mail address or webhook URL' } },
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'lastTriggeredAt', type: 'date' },
    { name: 'triggerCount', type: 'number', defaultValue: 0 },
  ],
}
