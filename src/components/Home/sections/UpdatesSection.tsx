'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SectionHead } from './SectionHead'
import { LockIllustration } from './icons'

const ITEMS = [
  {
    n: '1.0',
    title: 'Smart Threat Monitoring',
    text: 'Detect unusual behavior and security risks in real time with continuous AI-powered analysis across every camera and device.',
  },
  {
    n: '2.0',
    title: 'Realtime Anomaly Notification',
    text: 'Get instant alerts the moment motion, presence or vehicle activity looks out of the ordinary, on web, iOS and Android.',
  },
  {
    n: '3.0',
    title: 'Automated Response Workflows',
    text: 'Trigger lights, locks and alarms automatically, and hand incidents to your security team with full footage attached.',
  },
  {
    n: '4.0',
    title: 'Secure Cloud Backup',
    text: 'Every recording is encrypted and stored in the cloud, so footage stays safe and searchable for as long as you need it.',
  },
]

export function UpdatesSection() {
  const [open, setOpen] = useState(1)

  return (
    <section className="relative overflow-hidden border-t border-neutral-200 bg-neutral-50 py-24">
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
        label="New Features"
        title="Smarter security updates"
        text="Stay informed with AI-powered monitoring, instant alerts, and automated actions designed to keep your infrastructure protected 24/7."
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
              <LockIllustration />
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
