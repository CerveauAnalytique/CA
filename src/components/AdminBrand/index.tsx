import React from 'react'
import Link from 'next/link'
import { BrainIcon } from '@/components/Logo/BrainIcon'

/** Text + icon logo, shown on the admin login page. */
export const AdminLogo: React.FC = () => (
  <span className="ca-brand ca-brand--login">
    <BrainIcon className="ca-brand__icon" />
    <b>Cerveau</b>
    <span>Analytique</span>
  </span>
)

/** Icon only, shown at the top of the admin sidebar. */
export const AdminIcon: React.FC = () => <BrainIcon className="ca-brand__icon ca-brand__icon--nav" />

/** Navbar above the admin panel, same look as the website navbar. */
export const AdminHeader: React.FC = () => (
  <header className="ca-admin-header">
    <div className="ca-admin-header__inner">
      <Link href="/" className="ca-brand">
        <BrainIcon className="ca-brand__icon" />
        <b>Cerveau</b>
        <span>Analytique</span>
      </Link>
      <nav className="ca-admin-header__links">
        <Link href="/shop">Shop</Link>
        <Link href="/research">Research</Link>
        <Link href="/api">API</Link>
        <Link href="/docs">Docs</Link>
      </nav>
      <Link href="/" className="ca-admin-header__cta">
        View website
      </Link>
    </div>
  </header>
)

/** Compact footer in the admin sidebar, same look as the website footer. */
export const AdminFooter: React.FC = () => (
  <footer className="ca-admin-footer">
    <div className="ca-admin-footer__links">
      <Link href="/privacy">Privacy</Link>
      <Link href="/terms">Terms</Link>
      <Link href="/security">Security</Link>
      <Link href="/docs">Docs</Link>
    </div>
    <p>Cerveau Analytique © 2026</p>
  </footer>
)
