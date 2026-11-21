import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { Download } from 'lucide-react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Chips, CatalogHead, Pill, SearchBox } from '@/components/Catalog/parts'

export const metadata: Metadata = {
  title: 'AI Models',
  description: 'AI models for your data, cameras and sensors.',
}
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''

const FRAMEWORKS = [
  { value: 'all', label: 'All' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'pytorch', label: 'PyTorch' },
  { value: 'tensorflow', label: 'TensorFlow' },
  { value: 'sklearn', label: 'scikit-learn' },
  { value: 'xgboost', label: 'XGBoost' },
  { value: 'onnx', label: 'ONNX' },
]

export default async function ModelsPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = one(sp.q).trim()
  const framework = one(sp.framework) || 'all'

  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'ai-models',
    overrideAccess: false,
    limit: 60,
    sort: '-downloads',
    where: {
      and: [
        ...(framework !== 'all' ? [{ framework: { equals: framework } }] : []),
        ...(q
          ? [{ or: [{ name: { like: q } }, { summary: { like: q } }, { publisher: { like: q } }] }]
          : []),
      ],
    },
  })

  const hrefFor = (v: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (v !== 'all') p.set('framework', v)
    const s = p.toString()
    return s ? `/models?${s}` : '/models'
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <CatalogHead
        eyebrow="AI Models"
        title="AI models for your data"
        text="Ready-to-run models for cameras, sensors and analytics. Pick one, install it and connect it to CA7."
      />
      <SearchBox action="/models" q={q} extra={framework !== 'all' ? { framework } : undefined} />
      <Chips items={FRAMEWORKS} active={framework} hrefFor={hrefFor} />

      <div className="mt-8">
        {res.docs.length === 0 ? (
          <div className="rounded-2xl bg-neutral-50 p-10 text-center text-[14px] text-neutral-500">
            No models found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {res.docs.map((m) => (
              <Link
                key={m.id}
                href={`/models/${m.slug}`}
                className="flex flex-col rounded-2xl bg-neutral-50 p-5 transition hover:bg-neutral-100"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill>{m.framework}</Pill>
                  {m.task && <Pill>{m.task.replace('-', ' ')}</Pill>}
                  {m.stage === 'production' && <Pill>production</Pill>}
                </div>
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{m.name}</h3>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  {m.publisher} · {m.version}
                </p>
                <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-neutral-500">{m.summary}</p>
                <div className="mt-5 flex items-center justify-between text-[12px] text-neutral-500">
                  <span>{m.license}</span>
                  <span className="inline-flex items-center gap-1">
                    <Download size={13} /> {(m.downloads ?? 0).toLocaleString('en-US')}
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
