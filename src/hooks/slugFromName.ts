import type { FieldHook } from 'payload'

export const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Fills the slug from `name` when it is empty. */
export const slugFromName: FieldHook = ({ value, data }) => {
  if (typeof value === 'string' && value.trim()) return toSlug(value)
  return typeof data?.name === 'string' ? toSlug(data.name) : value
}
