'use client'

import React, { useEffect, useState } from 'react'
import Link from '@/i18n/client'

type Hit = { slug: string; title: string; summary: string; topic?: string }

/** Search box of the help center: shows matching articles while you type. */
export function HelpSearch() {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  useEffect(() => {
    if (q.trim().length < 2) return setHits([])
    const id = setTimeout(async () => {
      const r = await fetch(`/api/ca/support/suggest?q=${encodeURIComponent(q)}`).then((x) => x.json()).catch(() => ({ articles: [] }))
      setHits(r.articles ?? [])
    }, 200)
    return () => clearTimeout(id)
  }, [q])
  return (
    <div className="relative text-start">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the help center" aria-label="Search the help center" className="h-12 w-full rounded-full border border-neutral-200 bg-white px-5 text-[15px] outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950" />
      {q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-14 z-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-950">
          {hits.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">No article found. <Link href={`/support/request?subject=${encodeURIComponent(q)}`} className="underline">Ask the support team</Link></p>
          ) : (
            hits.map((h) => (
              <Link key={h.slug} href={`/support/articles/${h.slug}`} className="block border-b border-neutral-100 p-4 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                <span className="text-[14px] font-medium">{h.title}</span>
                <span className="block text-[12px] text-neutral-500">{h.topic}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
