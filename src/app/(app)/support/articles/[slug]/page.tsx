import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from '@/i18n/client'
import React from 'react'
import { Blocks } from '@/components/Support/Blocks'
import { HelpfulButton } from '@/components/Support/HelpfulButton'

export const dynamic = 'force-dynamic'

async function getArticle(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({ collection: 'support-articles', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] as unknown as { title: string; summary: string; slug: string; helpful?: number; blocks?: never[]; topic?: { title?: string; slug?: string } } | undefined
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArticle((await params).slug)
  return { title: a ? `${a.title} — CA7 Help` : 'Help', description: a?.summary }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getArticle((await params).slug)
  if (!a) notFound()
  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-12 md:py-16">
      <p className="text-[13px] text-neutral-500">
        <Link href="/support" className="underline">Help center</Link>
        {a.topic?.title && <> / <Link href={`/support?topic=${a.topic.slug}`} className="underline">{a.topic.title}</Link></>}
      </p>
      <h1 className="mt-4 text-[clamp(28px,4vw,40px)] font-light leading-tight tracking-tight">{a.title}</h1>
      <p className="mt-3 text-[16px] text-neutral-500">{a.summary}</p>
      <div className="mt-8"><Blocks blocks={a.blocks} /></div>
      <HelpfulButton slug={a.slug} count={a.helpful ?? 0} />
      <div className="mt-10 rounded-2xl bg-neutral-50 p-5 text-sm dark:bg-neutral-900">
        Did not solve it? <Link href={`/support/request?subject=${encodeURIComponent(a.title)}`} className="underline">Contact support</Link>
      </div>
    </div>
  )
}
