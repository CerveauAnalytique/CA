'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyField({ value, mono = true }: { value: string; mono?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <div className="mt-1 flex items-center gap-2 rounded-lg bg-white px-3 py-2">
      <span className={`min-w-0 flex-1 truncate text-xs ${mono ? 'font-mono' : ''}`}>{value}</span>
      <button
        type="button"
        aria-label="Copy"
        className="text-neutral-400 hover:text-neutral-900"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setDone(true)
            setTimeout(() => setDone(false), 1500)
          } catch {
            /* clipboard blocked */
          }
        }}
      >
        {done ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}
