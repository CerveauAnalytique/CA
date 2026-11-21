'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SectionHead } from './SectionHead'
import { DotIcon } from '@/components/Logo/DotIcon'

const ITEMS = [
  {
    n: '1.0',
    title: 'Create a Digital Brain',
    text: 'Train your own AI brain on your data and tell it what to watch for, in plain language.',
  },
  {
    n: '2.0',
    title: 'Connect Cameras & Sensors',
    text: 'Turn any camera into a smart camera, and add sensors for motion, temperature, sound, air quality, GPS, energy and more. Get instant alerts on your phone.',
  },
  {
    n: '3.0',
    title: 'Apps Marketplace',
    text: 'Install ready-made apps or publish your own and share them with everyone.',
  },
  {
    n: '4.0',
    title: 'Share with the Data API',
    text: 'Open your data to other tools and teams through the API, with full control over who can see what.',
  },
]

export function UpdatesSection() {
  const [open, setOpen] = useState(1)

  return (
    <section className="relative overflow-hidden bg-neutral-50 py-24">
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
        label="Build your brain"
        title="Make your own smart camera"
        text="No code and no experts needed. Connect a camera or sensor, teach your digital brain what to look for, and add apps from the marketplace."
      />

      <div className="relative mx-auto mt-16 max-w-[1040px] px-6">
        <div className="grid grid-cols-1 border border-neutral-200 bg-white md:grid-cols-2">
          <div
            className="flex min-h-[320px] items-center justify-center p-8"
            style={{
              backgroundImage: 'radial-gradient(#e4e4e7 1px, transparent 1.2px)',
              backgroundSize: '8px 8px',
            }}
          >
            <div className="h-[260px] w-full max-w-[380px]">
              <DotIcon name="camera" size={260} />
            </div>
          </div>

          <div className="border-t border-neutral-200 md:border-l md:border-t-0">
            {ITEMS.map((item, i) => {
              const isOpen = open === i
              return (
                <div key={item.n} className={i > 0 ? 'border-t border-neutral-200' : ''}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-[12px] ${
                        isOpen ? 'bg-[#f9d84a]' : 'border border-neutral-200 bg-neutral-50'
                      }`}
                    >
                      {item.n}
                    </span>
                    <span className="flex-1 font-mono text-[17px] font-medium text-neutral-900">
                      {item.title}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="px-6 pb-6 pl-[4.4rem] text-[13px] leading-relaxed text-neutral-500">
                      {item.text}
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
