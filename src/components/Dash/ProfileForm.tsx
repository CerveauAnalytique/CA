'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const LANGS = [['en', 'English'], ['nl', 'Nederlands'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['pl', 'Polski'], ['ar', 'العربية']]
const input = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950'

type Props = { id: string | number; name: string; username: string; email: string; language: string }

export function ProfileForm(p: Props) {
  const router = useRouter()
  const [f, setF] = useState({ name: p.name, username: p.username, email: p.email, language: p.language, password: '', password2: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (f.password && f.password !== f.password2) return setMsg({ ok: false, text: 'The passwords do not match.' })
    setBusy(true)
    setMsg(null)
    const data: Record<string, unknown> = { name: f.name, email: f.email, language: f.language, username: f.username.trim().toLowerCase() || null }
    if (f.password) data.password = f.password
    try {
      const res = await fetch(`/api/users/${p.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.errors?.[0]?.data?.errors?.[0]?.message || json?.errors?.[0]?.message || 'Could not save.')
      setMsg({ ok: true, text: 'Saved.' })
      setF({ ...f, password: '', password2: '' })
      router.refresh()
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block text-xs font-medium text-neutral-500">{label}<div className="mt-1 text-sm font-normal text-neutral-900 dark:text-white">{children}</div></label>
  )

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
      <h2 className="text-[14px] font-semibold">Profile</h2>
      <Row label="Name"><input className={input} value={f.name} onChange={set('name')} /></Row>
      <Row label="Username"><input className={input} value={f.username} onChange={set('username')} placeholder="3-30 letters, numbers, - or _" autoComplete="username" /></Row>
      <Row label="E-mail"><input className={input} type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></Row>
      <Row label="Language">
        <select className={input} value={f.language} onChange={set('language')}>{LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </Row>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="New password (optional)"><input className={input} type="password" minLength={8} value={f.password} onChange={set('password')} autoComplete="new-password" /></Row>
        <Row label="Repeat password"><input className={input} type="password" value={f.password2} onChange={set('password2')} autoComplete="new-password" /></Row>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={busy} className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-medium text-white dark:bg-white dark:text-neutral-900">Save</button>
        {msg && <p role="status" className={`text-xs ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
      </div>
    </form>
  )
}
