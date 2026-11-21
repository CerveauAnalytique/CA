'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const ITEMS = [
  { href: '/shop', title: 'Shop', text: 'Apps and tools for CA7', img: '/nav/shop.svg' },
  { href: '/models', title: 'AI Models', text: 'Models for your data and cameras', img: '/nav/models.svg' },
  { href: '/datasets', title: 'Datasets', text: 'Data from cameras, sensors and logs', img: '/nav/datasets.svg' },
]

/** One "Explore" entry in the navbar that holds Shop, AI Models and Datasets. */
export function ExploreMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const active = ITEMS.some((i) => pathname.startsWith(i.href))

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="nav-dd"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`nav-link nav-dd__btn ${active ? 'is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Explore
        <ChevronDown size={13} className={`nav-dd__chev ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div className="nav-dd__panel" role="menu">
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem" className="nav-dd__item">
              <span className="nav-dd__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.img} alt="" width={96} height={96} />
              </span>
              <span className="nav-dd__title">{i.title}</span>
              <span className="nav-dd__text">{i.text}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
