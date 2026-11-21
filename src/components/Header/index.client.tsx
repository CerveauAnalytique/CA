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

import { useAuth } from '@/providers/Auth'
import { User as UserIcon, LogOut, Bell, Store } from 'lucide-react'
import { formatUserDisplayName } from '@/utilities/formatUserDisplayName'

import { SearchModal } from '@/components/SearchModal'

type Props = {
  header: Header
}

import { Ca7Logo } from '@/components/Logo/Ca7Logo'

export function HeaderClient({ header }: Props) {
  const { user, logout } = useAuth()
  const menu = header.navItems || []
  const pathname = usePathname()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const username = formatUserDisplayName(user)
  const userAvatar = (user as any)?.avatar?.url || (user as any)?.avatar || (user as any)?.image?.url

  const searchPlaceholder = header.searchPlaceholder || 'Search docs, research, products…'
  const loginLabel = header.loginLabel || 'Log in'
  const loginURL = header.loginURL || '/login'
  const startLabel = 'Start chat'
  const startURL = '/chat-ca7'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearchOpen(true)
  }

  return (
    <nav className="site-header">
      {/* CA7 logo (brain icon + wordmark) */}
      <Link href="/" className="nav-logo">
        <Ca7Logo />
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
              href="/models"
              className={cn('nav-link', {
                'text-white bg-white/10': pathname.includes('/models'),
              })}
            >
              AI Models
            </Link>
            <Link
              href="/datasets"
              className={cn('nav-link', {
                'text-white bg-white/10': pathname.includes('/datasets'),
              })}
            >
              Datasets
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
          onClick={() => setIsSearchOpen(true)}
          placeholder={searchPlaceholder}
          readOnly
        />
        <span className="nav-search-kbd">⌘K</span>
      </form>

      {/* Right action items */}
      <div className="nav-right">
        {/* Marketplace Store Icon Button */}
        <Link
          href="/marketplace"
          title="Marketplace & Enterprise Models"
          className="relative hidden h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors md:flex"
        >
          <Store className="h-4 w-4" />
        </Link>

        {/* Notification Bell Icon Button */}
        <Link
          href="/notifications"
          title="Notifications & System Alerts"
          className="relative hidden h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors md:flex"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </Link>

        {/* Desktop-only User Badge (u***@ca.com) & Log out close together */}
        {user ? (
          <div className="hidden md:flex items-center gap-1.5">
            <Link href="/account" className="btn-login inline-flex items-center gap-2">
              {userAvatar ? (
                <img src={userAvatar} alt={username} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold">
                  <UserIcon className="h-3 w-3" />
                </span>
              )}
              <span>{username}</span>
            </Link>
            <button
              onClick={() => logout()}
              className="btn-login inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 border-neutral-800 hover:border-red-500/30 transition-colors"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <Link href={loginURL} className="btn-login hidden md:inline-flex">
            {loginLabel}
          </Link>
        )}

        <Link href={startURL} className="btn-start">
          {startLabel}
        </Link>

        <Suspense fallback={<OpenCartButton />}>
          <Cart />
        </Suspense>

        {/* Right-aligned Mobile Sidebar Drawer Button */}
        <div className="block md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} onSearch={() => setIsSearchOpen(true)} />
          </Suspense>
        </div>

        <div className="hidden md:block">
          <ThemeToggle />
        </div>
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialQuery={searchQuery}
      />
    </nav>
  )
}
