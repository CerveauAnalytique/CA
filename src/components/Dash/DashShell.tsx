'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  KeyRound,
  Download,
  BookOpen,
  LifeBuoy,
  Settings,
  Search,
  Bell,
  ChevronsUpDown,
  Plus,
} from 'lucide-react'
import { BrainIcon } from '@/components/Logo/BrainIcon'

type Props = {
  user: { email: string; name?: string }
  counts: { slug: string; label: string; count: number }[]
  children: React.ReactNode
}

const MENU = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/dashboard/api', label: 'API keys', Icon: KeyRound },
  { href: '/dashboard/export', label: 'Export & sync', Icon: Download },
]

const DOTS = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6']

export function DashShell({ user, counts, children }: Props) {
  const pathname = usePathname()
  const name = user.name || user.email.split('@')[0]
  const crumb = MENU.find((m) => m.href === pathname)?.label ?? 'Dashboard'

  return (
    <div
      className="min-h-[calc(100vh-56px)] px-3 py-6 md:px-10 md:py-10"
      style={{
        backgroundColor: '#8fb3dd',
        backgroundImage:
          'radial-gradient(rgba(255,255,255,.35) 1.6px, transparent 1.7px), linear-gradient(#6f9bd1 0%, #aecaea 40%, #d9c690 72%, #a68c4f 100%)',
        backgroundSize: '6px 6px, 100% 100%',
      }}
    >
      <div className="mx-auto flex min-h-[620px] max-w-[1280px] overflow-hidden rounded-3xl border border-white/60 bg-neutral-100 text-neutral-900 shadow-2xl shadow-black/20">
        {/* Sidebar */}
        <aside className="hidden w-[250px] shrink-0 flex-col gap-4 bg-neutral-200/60 p-3 md:flex">
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <BrainIcon className="h-6 w-6" /> Cerveau
            </span>
            <ChevronsUpDown size={14} className="text-neutral-400" />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-neutral-400">
            <Search size={14} /> Search…
          </div>

          <div>
            <p className="px-2 pb-1 text-[11px] text-neutral-400">Main Menu</p>
            {MENU.map(({ href, label, Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
                    active ? 'bg-neutral-300/70 font-semibold' : 'text-neutral-600 hover:bg-neutral-300/40'
                  }`}
                >
                  <Icon size={15} /> {label}
                </Link>
              )
            })}
          </div>

          <div>
            <p className="px-2 pb-1 text-[11px] text-neutral-400">Your data</p>
            {counts.slice(0, 6).map((c, i) => (
              <Link
                key={c.slug}
                href="/dashboard/export"
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-300/40"
              >
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DOTS[i % DOTS.length] }} />
                  {c.label}
                </span>
                <span className="text-[11px] text-neutral-400">{c.count}</span>
              </Link>
            ))}
          </div>

          <div className="mt-auto space-y-0.5 text-[13px] text-neutral-600">
            <Link href="/docs" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-neutral-300/40">
              <BookOpen size={15} /> Knowledge hub
            </Link>
            <Link href="/contact" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-neutral-300/40">
              <LifeBuoy size={15} /> Support
            </Link>
            <Link href="/account" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-neutral-300/40">
              <Settings size={15} /> Settings
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 bg-neutral-50">
          <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3.5">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>Workspace</span>
              <span>›</span>
              <span className="font-semibold text-neutral-900">{crumb}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/api"
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                <Plus size={13} /> New API key
              </Link>
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500">
                <Bell size={14} />
              </span>
              <span
                title={name}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#1a3df0] text-xs font-semibold text-white"
              >
                {name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          </header>
          <div className="p-5">{children}</div>
        </div>
      </div>
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
