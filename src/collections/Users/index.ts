import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { publicAccess } from '@/access/publicAccess'
import { adminOrSelf } from '@/access/adminOrSelf'
import { checkRole } from '@/access/utilities'
import { isLocale } from '@/i18n/config'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'

const RESERVED_USERNAMES = ['admin', 'api', 'login', 'logout', 'account', 'dashboard', 'shop', 'pricing', 'support', 'root', 'ca7', 'cloud']

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: publicAccess,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    update: adminOrSelf,
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'plan', 'language', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'username',
      type: 'text',
      unique: true,
      index: true,
      label: 'Username',
      validate: (value: string | null | undefined) => {
        if (!value) return true
        if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(value)) return 'Use 3-30 lowercase letters, numbers, - or _.'
        if (RESERVED_USERNAMES.includes(value) || isLocale(value)) return 'This username is reserved.'
        return true
      },
      admin: { description: 'Shown in your profile. Also the first part of the private admin link.' },
    },
    {
      name: 'plan',
      type: 'select',
      label: 'Pack',
      defaultValue: 'free',
      access: {
        create: adminOnlyFieldAccess,
        read: ({ req: { user }, doc }) => Boolean(user && (checkRole(['admin'], user) || user.id === doc?.id)),
        update: adminOnlyFieldAccess,
      },
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Hobby', value: 'hobby' },
        { label: 'Pro', value: 'pro' },
        { label: 'Business', value: 'business' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      admin: { position: 'sidebar', description: 'The pack of this customer. Only admins can change it.' },
    },
    {
      name: 'usageMonth',
      type: 'text',
      access: { create: adminOnlyFieldAccess, read: adminOnlyFieldAccess, update: adminOnlyFieldAccess },
      admin: { position: 'sidebar', readOnly: true, description: 'Month of the API call counter (YYYY-MM).' },
    },
    {
      name: 'apiCallsMonth',
      type: 'number',
      defaultValue: 0,
      access: { create: adminOnlyFieldAccess, read: adminOnlyFieldAccess, update: adminOnlyFieldAccess },
      admin: { position: 'sidebar', readOnly: true, description: 'API calls this month.' },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      access: { create: adminOnlyFieldAccess, read: adminOnlyFieldAccess, update: adminOnlyFieldAccess },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'stripeSubscriptionId',
      type: 'text',
      access: { create: adminOnlyFieldAccess, read: adminOnlyFieldAccess, update: adminOnlyFieldAccess },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'language',
      type: 'select',
      label: 'Language',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Nederlands', value: 'nl' },
        { label: 'Deutsch', value: 'de' },
        { label: 'Français', value: 'fr' },
        { label: 'Español', value: 'es' },
        { label: 'Polski', value: 'pl' },
        { label: 'العربية', value: 'ar' },
      ],
      admin: { description: 'Chosen at sign-up. The site opens in this language when the customer logs in.' },
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
  ],
}
