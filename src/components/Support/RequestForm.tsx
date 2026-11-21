'use client'

import React, { useEffect, useState } from 'react'
import Link from '@/i18n/client'

type Hit = { slug: string; title: string; summary: string }
const input = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950'

export function RequestForm({ initialSubject, email: initialEmail, topics }: { initialSubject: string; email: string; topics: { slug: string; title: string }[] }) {
  const [subject, setSubject] = useState(initialSubject)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [topic, setTopic] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = `${subject} ${message}`.trim()
    if (q.length < 3) return setHits([])
    const id = setTimeout(async () => {
      const r = await fetch(`/api/ca/support/suggest?q=${encodeURIComponent(q.slice(0, 200))}`).then((x) => x.json()).catch(() => ({ articles: [] }))
      setHits((r.articles ?? []).slice(0, 3))
    }, 400)
    return () => clearTimeout(id)
  }, [subject, message])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    setError(null)
    const r = await fetch('/api/ca/support/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, message, email, topic: topic || undefined }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok) setState('done')
    else { setError(j.error || 'Could not send. Try again.'); setState('idle') }
  }

  if (state === 'done') {
    return (
      <div className="mt-8 rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-900">
        <h2 className="text-[18px] font-semibold">Request sent</h2>
        <p className="mt-2 text-sm text-neutral-500">Thank you. We will answer by email within one working day.</p>
        <Link href="/support" className="mt-4 inline-block underline">Back to the help center</Link>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">Topic
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={`${input} mt-1`}>
          <option value="">Choose a topic (optional)</option>
          {topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">Subject<input required value={subject} onChange={(e) => setSubject(e.target.value)} className={`${input} mt-1`} /></label>
      <label className="block text-sm font-medium">What is wrong?<textarea required minLength={10} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className={`${input} mt-1`} /></label>
      {hits.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
          <p className="text-[13px] font-medium">These articles may already solve it:</p>
          <ul className="mt-2 space-y-1">
            {hits.map((h) => <li key={h.slug}><Link href={`/support/articles/${h.slug}`} className="text-[14px] underline">{h.title}</Link></li>)}
          </ul>
        </div>
      )}
      <label className="block text-sm font-medium">Your email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1`} /></label>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button disabled={state === 'busy'} className="h-11 rounded-full bg-neutral-900 px-6 text-[14px] font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900">{state === 'busy' ? 'Sending…' : 'Send to the support team'}</button>
    </form>
  )
}
