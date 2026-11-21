import type { Metadata } from 'next'
import Link from '@/i18n/client'
import React from 'react'
import { Check } from 'lucide-react'
import { getT } from '@/i18n/server'
import { DotIcon } from '@/components/Logo/DotIcon'
import { PLANS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Free, Hobby and Company packs for CA7.',
}

export default async function PricingPage() {
  const t = await getT()

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-12 md:py-16">
      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">{t('Pricing')}</p>
        <h1 className="mt-3 text-[clamp(30px,4vw,48px)] font-light leading-tight tracking-tight">
          {t('Choose your pack')}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-neutral-500">
          {t('Start free, build as a hobby, or run CA7 across your company.')}
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {PLANS.map((p) => (
          <section
            key={p.id}
            className={`relative flex flex-col rounded-3xl p-6 ${
              p.highlight
                ? 'bg-blue-50 text-neutral-900 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-white dark:ring-blue-500/40'
                : 'bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-white'
            }`}
          >
            {p.highlight && (
              <span className="absolute end-6 top-6 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-medium text-white">
                {t('Most popular')}
              </span>
            )}
            <span className={`inline-flex self-start rounded-2xl p-2 `}>
              <DotIcon name={p.icon} size={72} />
            </span>
            <h2 className="mt-4 text-[22px] font-semibold tracking-tight">{t(p.name)}</h2>
            <p className={`mt-1 text-[13px] ${'text-neutral-500 dark:text-neutral-400'}`}>
              {t(p.tagline)}
            </p>

            <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
              {p.from && <span className="text-[13px] text-neutral-500 dark:text-neutral-400">{t('from')}</span>}
              <span className="text-[40px] font-light leading-none tracking-tight">€{p.price.toLocaleString('en-US')}</span>
              {p.price > 0 && (
                <span className={`text-[13px] ${'text-neutral-500 dark:text-neutral-400'}`}>
                  {t('per month')}
                </span>
              )}
            </p>
            <p className={`mt-1 h-5 text-[12px] ${'text-neutral-400'}`}>
              {p.vat === 'excl' ? t('excl. VAT') : p.vat === 'incl' ? t('incl. VAT') : ''}
            </p>

            <Link
              href={p.href}
              className={`mt-5 flex h-12 items-center justify-center rounded-full text-[14px] font-medium ${
                p.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              }`}
            >
              {t(p.cta)}
            </Link>

            <ul className="mt-7 space-y-3 text-[14px]">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#1a3df0]" />
                  <span className={'text-neutral-700 dark:text-neutral-300'}>{t(f)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
        {t('Hobby prices include VAT. Other prices are excluded VAT.')}{' '}
        <Link href="/contact" className="underline">
          {t('Need something different? Contact us.')}
        </Link>
      </p>
    </div>
  )
}
