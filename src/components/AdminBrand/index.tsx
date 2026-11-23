import React from 'react'
import Link from 'next/link'
import { PhylenaLogo, PhylenaMark } from '@/components/Logo/PhylenaMark'

/** Mark + name, shown on the admin login page. */
export const AdminLogo: React.FC = () => <PhylenaLogo className="ca-brand--login" />

/** Mark only, shown at the top of the admin sidebar. */
export const AdminIcon: React.FC = () => <PhylenaMark className="ca-brand__icon ca-brand__icon--nav" title="Phylena" />

/** Navbar above the admin panel, same look as the website navbar. */
export const AdminHeader: React.FC = () => (
  <header className="ca-admin-header">
    <div className="ca-admin-header__inner">
      <Link href="/" className="ca-brand-link" aria-label="Phylena">
        <PhylenaLogo />
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
    <p>Phylena Inc. © {new Date().getFullYear()}</p>
  </footer>
)

const kit = '/brand/phylena'
const files: { title: string; src: string; dark?: boolean }[] = [
  { title: 'Logo blue', src: `${kit}/logo/phylena-logo-blue.svg` },
  { title: 'Logo black', src: `${kit}/logo/phylena-logo-black.svg` },
  { title: 'Logo white', src: `${kit}/logo/phylena-logo-white.svg`, dark: true },
  { title: 'Lockup blue/black', src: `${kit}/lockup/phylena-lockup-blue-black.png` },
  { title: 'Lockup black', src: `${kit}/lockup/phylena-lockup-black.png` },
  { title: 'Lockup white', src: `${kit}/lockup/phylena-lockup-white.png`, dark: true },
  { title: 'App icon', src: `${kit}/icons/android-chrome-512x512.png` },
  { title: 'Share image', src: `${kit}/og-image.png` },
]

/** Brand kit on the admin dashboard: every logo, the lockups and the icons, each with a download link. */
export const BrandKit: React.FC = () => (
  <section className="ca-brandkit">
    <h3>Brand kit</h3>
    <p>The Phylena logos and icons. The files live in <code>public/brand/phylena</code>; the old Briansen kit is in <code>design/brand-archive</code>.</p>
    <div className="ca-brandkit__grid">
      {files.map((f) => (
        <a key={f.src} href={f.src} download className={`ca-brandkit__item${f.dark ? ' ca-brandkit__item--dark' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.src} alt={f.title} loading="lazy" />
          <span>{f.title}</span>
        </a>
      ))}
    </div>
  </section>
)
