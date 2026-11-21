import type { Metadata } from 'next'
import Link from '@/i18n/client'
import { getT } from '@/i18n/server'
import React from 'react'
import { Download, Search, Star } from 'lucide-react'
import {
  getCategories,
  listApps,
  marketAsset,
  MARKETPLACE_WEB_URL,
  type MarketApp,
} from '@/lib/marketplace'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Apps and tools for CA7. Browse, install and publish.',
}

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

const href = (q: string, category: string, sort: string) => {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  if (category && category !== 'All Categories') p.set('category', category)
  if (sort === 'new') p.set('sort', 'new')
  const s = p.toString()
  return s ? `/shop?${s}` : '/shop'
}

function AppCard({ app, featuredLabel }: { app: MarketApp; featuredLabel: string }) {
  const icon = marketAsset(app.icon_url)
  return (
    <Link
      href={`/shop/${app.id}`}
      className="group flex flex-col rounded-2xl bg-neutral-50 p-5 transition hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    >
      <div className="flex items-start justify-between">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5 dark:bg-neutral-950" />
        ) : (
          <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-950" />
        )}
        {app.featured && (
          <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white dark:bg-white dark:text-neutral-900">
            {featuredLabel}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-tight">{app.name}</h3>
      <p className="mt-0.5 text-[12px] text-neutral-400">
        {app.developer} · {app.category}
      </p>
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">{app.description}</p>
      <div className="mt-5 flex items-center justify-between text-[12px] text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-amber-400 text-amber-400" /> {app.rating.toFixed(1)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Download size={13} /> {app.downloads.toLocaleString('en-US')}
        </span>
        <span className="font-semibold text-neutral-900 dark:text-white">{app.price}</span>
      </div>
    </Link>
  )
}

export default async function ShopPage({ searchParams }: Props) {
  const t = await getT()
  const sp = await searchParams
  const q = one(sp.q)
  const category = one(sp.category) || 'All Categories'
  const sort = one(sp.sort) === 'new' ? 'new' : 'popular'

  const [apps, categories] = await Promise.all([listApps({ q, category, sort }), getCategories()])

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">{t('Shop')}</p>
          <h1 className="mt-3 text-[clamp(30px,4vw,48px)] font-light leading-tight tracking-tight">
            {t('Apps and tools for CA7')}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-neutral-500 dark:text-neutral-400">
            {t('Install ready-made apps for your IoT, sensors and data, or publish your own.')}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href="/products"
          className="inline-flex h-11 items-center rounded-full bg-neutral-100 px-6 text-[14px] font-medium dark:bg-neutral-800"
        >
          {t('Hardware and products')}
        </Link>
        <a
          href={`${MARKETPLACE_WEB_URL}/Apps/Upload`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-neutral-900 px-6 text-[14px] font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {t('Publish an app')}
        </a>
        </div>
      </div>

      <form action="/shop" className="mt-8 flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-1.5 dark:bg-neutral-800">
        <Search size={16} className="text-neutral-400" />
        <input
          name="q"
          defaultValue={q}
          placeholder={t('Search apps and tools…')}
          className="h-9 flex-1 bg-transparent text-[14px] outline-none placeholder:text-neutral-400"
        />
        {category !== 'All Categories' && <input type="hidden" name="category" value={category} />}
        {sort === 'new' && <input type="hidden" name="sort" value="new" />}
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c}
              href={href(q, c, sort)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] ${
                c === category ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              } dark:text-neutral-300`}
            >
              {c}
            </Link>
          ))}
        </div>
        <div className="flex gap-1 text-[13px]">
          {(['popular', 'new'] as const).map((s) => (
            <Link
              key={s}
              href={href(q, category, s)}
              className={`rounded-full px-3 py-1.5 ${
                sort === s ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {s === 'popular' ? t('Popular') : t('New')}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {apps === null ? (
          <div className="rounded-2xl bg-neutral-50 p-10 text-center dark:bg-neutral-900">
            <p className="text-[15px] font-medium">{t('The shop is offline right now.')}</p>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">{t('Please try again in a moment.')}</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl bg-neutral-50 p-10 text-center text-[14px] text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            {t('No apps found. Try a different search or category.')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apps.map((a) => (
              <AppCard key={a.id} app={a} featuredLabel={t('Featured')} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
