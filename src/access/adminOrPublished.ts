import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Admins see everything; everyone else (including Phylena and other API
 * clients without a login) only sees documents whose `status` is published.
 */
export const adminOrPublished: Access = ({ req: { user } }) => {
  if (user && checkRole(['admin'], user)) {
    return true
  }

  return {
    status: {
      equals: 'published',
    },
  }
}
