import React from 'react'
import Link from 'next/link'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Products',
    links: [
      { label: 'Products Shop', href: '/shop' },
      { label: 'Neural Engine', href: '/research' },
      { label: 'API Access', href: '/api' },
      { label: 'Analytics Workspace', href: '/dashboard' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Carbon API', href: '/docs/carbon' },
      { label: 'Search API', href: '/docs/search' },
      { label: 'Predictive API', href: '/docs/predict' },
      { label: 'SDKs & Libraries', href: '/sdks' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Quickstart', href: '/docs/quickstart' },
      { label: 'Community', href: '/community' },
      { label: 'System Status', href: '/status' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

const LEGAL = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Security', href: '/security' },
  { label: 'Cookie Policy', href: '/cookies' },
]

const PAYMENTS = [
  { file: 'ideal', name: 'iDEAL' },
  { file: 'bancontact', name: 'Bancontact' },
  { file: 'visa', name: 'Visa' },
  { file: 'mastercard', name: 'Mastercard' },
  { file: 'amex', name: 'American Express' },
  { file: 'applepay', name: 'Apple Pay' },
  { file: 'paypal', name: 'PayPal' },
  { file: 'sepa', name: 'SEPA' },
]

const linkClass =
  'text-[13px] text-neutral-500 dark:text-neutral-400 hover:underline hover:text-neutral-800 dark:hover:text-white'

export function Footer() {
  return (
    <footer className="relative z-20 w-full bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 font-sans">
      <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-6">
        {/* Row 1: language / region style links */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 pb-4 border-b border-neutral-300 dark:border-neutral-800">
          {['English (US)', 'Nederlands', 'Français', 'Deutsch', 'Español', 'Português'].map(
            (l, i) => (
              <span
                key={l}
                className={
                  i === 0
                    ? 'text-[13px] text-neutral-500 dark:text-neutral-400'
                    : 'text-[13px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                }
              >
                {l}
              </span>
            ),
          )}
        </div>

        {/* Row 2: compact link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 py-4 border-b border-neutral-300 dark:border-neutral-800">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-2 text-[12px] font-semibold text-neutral-600 dark:text-neutral-300">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-1.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Row 3: payment methods */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 border-b border-neutral-300 dark:border-neutral-800">
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">Secure payments with Mollie and Stripe</span>
          <ul className="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
            {PAYMENTS.map((p) => (
              <li key={p.file}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/payments/${p.file}.svg`} alt={p.name} height={28} className="h-7 w-auto" />
              </li>
            ))}
          </ul>
        </div>

        {/* Row 4: legal + copyright */}
        <div className="pt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL.map((l) => (
              <Link key={l.label} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
            Cerveau Analytique © 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
