import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/** Everyone can read published entries; admins can read everything. */
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (checkRole(['admin'], user)) return true
  return { published: { equals: true } }
}
