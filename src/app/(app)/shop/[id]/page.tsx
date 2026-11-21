import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ArrowLeft, Download, Star } from 'lucide-react'
import { getApp, marketAsset, marketDownloadUrl } from '@/lib/marketplace'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const app = await getApp((await params).id)
  return { title: app ? `${app.name} — Shop` : 'Shop' }
}

export default async function AppPage({ params }: Props) {
  const app = await getApp((await params).id)
  if (!app) notFound()

  const icon = marketAsset(app.icon_url)
  const approved = app.status === 'approved'

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-900">
        <ArrowLeft size={14} /> Back to shop
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-5">
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="h-20 w-20 rounded-3xl bg-neutral-50 object-contain p-2" />
            ) : (
              <div className="h-20 w-20 rounded-3xl bg-neutral-50" />
            )}
            <div>
              <h1 className="text-[clamp(28px,4vw,40px)] font-light leading-tight tracking-tight">{app.name}</h1>
              <p className="mt-1 text-[14px] text-neutral-500">
                {app.developer} · {app.category}
              </p>
            </div>
          </div>

          <h2 className="mt-10 text-[14px] font-semibold">About this app</h2>
          <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-600">
            {app.description}
          </p>
        </div>

        <aside className="h-fit rounded-2xl bg-neutral-50 p-6">
          <p className="text-[28px] font-light tracking-tight">{app.price}</p>
          {approved ? (
            <a
              href={marketDownloadUrl(app.id)}
              className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-900 text-[15px] font-medium text-white"
            >
              <Download size={16} /> Install
            </a>
          ) : (
            <p className="mt-4 rounded-xl bg-white p-3 text-[13px] text-neutral-500">
              This app is not available for download yet.
            </p>
          )}
          <dl className="mt-6 space-y-3 text-[13px]">
            {[
              ['Rating', (<span key="r" className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />{app.rating.toFixed(1)}</span>)],
              ['Downloads', app.downloads.toLocaleString('en-US')],
              ['Version', app.version],
              ['Category', app.category],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between">
                <dt className="text-neutral-400">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  )
}
