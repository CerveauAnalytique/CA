import React from 'react'
import Link from '@/i18n/client'
import { getT } from '@/i18n/server'
import { tr } from '@/i18n/translate'
import { FooterLanguages } from './FooterLanguages'

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: tr('Products'),
    links: [
      { label: tr('Products Shop'), href: '/shop' },
      { label: tr('Neural Engine'), href: '/research' },
      { label: tr('API Access'), href: '/api' },
      { label: tr('Analytics Workspace'), href: '/dashboard' },
      { label: tr('Pricing'), href: '/pricing' },
    ],
  },
  {
    title: tr('Platform'),
    links: [
      { label: tr('Carbon API'), href: '/docs/carbon' },
      { label: tr('Search API'), href: '/docs/search' },
      { label: tr('Predictive API'), href: '/docs/predict' },
      { label: tr('SDKs & Libraries'), href: '/sdks' },
    ],
  },
  {
    title: tr('Resources'),
    links: [
      { label: tr('Documentation'), href: '/docs' },
      { label: tr('Quickstart'), href: '/docs/quickstart' },
      { label: tr('Community'), href: '/community' },
      { label: tr('System Status'), href: '/status' },
      { label: tr('Help center'), href: '/support' },
    ],
  },
  {
    title: tr('Company'),
    links: [
      { label: tr('About Us'), href: '/about' },
      { label: tr('Careers'), href: '/careers' },
      { label: tr('Privacy Policy'), href: '/privacy' },
      { label: tr('Terms of Service'), href: '/terms' },
    ],
  },
]

const LEGAL = [
  { label: tr('Privacy Policy'), href: '/privacy' },
  { label: tr('Terms of Service'), href: '/terms' },
  { label: tr('Security'), href: '/security' },
  { label: tr('Cookie Policy'), href: '/cookies' },
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

export async function Footer() {
  const t = await getT()
  return (
    <footer className="relative z-20 w-full bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 font-sans">
      <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-6">
        {/* Row 1: languages */}
        <FooterLanguages />

        {/* Row 2: compact link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 py-4 border-b border-neutral-300 dark:border-neutral-800">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-2 text-[12px] font-semibold text-neutral-600 dark:text-neutral-300">
                {t(col.title)}
              </h4>
              <ul className="flex flex-col gap-1.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className={linkClass}>
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Row 3: payment methods */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 border-b border-neutral-300 dark:border-neutral-800">
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">{t('Secure payments with Mollie and Stripe')}</span>
          <ul className="flex flex-wrap items-center gap-2" aria-label={t('Accepted payment methods')}>
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
                {t(l.label)}
              </Link>
            ))}
          </div>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
            {t('Cerveau Analytique © 2026')}
          </p>
        </div>
      </div>
    </footer>
  )
}
