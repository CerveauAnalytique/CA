'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/providers/Auth'
import { ArrowUpRight, SearchIcon, XIcon } from 'lucide-react'
import Link, { useT } from '@/i18n/client'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { tr } from '@/i18n/translate'
import { formatUserDisplayName } from '@/utilities/formatUserDisplayName'

interface Props {
  menu: Header['navItems']
  onSearch?: () => void
}

/** Two bold rounded bars: long on top, shorter below, both aligned to the right. */
function MenuLinesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M3 8h16M8 15h11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

const LINKS = [
  { href: '/shop', label: tr('Shop') },
  { href: '/models', label: tr('AI Models') },
  { href: '/datasets', label: tr('Datasets') },
  { href: '/pricing', label: tr('Pricing') },
  { href: '/research', label: tr('Research') },
  { href: '/api', label: tr('API') },
  { href: '/docs', label: tr('Docs') },
]

export function MobileMenu({ menu, onSearch }: Props) {
  const t = useT()
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
        aria-label={isOpen ? t('Close menu') : t('Open menu')}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
      >
        {isOpen ? <XIcon className="h-5 w-5" /> : <MenuLinesIcon />}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full gap-0 border-0 bg-white px-6 pb-8 pt-4 sm:max-w-none dark:bg-neutral-950 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">{t('Menu')}</SheetTitle>
        <SheetDescription className="sr-only">{t('Site navigation')}</SheetDescription>

        <nav className="flex-1 overflow-y-auto">
          {onSearch && (
            <button
              type="button"
              onClick={() => {
                close()
                onSearch()
              }}
              className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-3 text-start text-[15px] text-neutral-500 dark:bg-neutral-900"
            >
              <SearchIcon size={18} /> {t('Search docs, research, products…')}
            </button>
          )}
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
                      {t(l.label)}
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
            {t('Start chat')}
          </Link>

          {user ? (
            <div className="rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
              <p className="truncate text-sm font-semibold">{username}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                <Link href="/dashboard" onClick={close} className="rounded-full bg-white px-3 py-1.5 dark:bg-neutral-800">
                  {t('Dashboard')}
                </Link>
                <Link href="/account" onClick={close} className="rounded-full bg-white px-3 py-1.5 dark:bg-neutral-800">
                  {t('Account')}
                </Link>
                <Link href="/orders" onClick={close} className="rounded-full bg-white px-3 py-1.5 dark:bg-neutral-800">
                  {t('Orders')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    close()
                    logout()
                  }}
                  className="rounded-full bg-white px-3 py-1.5 text-red-600 dark:bg-neutral-800"
                >
                  {t('Log out')}
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-100 text-[15px] font-medium dark:bg-neutral-900"
            >
              {t('Log in')}
            </Link>
          )}

          <div className="flex items-center justify-between pt-1 text-[13px] text-neutral-500">
            <span>{t('Appearance')}</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
