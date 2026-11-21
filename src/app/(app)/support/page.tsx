import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from '@/i18n/client'
import React from 'react'
import { HelpSearch } from '@/components/Support/HelpSearch'

export const metadata: Metadata = { title: 'Help center — CA7', description: 'Answers about your account, packs, data, AI and the shop.' }
export const dynamic = 'force-dynamic'

type Topic = { id: number; slug: string; title: string; description?: string; badge?: string }
type Article = { id: number; slug: string; title: string; summary: string; helpful?: number; popular?: boolean; topic?: Topic | number }

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams
  const payload = await getPayload({ config: configPromise })
  const [topics, articles] = await Promise.all([
    payload.find({ collection: 'support-topics', sort: 'order', limit: 50, depth: 0 }),
    payload.find({ collection: 'support-articles', limit: 200, depth: 1, sort: '-helpful' }),
  ])
  const T = topics.docs as unknown as Topic[]
  const A = articles.docs as unknown as Article[]
  const count = (t: Topic) => A.filter((a) => typeof a.topic === 'object' && a.topic?.id === t.id).length
  const active = T.find((t) => t.slug === topic)
  const list = active ? A.filter((a) => typeof a.topic === 'object' && a.topic?.id === active.id) : A.slice(0, 6)
  const popular = A.filter((a) => a.popular).slice(0, 3)

  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 py-12 md:py-16">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Help center</p>
        <h1 className="mt-3 text-[clamp(30px,4vw,48px)] font-light leading-tight tracking-tight">How can we help?</h1>
        <div className="mx-auto mt-8 max-w-xl"><HelpSearch /></div>
        {popular.length > 0 && (
          <p className="mt-4 text-[13px] text-neutral-500">
            Popular:{' '}
            {popular.map((a, i) => (
              <span key={a.id}>{i > 0 && ' · '}<Link href={`/support/articles/${a.slug}`} className="underline">{a.title}</Link></span>
            ))}
          </p>
        )}
      </div>

      <h2 className="mt-14 text-[18px] font-semibold">Browse by topic</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {T.map((t) => (
          <Link key={t.id} href={`/support?topic=${t.slug}`} className={`rounded-2xl p-5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${active?.id === t.id ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[13px] font-semibold text-blue-700 dark:bg-neutral-950">{t.badge}</span>
            <h3 className="mt-3 text-[15px] font-semibold">{t.title}</h3>
            <p className="mt-1 text-[13px] text-neutral-500">{t.description}</p>
            <p className="mt-3 text-[12px] text-neutral-400">{count(t)} {count(t) === 1 ? 'article' : 'articles'}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-14 text-[18px] font-semibold">{active ? active.title : 'Most helpful articles'}</h2>
      <div className="mt-4 divide-y divide-neutral-200 rounded-2xl bg-neutral-50 dark:divide-neutral-800 dark:bg-neutral-900">
        {list.length === 0 && <p className="p-5 text-sm text-neutral-500">No articles yet.</p>}
        {list.map((a) => (
          <Link key={a.id} href={`/support/articles/${a.slug}`} className="block p-5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <h3 className="text-[15px] font-medium">{a.title}</h3>
            <p className="mt-1 text-[13px] text-neutral-500">{a.summary}</p>
            <p className="mt-2 text-[12px] text-neutral-400">
              {typeof a.topic === 'object' ? a.topic?.title : ''}
              {a.helpful ? ` · Helped ${a.helpful} ${a.helpful === 1 ? 'member' : 'members'}` : ''}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-neutral-900 p-8 text-white md:p-10">
        <h2 className="text-[22px] font-light">Still stuck?</h2>
        <p className="mt-2 max-w-xl text-[14px] text-neutral-300">
          Tell us what is wrong. We first show the articles that fit your problem; if they do not solve it, your request goes to our support team, who answer within one working day.
        </p>
        <Link href="/support/request" className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-6 text-[14px] font-medium text-neutral-900">Contact support</Link>
      </div>
    </div>
  )
}
