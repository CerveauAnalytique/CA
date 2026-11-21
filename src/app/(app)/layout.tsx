import type { ReactNode } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { ensureStartsWith } from '@/utilities/ensureStartsWith'
import { Providers } from '@/providers'
import { getLocale } from '@/i18n/server'
import { LANGUAGES } from '@/i18n/config'
import { I18nProvider } from '@/i18n/client'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Instrument_Serif } from 'next/font/google'
import React from 'react'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  return (
    <html
      className={[GeistSans.variable, GeistMono.variable, instrumentSerif.variable].filter(Boolean).join(' ')}
      lang={locale}
      dir={LANGUAGES[locale].dir}
      suppressHydrationWarning
      data-theme="dark"
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <div className="grain" />
        <I18nProvider locale={locale}>
        <Providers>
          <LivePreviewListener />

          <Header />
          <main className="pt-[56px]">{children}</main>
          <Footer />
        </Providers>
        </I18nProvider>
      </body>
    </html>
  )
}
