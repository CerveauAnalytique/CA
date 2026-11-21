'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/providers/Auth'
import { ArrowUpRight, MenuIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { formatUserDisplayName } from '@/utilities/formatUserDisplayName'

interface Props {
  menu: Header['navItems']
}

const LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/research', label: 'Research' },
  { href: '/api', label: 'API' },
  { href: '/docs', label: 'Docs' },
  { href: '/marketplace', label: 'Marketplace' },
]

export function MobileMenu({ menu }: Props) {
  const { user, logout } = useAuth()
  const username = formatUserDisplayName(user)

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const close = () => setIsOpen(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setIsOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  const linkClass =
    'flex items-center justify-between py-3.5 text-[26px] font-light tracking-tight text-neutral-900 dark:text-white'

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        className="relative flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 transition-colors dark:border-neutral-800 dark:text-white"
      >
        {isOpen ? <XIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full gap-0 border-0 bg-white px-6 pb-8 pt-4 sm:max-w-none dark:bg-neutral-950 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>

        <nav className="flex-1 overflow-y-auto">
          <ul>
            {menu?.length
              ? menu.map((item) => (
                  <li key={item.id} className={linkClass}>
                    <CMSLink {...item.link} appearance="link" />
                  </li>
                ))
              : LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={close} className={linkClass}>
                      {l.label}
                      <ArrowUpRight size={20} className="text-neutral-300" />
                    </Link>
                  </li>
                ))}
          </ul>
        </nav>

        <div className="space-y-3 pt-4">
          <Link
            href="/chat-ca7"
            onClick={close}
            className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 text-[15px] font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Start chat
          </Link>

          {user ? (
            <div className="rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
              <p className="truncate text-sm font-semibold">{username}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                <Link href="/dashboard" onClick={close} className="rounded-full bg-white px-3 py-1.5 dark:bg-neutral-800">
                  Dashboard
                </Link>
                <Link href="/account" onClick={close} className="rounded-full bg-white px-3 py-1.5 dark:bg-neutral-800">
                  Account
                </Link>
                <Link href="/orders" onClick={close} className="rounded-full bg-white px-3 py-1.5 dark:bg-neutral-800">
                  Orders
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    close()
                    logout()
                  }}
                  className="rounded-full bg-white px-3 py-1.5 text-red-600 dark:bg-neutral-800"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-100 text-[15px] font-medium dark:bg-neutral-900"
            >
              Log in
            </Link>
          )}

          <div className="flex items-center justify-between pt-1 text-[13px] text-neutral-500">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
