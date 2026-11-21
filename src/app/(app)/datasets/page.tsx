import type { Metadata } from 'next'
import Link from '@/i18n/client'
import React from 'react'
import { Download } from 'lucide-react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getT } from '@/i18n/server'
import { tr } from '@/i18n/translate'
import { Chips, CatalogHead, Pill, SearchBox, formatBytes, formatNumber } from '@/components/Catalog/parts'

export const metadata: Metadata = {
  title: 'Datasets',
  description: 'Datasets from cameras, sensors and logs.',
}
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

const SOURCES = [
  { value: 'all', label: tr('All') },
  { value: 'cameras', label: tr('Cameras') },
  { value: 'sensors', label: tr('Sensors') },
  { value: 'logs', label: tr('Logs') },
  { value: 'business', label: tr('Business') },
]

export default async function DatasetsPage({ searchParams }: Props) {
  const t = await getT()
  const sp = await searchParams
  const q = one(sp.q).trim()
  const source = one(sp.source) || 'all'

  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'datasets',
    overrideAccess: false,
    limit: 60,
    sort: '-downloads',
    where: {
      and: [
        ...(source !== 'all' ? [{ source: { equals: source } }] : []),
        ...(q
          ? [{ or: [{ name: { like: q } }, { summary: { like: q } }, { publisher: { like: q } }] }]
          : []),
      ],
    },
  })

  const hrefFor = (v: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (v !== 'all') p.set('source', v)
    const s = p.toString()
    return s ? `/datasets?${s}` : '/datasets'
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <CatalogHead
        eyebrow={t('Datasets')}
        title={t('Datasets for your models')}
        text={t('Find data from cameras, sensors and logs, see its structure, and use it to train or test your models.')}
      />
      <SearchBox placeholder={t('Search…')} action="/datasets" q={q} extra={source !== 'all' ? { source } : undefined} />
      <Chips items={SOURCES.map((f) => ({ ...f, label: t(f.label) }))} active={source} hrefFor={hrefFor} />

      <div className="mt-8">
        {res.docs.length === 0 ? (
          <div className="rounded-2xl bg-neutral-50 p-10 text-center text-[14px] text-neutral-500">
            {t('No datasets found.')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {res.docs.map((d) => (
              <Link
                key={d.id}
                href={`/datasets/${d.slug}`}
                className="flex flex-col rounded-2xl bg-neutral-50 p-5 transition hover:bg-neutral-100"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill>{d.format}</Pill>
                  {d.source && d.source !== 'other' && <Pill>{d.source}</Pill>}
                </div>
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{d.name}</h3>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  {d.publisher} · {d.version}
                </p>
                <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-neutral-500">{d.summary}</p>
                <div className="mt-5 flex items-center justify-between text-[12px] text-neutral-500">
                  <span>{formatNumber(d.rowCount) ? t('{n} rows', { n: formatNumber(d.rowCount) ?? 0 }) : formatBytes(d.sizeBytes) ?? d.license}</span>
                  <span className="inline-flex items-center gap-1">
                    <Download size={13} /> {(d.downloads ?? 0).toLocaleString('en-US')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
