'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/providers/Auth'
import { LANGUAGES, LOCALES, type Locale } from '@/i18n/config'
import { saveLanguage, useLocale, usePathInLocale, useT } from '@/i18n/client'

/** Flag button in the header: shows the current language and switches the whole site. */
export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useT()
  const pathIn = usePathInLocale()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = async (next: Locale) => {
    setOpen(false)
    if (next === locale) return
    await saveLanguage(next, user?.id)
    // full load: the page direction (left-to-right / right-to-left) changes with the language
    window.location.assign(pathIn(next) + window.location.search + window.location.hash)
  }

  return (
    <div ref={ref} className="lang-sw">
      <button
        type="button"
        className="lang-sw__btn"
        aria-label={t('Language')}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden>{LANGUAGES[locale].flag}</span>
      </button>
      {open && (
        <ul className="lang-sw__panel" role="menu">
          {LOCALES.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={l === locale}
                lang={l}
                className={`lang-sw__item ${l === locale ? 'is-active' : ''}`}
                onClick={() => void choose(l)}
              >
                <span aria-hidden>{LANGUAGES[l].flag}</span>
                <span>{LANGUAGES[l].name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
