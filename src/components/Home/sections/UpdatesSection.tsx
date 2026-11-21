'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useT } from '@/i18n/client'
import { tr } from '@/i18n/translate'
import { SectionHead } from './SectionHead'
import { DotIcon } from '@/components/Logo/DotIcon'

const ITEMS = [
  {
    n: '1.0',
    title: tr('CA7 Chat'),
    text: tr('Ask questions to your own data and get answers based on the data that is available.'),
  },
  {
    n: '2.0',
    title: tr('Data Storage'),
    text: tr('Store datasets, logs, sensor information and other data securely, searchable in seconds.'),
  },
  {
    n: '3.0',
    title: tr('Automation'),
    text: tr('Let AI take action based on events and data.'),
  },
  {
    n: '4.0',
    title: tr('Data API'),
    text: tr('Let other apps and systems talk to CA7 through one API, with full control over who can see what.'),
  },
  {
    n: '5.0',
    title: tr('Camera Intelligence'),
    text: tr('Add smart cameras as an extra module: detect objects and get alerts, as one more data source.'),
  },
]

export function UpdatesSection() {
  const t = useT()
  const [open, setOpen] = useState(0)

  return (
    <section className="relative overflow-hidden bg-neutral-50 py-24 dark:bg-neutral-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #d4d4d8 0 1px, transparent 1px 4px)',
          maskImage: 'radial-gradient(ellipse 50% 60% at 50% 20%, #000, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 50% 60% at 50% 20%, #000, transparent)',
        }}
      />
      <SectionHead
        index="02/04"
        label={t('Build your brain')}
        title={t('Ask questions to your own data')}
        text={t('No code and no experts needed. Connect your data, ask CA7 in plain language, and let AI act on what it finds.')}
      />

      <div className="relative mx-auto mt-16 max-w-[1040px] px-6">
        <div className="grid grid-cols-1 border border-neutral-200 bg-white md:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-950">
          <div
            className="flex min-h-[320px] items-center justify-center p-8"
            style={{
              backgroundImage: 'radial-gradient(#e4e4e7 1px, transparent 1.2px)',
              backgroundSize: '8px 8px',
            }}
          >
            <div className="h-[260px] w-full max-w-[380px]">
              <DotIcon name="chat" size={220} />
            </div>
          </div>

          <div className="border-t border-neutral-200 md:border-s md:border-t-0 dark:border-neutral-800">
            {ITEMS.map((item, i) => {
              const isOpen = open === i
              return (
                <div key={item.n} className={i > 0 ? 'border-t border-neutral-200' : ''}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-4 px-6 py-5 text-start"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[12px] ${
                        isOpen ? 'bg-[#f9d84a]' : 'border border-neutral-200 bg-neutral-50 dark:bg-neutral-900'
                      } dark:border-neutral-800`}
                    >
                      {item.n}
                    </span>
                    <span className="flex-1 font-mono text-[17px] font-medium text-neutral-900 dark:text-white">
                      {t(item.title)}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="px-6 pb-6 ps-[4.4rem] text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {t(item.text)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
