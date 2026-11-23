'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { Model, User } from '@/payload-types'
import { useAuth } from '@/providers/Auth'

type Settings = NonNullable<User['settings']>

/**
 * Account settings stored on the user. The same fields are read and written
 * by the Phylena chat (phylena.com), so a change here shows up there too.
 */
export function SettingsForm({ email }: { email: string }) {
  const { user, setUser } = useAuth()
  const [models, setModels] = useState<Model[]>([])
  const [name, setName] = useState('')
  const [settings, setSettings] = useState<Settings>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name ?? '')
    const s = user.settings ?? {}
    setSettings({
      ...s,
      // Keep only the id; the form sends ids back to the API.
      defaultModel: typeof s.defaultModel === 'object' ? s.defaultModel?.id : s.defaultModel,
    })
  }, [user])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/models?depth=0&limit=100`)
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((json) => setModels(json.docs ?? []))
      .catch(() => setModels([]))
  }, [])

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
        body: JSON.stringify({ name, settings }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      if (!response.ok) throw new Error(String(response.status))
      const json = await response.json()
      setUser(json.doc)
      toast.success('Settings saved.')
    } catch {
      toast.error('Could not save your settings.')
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="dash-settings-form">
      <div className="dash-settings-row">
        <label className="dash-settings-label">Email</label>
        <input className="dash-settings-input" value={user?.email ?? email} readOnly />
      </div>
      <div className="dash-settings-row">
        <label className="dash-settings-label" htmlFor="settings-name">
          Display Name
        </label>
        <input
          id="settings-name"
          className="dash-settings-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="dash-settings-row">
        <label className="dash-settings-label" htmlFor="settings-theme">
          Theme
        </label>
        <select
          id="settings-theme"
          className="dash-settings-input"
          value={settings.theme ?? 'system'}
          onChange={(e) => set('theme', e.target.value as Settings['theme'])}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="dash-settings-row">
        <label className="dash-settings-label" htmlFor="settings-model">
          Default model (Phylena chat)
        </label>
        <select
          id="settings-model"
          className="dash-settings-input"
          value={(settings.defaultModel as number | null | undefined) ?? ''}
          onChange={(e) => set('defaultModel', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Platform default</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="dash-settings-row">
        <label className="dash-settings-label" htmlFor="settings-language">
          Language
        </label>
        <select
          id="settings-language"
          className="dash-settings-input"
          value={settings.language ?? 'en'}
          onChange={(e) => set('language', e.target.value as Settings['language'])}
        >
          <option value="en">English</option>
          <option value="nl">Nederlands</option>
          <option value="fr">Français</option>
        </select>
      </div>
      <label className="dash-toggle-row">
        <input
          type="checkbox"
          className="dash-toggle-input"
          checked={Boolean(settings.reasoning)}
          onChange={(e) => set('reasoning', e.target.checked)}
        />
        <span className="dash-toggle-label">Reasoning on by default (Phylena chat)</span>
      </label>
      <button className="btn-primary" onClick={save} disabled={saving || !user}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
