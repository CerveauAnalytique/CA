'use client'

import React, { useState } from 'react'

export function HelpfulButton({ slug, count }: { slug: string; count: number }) {
  const [n, setN] = useState(count)
  const [done, setDone] = useState(false)
  return (
    <div className="mt-10 flex items-center gap-3 border-t border-neutral-200 pt-6 text-sm dark:border-neutral-800">
      <span>Was this article helpful?</span>
      <button
        disabled={done}
        className="rounded-full border border-neutral-300 px-4 py-1.5 text-[13px] hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
        onClick={async () => {
          const r = await fetch('/api/ca/support/helpful', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) })
          const j = await r.json().catch(() => ({}))
          setDone(true)
          if (r.ok) setN(j.helpful ?? n + 1)
        }}
      >
        {done ? 'Thanks!' : 'Yes, it helped'}
      </button>
      {n > 0 && <span className="text-[12px] text-neutral-400">Helped {n} {n === 1 ? 'member' : 'members'}</span>}
    </div>
  )
}
