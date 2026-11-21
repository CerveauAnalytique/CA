'use client'

import React, { useState } from 'react'

export function PlanActions({ plan, hasSubscription }: { plan: string; hasSubscription: boolean }) {
  const [msg, setMsg] = useState<string | null>(null)
  async function go(url: string, body?: unknown) {
    setMsg(null)
    const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })
    const json = await res.json().catch(() => ({}))
    if (json.url) window.location.href = json.url
    else setMsg(json.error || 'Something went wrong.')
  }
  const b = 'rounded-full px-5 py-2 text-[13px] font-medium'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!hasSubscription && plan === 'free' && (
        <button className={`${b} border border-neutral-300 dark:border-neutral-700`} onClick={() => go('/api/ca/billing/checkout', { plan: 'hobby' })}>Choose Hobby, €20/month</button>
      )}
      {!hasSubscription && (plan === 'free' || plan === 'hobby') && (
        <button className={`${b} bg-neutral-900 text-white dark:bg-white dark:text-neutral-900`} onClick={() => go('/api/ca/billing/checkout', { plan: 'pro' })}>Choose Pro, from €99/month</button>
      )}
      {hasSubscription && <button className={`${b} border border-neutral-300 dark:border-neutral-700`} onClick={() => go('/api/ca/billing/portal')}>Manage or cancel subscription</button>}
      {msg && <p className="text-xs text-red-600" role="alert">{msg}</p>}
    </div>
  )
}
