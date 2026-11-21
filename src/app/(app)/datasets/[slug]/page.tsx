import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Pill, Specs, formatBytes, formatNumber } from '@/components/Catalog/parts'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'datasets',
    overrideAccess: false,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load((await params).slug)
  return { title: d ? `${d.name} — Datasets` : 'Datasets', description: d?.summary }
}

export default async function DatasetPage({ params }: Props) {
  const d = await load((await params).slug)
  if (!d) notFound()

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <Link href="/datasets" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
        <ArrowLeft size={14} /> All datasets
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill>{d.format}</Pill>
            {d.source && d.source !== 'other' && <Pill>{d.source}</Pill>}
          </div>
          <h1 className="mt-4 text-[clamp(30px,4vw,44px)] font-light leading-tight tracking-tight">{d.name}</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            {d.publisher} · {d.version}
          </p>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600">{d.summary}</p>

          {d.schemaColumns && d.schemaColumns.length > 0 && (
            <>
              <h2 className="mt-10 text-[14px] font-semibold">Schema</h2>
              <div className="mt-3 overflow-x-auto rounded-2xl bg-neutral-50 p-2">
                <table className="w-full min-w-[420px] text-left text-[13px]">
                  <thead className="text-[11px] text-neutral-400">
                    <tr>
                      <th className="px-3 py-2 font-normal">Column</th>
                      <th className="px-3 py-2 font-normal">Type</th>
                      <th className="px-3 py-2 font-normal">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.schemaColumns.map((c) => (
                      <tr key={c.id} className="border-t border-neutral-100">
                        <td className="px-3 py-2.5 font-mono text-[12px]">{c.column}</td>
                        <td className="px-3 py-2.5 text-neutral-500">{c.type}</td>
                        <td className="px-3 py-2.5 text-neutral-500">{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {d.datasetCard && (
            <>
              <h2 className="mt-10 text-[14px] font-semibold">About this dataset</h2>
              <div className="mt-3 max-w-2xl whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-600">
                {d.datasetCard}
              </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-2xl bg-neutral-50 p-6">
          {d.downloadUrl && (
            <a
              href={d.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-6 flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-900 text-[14px] font-medium text-white"
            >
              Get the data <ExternalLink size={14} />
            </a>
          )}
          <Specs
            rows={[
              ['Format', d.format],
              ['Version', d.version],
              ['License', d.license],
              ['Rows', formatNumber(d.rowCount)],
              ['Columns', formatNumber(d.columnCount)],
              ['Size', formatBytes(d.sizeBytes)],
              ['Downloads', formatNumber(d.downloads)],
            ]}
          />
          {d.tags && d.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {d.tags.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
