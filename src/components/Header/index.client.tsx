'use client'

import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import React, { Suspense, useEffect, useRef, useState } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/utilities/cn'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Dynamically formatted title from Payload CMS
  const rawTitle = header.siteTitle || 'Cerveau Analytique'
  const titleParts = rawTitle.split(' ')
  const firstTitlePart = titleParts[0]
  const secondTitlePart = titleParts.slice(1).join(' ')

  const searchPlaceholder = header.searchPlaceholder || 'Search docs, research, products…'
  const loginLabel = header.loginLabel || 'Log in'
  const loginURL = header.loginURL || '/login'
  const startLabel = header.startLabel || 'Get started'
  const startURL = header.startURL || '/create-account'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <nav>
      {/* Mobile navigation menu */}
      <div className="block md:hidden mr-4">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} />
        </Suspense>
      </div>

      {/* Brand Title connected to Payload CMS siteTitle field */}
      <Link href="/" className="nav-logo">
        {firstTitlePart} {secondTitlePart ? <span>{secondTitlePart}</span> : null}
      </Link>

      {/* Dynamic Nav Links connected to Payload CMS header.navItems */}
      <div className="nav-links">
        {menu.length > 0 ? (
          menu.map((item) => (
            <CMSLink
              key={item.id}
              {...item.link}
              size="clear"
              className={cn('nav-link', {
                'text-white bg-white/10':
                  item.link.url && item.link.url !== '/'
                    ? pathname.includes(item.link.url)
                    : false,
              })}
              appearance="nav"
            />
          ))
        ) : (
          <>
            <Link
              href="/shop"
              className={cn('nav-link', {
                'text-white bg-white/10': pathname.includes('/shop'),
              })}
            >
              Shop
            </Link>
            <Link
              href="/research"
              className={cn('nav-link', {
                'text-white bg-white/10': pathname.includes('/research'),
              })}
            >
              Research
            </Link>
            <Link
              href="/api"
              className={cn('nav-link', {
                'text-white bg-white/10': pathname === '/api',
              })}
            >
              API
            </Link>
            <Link
              href="/docs"
              className={cn('nav-link', {
                'text-white bg-white/10': pathname.includes('/docs'),
              })}
            >
              Docs
            </Link>
          </>
        )}
      </div>

      {/* Searchbar connected to Payload CMS searchPlaceholder & ⌘K shortcut */}
      <form onSubmit={handleSearchSubmit} className="nav-search">
        <span className="nav-search-icon">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8.5 8.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
        />
        <span className="nav-search-kbd">⌘K</span>
      </form>

      {/* Right action items: login link, start link, Cart, and theme toggle */}
      <div className="nav-right">
        <Link href={loginURL} className="btn-login hidden sm:inline-flex">
          {loginLabel}
        </Link>
        <Link href={startURL} className="btn-start hidden sm:inline-flex">
          {startLabel}
        </Link>
        <Suspense fallback={<OpenCartButton />}>
          <Cart />
        </Suspense>
        <ThemeToggle />
      </div>
    </nav>
  )
}
