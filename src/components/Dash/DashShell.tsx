'use client'

import React from 'react'
import Link from '@/i18n/client'
import { usePathname } from 'next/navigation'

type Props = {
  user: { email: string; name?: string }
  children: React.ReactNode
}

const TABS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/api', label: 'API keys' },
  { href: '/dashboard/export', label: 'Export & sync' },
]

/** Settings-style page that lives inside the normal site layout (no separate app frame). */
export function DashShell({ user, children }: Props) {
  const pathname = usePathname()
  const name = user.name || user.email.split('@')[0]

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Dashboard</p>
      <h1 className="mt-3 text-[clamp(30px,4vw,44px)] font-light leading-tight tracking-tight">
        Your data, {name}
      </h1>
      <p className="mt-3 max-w-xl text-[15px] text-neutral-500 dark:text-neutral-400">
        Manage your API key and export everything you saved in CA7.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Dashboard sections">
        {TABS.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
                active ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              } dark:text-neutral-300`}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  )
}

export function Card({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
