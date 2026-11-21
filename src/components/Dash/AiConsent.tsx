'use client'

import React, { useState } from 'react'

/** Personal AI suggestions use the customer's own order history, only after they opt in. */
export function AiConsent({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial)
  const [busy, setBusy] = useState(false)
  async function change(v: boolean) {
    setBusy(true)
    const r = await fetch('/api/ca/ai/consent', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: v }) })
    if (r.ok) setOn(v)
    setBusy(false)
  }
  return (
    <section className="mt-4 max-w-xl rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
      <h2 className="text-[14px] font-semibold">Personal AI suggestions</h2>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Let CA7 use your own order history for suggestions and &quot;running low?&quot; reminders. Without this, you only get general suggestions. You can change your mind at any time.
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={on} disabled={busy} onChange={(e) => change(e.target.checked)} />
        I allow this
      </label>
    </section>
  )
}
