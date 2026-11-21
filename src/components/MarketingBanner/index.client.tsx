'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Link from '@/i18n/client'

const COLORS: Record<string, string> = { blue: 'bg-blue-600', black: 'bg-neutral-900', green: 'bg-emerald-600', orange: 'bg-orange-500' }
const KEY = 'ca7_banner_closed'

export function BannerClient(p: { text: string; linkLabel: string; linkUrl: string; color: string; dismissible: boolean }) {
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === p.text) setClosed(true)
    } catch {
      /* no storage: show it */
    }
  }, [p.text])

  // the navbar and the page start below the banner (see --banner-h in globals.css)
  useEffect(() => {
    document.documentElement.style.setProperty('--banner-h', closed ? '0px' : '40px')
    return () => document.documentElement.style.setProperty('--banner-h', '0px')
  }, [closed])

  if (closed) return null
  const external = /^https?:\/\//.test(p.linkUrl)

  return (
    <div className={`fixed inset-x-0 top-0 z-[310] flex h-10 items-center justify-center px-10 text-[13px] text-white ${COLORS[p.color] ?? COLORS.blue}`} role="region" aria-label="Announcement">
      <p className="truncate">
        {p.text}
        {p.linkLabel && p.linkUrl && (
          <>
            {' '}
            {external ? (
              <a href={p.linkUrl} className="font-medium underline underline-offset-2" target="_blank" rel="noopener noreferrer">{p.linkLabel} →</a>
            ) : (
              <Link href={p.linkUrl} className="font-medium underline underline-offset-2">{p.linkLabel} →</Link>
            )}
          </>
        )}
      </p>
      {p.dismissible && (
        <button
          type="button"
          aria-label="Close"
          className="absolute end-3 flex h-6 w-6 items-center justify-center rounded hover:bg-white/15"
          onClick={() => {
            try { localStorage.setItem(KEY, p.text) } catch { /* ignore */ }
            setClosed(true)
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
