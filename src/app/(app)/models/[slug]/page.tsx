import type { Metadata } from 'next'
import Link from '@/i18n/client'
import { notFound } from 'next/navigation'
import React from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getT } from '@/i18n/server'
import { Pill, Specs, formatBytes, formatNumber } from '@/components/Catalog/parts'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'ai-models',
    overrideAccess: false,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await load((await params).slug)
  return { title: m ? `${m.name} — AI Models` : 'AI Models', description: m?.summary }
}

export default async function ModelPage({ params }: Props) {
  const t = await getT()
  const m = await load((await params).slug)
  if (!m) notFound()

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <Link href="/models" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
        <ArrowLeft size={14} /> {t('All models')}
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill>{m.framework}</Pill>
            {m.task && <Pill>{m.task.replace('-', ' ')}</Pill>}
            <Pill>{m.stage}</Pill>
          </div>
          <h1 className="mt-4 text-[clamp(30px,4vw,44px)] font-light leading-tight tracking-tight">{m.name}</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            {m.publisher} · {m.version}
          </p>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600">{m.summary}</p>

          {m.installCommand && (
            <>
              <h2 className="mt-10 text-[14px] font-semibold">{t('Install')}</h2>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-neutral-900 p-4 text-[13px] leading-relaxed text-neutral-100">
                <code>{m.installCommand}</code>
              </pre>
            </>
          )}

          {m.metrics && m.metrics.length > 0 && (
            <>
              <h2 className="mt-10 text-[14px] font-semibold">{t('Metrics')}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {m.metrics.map((x) => (
                  <div key={x.id} className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-[11px] text-neutral-400">{x.name}</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight">{x.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {m.modelCard && (
            <>
              <h2 className="mt-10 text-[14px] font-semibold">{t('Model card')}</h2>
              <div className="mt-3 max-w-2xl whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-600">
                {m.modelCard}
              </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-2xl bg-neutral-50 p-6">
          {m.downloadUrl && (
            <a
              href={m.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-6 flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-900 text-[14px] font-medium text-white"
            >
              {t('Get the model')} <ExternalLink size={14} />
            </a>
          )}
          <Specs
            rows={[
              [t('Framework'), m.framework],
              [t('Base model'), m.baseModel],
              [t('Version'), m.version],
              [t('Stage'), m.stage],
              [t('License'), m.license],
              [t('Size'), formatBytes(m.sizeBytes)],
              [t('Downloads'), formatNumber(m.downloads)],
            ]}
          />
          {m.tags && m.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {m.tags.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
