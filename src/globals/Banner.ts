import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { adminOnly } from '@/access/adminOnly'

/** The marketing banner above the navbar. Switch it on and change the text, link and color in the admin panel (Globals > Banner). */
export const Banner: GlobalConfig = {
  slug: 'banner',
  label: 'Marketing banner',
  access: { read: () => true, update: adminOnly },
  admin: { group: 'Content' },
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_banner', 'max')
        } catch {
          /* not inside a request (tests, scripts) */
        }
      },
    ],
  },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Show the banner' },
    { name: 'text', type: 'text', defaultValue: 'New: connect your data to one AI platform with CA7.', admin: { description: 'One short sentence.' } },
    { name: 'linkLabel', type: 'text', defaultValue: 'Learn more' },
    { name: 'linkUrl', type: 'text', defaultValue: '/pricing', admin: { description: 'A page of the site (/pricing) or a full address (https://...).' } },
    {
      name: 'color',
      type: 'select',
      defaultValue: 'blue',
      options: [
        { label: 'Blue', value: 'blue' },
        { label: 'Black', value: 'black' },
        { label: 'Green', value: 'green' },
        { label: 'Orange', value: 'orange' },
      ],
    },
    { name: 'dismissible', type: 'checkbox', defaultValue: true, label: 'Visitors can close it' },
  ],
}
