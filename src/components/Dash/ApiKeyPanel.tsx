'use client'

import React, { useState } from 'react'
import { Card } from './DashShell'
import { CopyField } from './CopyField'

export function ApiKeyPanel({ enabled: initial, base }: { enabled: boolean; base: string }) {
  const [enabled, setEnabled] = useState(initial)
  const [key, setKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const call = async (method: 'POST' | 'DELETE') => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/ca/key', { method, credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      if (method === 'POST') {
        setKey(data.apiKey)
        setEnabled(true)
      } else {
        setKey(null)
        setEnabled(false)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const shown = key ?? '<your-api-key>'

  return (
    <div className="space-y-4">
      <Card
        title="API key"
        action={
          <div className="flex gap-2">
            {enabled && (
              <button
                disabled={busy}
                onClick={() => call('DELETE')}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-100"
              >
                Disable
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => call('POST')}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              {enabled ? 'Regenerate' : 'Create API key'}
            </button>
          </div>
        }
      >
        <p className="text-xs text-neutral-500">
          Status:{' '}
          <span className={enabled ? 'font-semibold text-emerald-600' : 'font-semibold text-neutral-400'}>
            {enabled ? 'Active' : 'Not created'}
          </span>
        </p>
        {key && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-amber-600">
              Copy it now. For safety it is shown only once.
            </p>
            <CopyField value={key} />
          </div>
        )}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </Card>

      <Card title="Use the API">
        <p className="mb-2 text-xs text-neutral-500">Read all your data with one request:</p>
        <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-3.5 text-[12px] leading-relaxed text-neutral-200">
{`curl ${base}/api/ca/export \\
  -H "Authorization: users API-Key ${shown}"`}
        </pre>
        <p className="mb-2 mt-4 text-xs text-neutral-500">Only some collections:</p>
        <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-3.5 text-[12px] text-neutral-200">
{`curl "${base}/api/ca/export?collections=orders,products" \\
  -H "Authorization: users API-Key ${shown}"`}
        </pre>
        <p className="mt-4 text-xs text-neutral-500">
          The same header works on the standard Payload REST API, for example{' '}
          <code className="rounded bg-neutral-100 px-1">{base}/api/posts</code>.
        </p>
      </Card>
    </div>
  )
}
