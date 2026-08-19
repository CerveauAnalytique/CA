'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wifi, Battery, Search, Sparkles } from 'lucide-react'
import { Face } from './Face'
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
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative w-full min-h-[600px] md:min-h-[800px] overflow-hidden bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-20 max-w-[1500px] mx-auto min-h-[600px] md:min-h-[800px] flex flex-col md:flex-row items-center">
        {/* Left Side Content */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center md:items-start px-6 md:px-16 lg:px-24 py-16 text-center md:text-left">
          <div className="max-w-xl space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-full tracking-widest uppercase">
                <Sparkles size={13} className="text-gold" />
                AGI Evolution
              </span>
              <h1 className="text-5xl md:text-[88px] font-black tracking-tighter text-neutral-900 dark:text-white leading-[0.92]">
                Cerveau <br />
                <span className="text-neutral-400 dark:text-neutral-500">Intelligence</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed max-w-md">
              The analytical intelligence layer powering modern teams, neural models, and data labs.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/chat-neuriy"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl text-base font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105 shadow-xl cursor-pointer"
              >
                Start Neuriy Chat →
              </Link>
              <Link
                href="/docs"
                className="text-neutral-900 dark:text-white font-bold hover:opacity-70 transition cursor-pointer underline underline-offset-8"
              >
                Explore Docs
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Mac Status & Floating Face Widget */}
        <div className="w-full md:w-1/2 min-h-[400px] md:min-h-[600px] relative flex items-center justify-center p-8">
          {/* MacOS Status Bar (Top Right) */}
          <div className="absolute top-6 right-8 z-30 flex items-center gap-4 text-neutral-600 dark:text-neutral-300 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center">
                <Wifi size={16} />
              </span>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center hover:opacity-60 transition cursor-pointer p-1"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
              <span className="flex items-center rotate-90">
                <Battery size={18} />
              </span>
            </div>
            <span className="font-bold">{time || 'Mon Jun 9 9:41 AM'}</span>
          </div>

          {/* Floating Widget Card */}
          <div className="w-64 h-40 md:w-80 md:h-52 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border border-neutral-200 dark:border-neutral-800 rounded-[40px] flex flex-col items-center justify-center shadow-2xl hover:scale-105 transition-transform cursor-pointer group">
            <div className="group-hover:scale-110 transition-transform">
              <Face />
            </div>
            <span className="mt-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase">
              Neuriy AI Core v3.4
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
