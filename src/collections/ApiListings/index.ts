import type { Access, CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig, FieldAccess, Where } from 'payload'
import { APIError } from 'payload'
import { randomBytes } from 'node:crypto'
import { checkRole } from '@/access/utilities'
import { slugFromName, toSlug } from '@/hooks/slugFromName'

/** How many listings one customer may have (stops spam; admins have no limit). */
export const MAX_LISTINGS_PER_USER = 20
/** Largest OpenAPI / Swagger file we keep (characters). */
export const MAX_SPEC_CHARS = 300_000

const isAdmin = (user: unknown) => checkRole(['admin'], user as never)

/** Everyone sees published listings; a customer also sees their own (pending or rejected); admins see all. */
const readListings: Access = ({ req: { user } }) => {
  if (user && isAdmin(user)) return true
  const published: Where = { status: { equals: 'published' } }
  if (user) return { or: [published, { owner: { equals: user.id } }] }
  return published
}
const ownOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return { owner: { equals: user.id } }
}
const loggedIn: Access = ({ req: { user } }) => Boolean(user)
const adminField: FieldAccess = ({ req: { user } }) => isAdmin(user)

const httpsUrl = (v: unknown, required: boolean) => {
  if (v == null || v === '') return required ? 'Required.' : true
  try {
    const u = new URL(String(v))
    return u.protocol === 'https:' ? true : 'Use an https:// address.'
  } catch {
    return 'This is not a valid address.'
  }
}

/** The owner is always the logged-in customer; their name is shown as publisher. */
const forceOwner: CollectionBeforeValidateHook = ({ data, req: { user }, operation }) => {
  if (!user || !data || isAdmin(user)) return data
  if (operation === 'create') {
    data.owner = user.id
    const u = user as { name?: string | null; email?: string }
    data.publisher = u.name?.trim() || u.email?.split('@')[0] || 'Community'
  }
  if (operation === 'update') {
    delete data.owner
    delete data.publisher
  }
  return data
}

/** Counts the endpoints in an OpenAPI / Swagger file (JSON or YAML) without running it. */
export function countEndpoints(spec: string): number {
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
  try {
    const paths = (JSON.parse(spec) as { paths?: Record<string, Record<string, unknown>> }).paths ?? {}
    return Object.values(paths).reduce((n, p) => n + Object.keys(p ?? {}).filter((k) => methods.includes(k.toLowerCase())).length, 0)
  } catch {
    // YAML: count the method keys under `paths:` (two levels deep)
    const after = spec.split(/^paths:\s*$/m)[1]
    if (!after) return 0
    const block = after.split(/^\S/m)[0]
    return (block.match(new RegExp(`^\\s{2,6}(${methods.join('|')}):\\s*$`, 'gim')) ?? []).length
  }
}

const beforeChange: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  const user = req.user
  if (typeof data.openapi === 'string') {
    if (data.openapi.length > MAX_SPEC_CHARS) throw new APIError(`The API file is too large (max ${MAX_SPEC_CHARS / 1000} KB).`, 413)
    data.endpointCount = data.openapi.trim() ? countEndpoints(data.openapi) : 0
  }
  if (user && !isAdmin(user)) {
    // every change by a customer goes back to review before it is public again
    data.status = 'pending'
    if (operation === 'create') {
      const { totalDocs } = await req.payload.count({ collection: 'api-listings', where: { owner: { equals: user.id } }, overrideAccess: true })
      if (totalDocs >= MAX_LISTINGS_PER_USER) throw new APIError(`You can publish up to ${MAX_LISTINGS_PER_USER} APIs.`, 402)
    }
  }
  if (operation === 'create' || (data.slug && data.slug !== originalDoc?.slug)) {
    const base = toSlug(String(data.slug || data.name || 'api')) || 'api'
    const { totalDocs } = await req.payload.count({ collection: 'api-listings', where: { slug: { equals: base } }, overrideAccess: true })
    data.slug = totalDocs ? `${base}-${randomBytes(2).toString('hex')}` : base
  }
  return data
}

/** API Hub: APIs that customers publish (name, base URL, docs and an optional OpenAPI file). An admin reviews a
 *  listing before it is public. CA7 never calls these APIs; it only shows them. */
export const ApiListings: CollectionConfig = {
  slug: 'api-listings',
  labels: { singular: 'API listing', plural: 'API Hub' },
  admin: { group: 'Catalog', useAsTitle: 'name', defaultColumns: ['name', 'publisher', 'category', 'status', 'updatedAt'] },
  access: { read: readListings, create: loggedIn, update: ownOrAdmin, delete: ownOrAdmin },
  hooks: { beforeValidate: [forceOwner], beforeChange: [beforeChange] },
  defaultSort: '-updatedAt',
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true, admin: { position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      access: { create: adminField, update: adminField },
      options: [
        { label: 'Waiting for review', value: 'pending' },
        { label: 'Published', value: 'published' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'reviewNote', type: 'text', access: { create: adminField, update: adminField }, admin: { position: 'sidebar', description: 'Shown to the owner when rejected.' } },
    { name: 'publisher', type: 'text', admin: { position: 'sidebar' } },
    { name: 'name', type: 'text', required: true, maxLength: 80 },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar' }, hooks: { beforeValidate: [slugFromName] } },
    { name: 'summary', type: 'textarea', required: true, maxLength: 300 },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'data',
      options: [
        { label: 'Data', value: 'data' },
        { label: 'AI', value: 'ai' },
        { label: 'IoT and sensors', value: 'iot' },
        { label: 'Finance', value: 'finance' },
        { label: 'Commerce', value: 'commerce' },
        { label: 'Communication', value: 'communication' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'baseUrl', type: 'text', required: true, validate: (v: unknown) => httpsUrl(v, true) },
    { name: 'docsUrl', type: 'text', validate: (v: unknown) => httpsUrl(v, false) },
    {
      name: 'auth',
      type: 'select',
      defaultValue: 'apiKey',
      options: [
        { label: 'No key', value: 'none' },
        { label: 'API key', value: 'apiKey' },
        { label: 'Bearer token', value: 'bearer' },
        { label: 'OAuth 2', value: 'oauth2' },
      ],
    },
    {
      name: 'pricing',
      type: 'select',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Free and paid', value: 'freemium' },
        { label: 'Paid', value: 'paid' },
      ],
    },
    { name: 'openapi', type: 'code', admin: { language: 'json', description: 'OpenAPI / Swagger file (JSON or YAML).' } },
    { name: 'endpointCount', type: 'number', defaultValue: 0, admin: { readOnly: true, position: 'sidebar' } },
  ],
}
