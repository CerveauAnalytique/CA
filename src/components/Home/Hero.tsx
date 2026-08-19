'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wifi, Battery, Search, Sparkles } from 'lucide-react'
import { Face } from './Face'
import { HomeChatInput } from './HomeChatInput'
import { SearchModal } from '@/components/SearchModal'

export function Hero() {
  const [time, setTime] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formattedTime =
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) +
        ' ' +
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      setTime(formattedTime)
    }

    updateTime()
    const interval = setInterval(updateTime, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative w-full pt-1 md:pt-3 pb-8 md:pb-12 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 transition-colors overflow-hidden">
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <div className="relative z-20 max-w-[1400px] mx-auto px-6">
        {/* Top Header Row with Title + Compact Mac Status & Neuriy Face Widget */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2 pb-6">
          {/* Title Side */}
          <div className="col-span-1 md:col-span-7 space-y-3 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-black text-white dark:bg-white dark:text-black text-[11px] font-bold rounded-full tracking-widest uppercase">
              <Sparkles size={12} className="text-gold" />
              AGI Evolution
            </span>
            <h1 className="text-4xl md:text-[76px] font-black tracking-tighter text-neutral-900 dark:text-white leading-[0.92]">
              Cerveau <span className="text-neutral-400 dark:text-neutral-500">Intelligence</span>
            </h1>
          </div>

          {/* Right Side: Mac Status Bar & Neuriy Face Widget */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-center md:items-end justify-center space-y-2">
            {/* MacOS Status Bar (Close to Face Widget) */}
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300 font-mono text-xs bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <span className="flex items-center">
                <Wifi size={14} />
              </span>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center hover:opacity-60 transition cursor-pointer p-0.5"
                aria-label="Search"
              >
                <Search size={14} />
              </button>
              <span className="flex items-center rotate-90">
                <Battery size={16} />
              </span>
              <span className="font-semibold text-[11.5px] ml-1">{time || 'Wed, Aug 19 8:43 PM'}</span>
            </div>

            {/* Neuriy Face Widget - Compact & Close to Status Bar */}
            <div className="w-52 h-28 md:w-64 md:h-36 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-[32px] flex flex-col items-center justify-center shadow-lg hover:scale-102 transition-transform cursor-pointer group">
              <div className="group-hover:scale-105 transition-transform">
                <Face />
              </div>
              <span className="mt-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">
                Neuriy AI Core
              </span>
            </div>
          </div>
        </div>

        {/* nchat Interactive Chat Bar Section */}
        <div className="pt-2">
          <HomeChatInput />
        </div>
      </div>
    </section>
  )
}
