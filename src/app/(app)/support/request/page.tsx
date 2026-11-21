import type { Metadata } from 'next'
import React from 'react'
import { RequestForm } from '@/components/Support/RequestForm'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata: Metadata = { title: 'Contact support — CA7' }
export const dynamic = 'force-dynamic'

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const topics = await payload.find({ collection: 'support-topics', sort: 'order', limit: 50, depth: 0 })
  return (
    <div className="mx-auto w-full max-w-[680px] px-6 py-12 md:py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Help center</p>
      <h1 className="mt-3 text-[clamp(28px,4vw,40px)] font-light leading-tight tracking-tight">Contact support</h1>
      <p className="mt-3 text-[15px] text-neutral-500">Describe the problem. We first show articles that may solve it; if not, send the request. Our team answers within one working day.</p>
      <RequestForm initialSubject={subject ?? ''} email={user?.email ?? ''} topics={(topics.docs as unknown as { slug: string; title: string }[]).map((t) => ({ slug: t.slug, title: t.title }))} />
    </div>
  )
}
