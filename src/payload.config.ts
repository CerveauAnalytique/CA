import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { plugins } from './plugins'
import { AiModels } from './collections/AiModels'
import { Datasets } from './collections/Datasets'
import { Automations, DataRecords, DataSources } from './collections/DataSources'
import { migrations } from './migrations'
import { seedCatalogIfEmpty } from './utilities/seedCatalog'
import { SitePages } from './collections/SitePages'
import { seedSitePagesIfEmpty } from './utilities/seedSitePages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
      header: ['@/components/AdminBrand#AdminHeader'],
      afterNav: ['@/components/AdminBrand#AdminFooter'],
      graphics: {
        Logo: '@/components/AdminBrand#AdminLogo',
        Icon: '@/components/AdminBrand#AdminIcon',
      },
    },
    user: Users.slug,
  },
  // origins of other front ends that call this API with a token, e.g. the Flutter web app (comma separated)
  cors: process.env.CA7_APP_ORIGINS ? process.env.CA7_APP_ORIGINS.split(',').map((o) => o.trim()) : undefined,
  collections: [Users, Pages, Categories, Media, Posts, AiModels, Datasets, DataSources, DataRecords, Automations, SitePages],
  onInit: async (payload) => {
    await seedCatalogIfEmpty(payload)
    await seedSitePagesIfEmpty(payload)
  },
  db: postgresAdapter({
    // tests run on a database that was created by the migrations: do not let the dev schema push change it
    push: !process.env.VITEST,
    // runs the migrations in src/migrations when the site starts in production
    prodMigrations: process.env.PAYLOAD_SKIP_MIGRATIONS === '1' ? undefined : migrations,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'info@ca7.io',
    defaultFromName: process.env.SMTP_FROM_NAME || 'Payload',
    ...(process.env.SMTP_HOST
      ? {
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || '',
            },
          },
        }
      : {}),
  }),
  endpoints: [],
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
