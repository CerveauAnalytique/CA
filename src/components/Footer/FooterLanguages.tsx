'use client'

import React from 'react'
import { useAuth } from '@/providers/Auth'
import { LANGUAGES, LOCALES, type Locale } from '@/i18n/config'
import { saveLanguage, useLocale, usePathInLocale } from '@/i18n/client'

/** Language links in the footer. */
export function FooterLanguages() {
  const locale = useLocale()
  const pathIn = usePathInLocale()
  const { user } = useAuth()

  const choose = async (e: React.MouseEvent, next: Locale) => {
    e.preventDefault()
    if (next === locale) return
    await saveLanguage(next, user?.id)
    window.location.assign(pathIn(next) + window.location.search)
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 pb-4 border-b border-neutral-300 dark:border-neutral-800">
      {LOCALES.map((l) =>
        l === locale ? (
          <span key={l} lang={l} className="text-[13px] text-neutral-500 dark:text-neutral-400">
            {LANGUAGES[l].name}
          </span>
        ) : (
          <a
            key={l}
            lang={l}
            href={pathIn(l)}
            onClick={(e) => void choose(e, l)}
            className="text-[13px] text-blue-600 dark:text-blue-400 hover:underline"
          >
            {LANGUAGES[l].name}
          </a>
        ),
      )}
    </div>
  )
}
