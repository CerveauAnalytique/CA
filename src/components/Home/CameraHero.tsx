'use client'

import React, { useEffect, useState } from 'react'
import { HomeChatInput } from './HomeChatInput'
import { DotCameraCanvas } from './DotCameraCanvas'

const WORDS = ['your property', 'every entrance', 'day and night']

function useTyping(words: string[]) {
  const [text, setText] = useState('')
  const [i, setI] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[i % words.length]
    let delay = deleting ? 35 : 80
    if (!deleting && text === word) delay = 1800
    if (deleting && text === '') delay = 300
    const id = setTimeout(() => {
      if (!deleting && text === word) return setDeleting(true)
      if (deleting && text === '') {
        setDeleting(false)
        return setI((n) => n + 1)
      }
      setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1))
    }, delay)
    return () => clearTimeout(id)
  }, [text, deleting, i, words])

  return text
}

export function CameraHero() {
  const typed = useTyping(WORDS)

  return (
    <section
      className="relative w-full overflow-hidden bg-white text-neutral-900"
      style={{ minHeight: 'calc(100vh - 56px)' }}
    >
      {/* soft blue glow behind the camera */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 55% at 72% 50%, rgba(26,61,240,0.08) 0%, transparent 70%)',
        }}
      />

      {/* blurred giant brand text at the bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[3vw] left-0 right-0 select-none text-center font-black uppercase leading-none tracking-tighter text-neutral-900/[0.06] blur-[10px]"
        style={{ fontSize: '17vw' }}
      >
        Cerveau
      </div>

      <div className="relative mx-auto grid min-h-[inherit] max-w-[1280px] grid-cols-1 px-6 md:grid-cols-12">
        {/* Camera */}
        <div className="pointer-events-none order-2 col-span-12 mt-4 flex items-center justify-center md:absolute md:right-[1%] md:top-[9%] md:bottom-0 md:order-none md:mt-0 md:w-[52%]">
          <DotCameraCanvas className="w-full" />
        </div>

        {/* Left copy */}
        <div className="relative z-10 order-1 col-span-12 flex flex-col justify-between py-10 md:col-span-5 md:py-16">
          <div>
            <h1 className="text-[clamp(34px,4.3vw,58px)] font-light leading-[1.08] tracking-tight">
              Complete visibility
              <br />
              across every corner
              <br />
              of <span className="text-neutral-400">{typed}</span>
              <span className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] animate-pulse bg-neutral-700" />
            </h1>

            <div className="mt-10">
              <HomeChatInput />
            </div>
          </div>

          <div className="mt-16 flex items-end gap-10 md:mt-0">
            <ul className="text-[13px] font-light uppercase leading-[1.45] tracking-wide text-neutral-700">
              <li>24/7</li>
              <li>AI Detect</li>
              <li>Night Vision</li>
              <li>Cloud Backup</li>
            </ul>
            <div className="flex gap-3">
              <span className="mt-[-48px] hidden h-24 w-px bg-neutral-300 md:block" />
              <p className="max-w-[210px] text-[12px] font-light leading-snug text-neutral-600">
                Every camera reports motion, presence and vehicle activity 24/7 — footage stored
                securely in the cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Top-right blurb */}
        <p className="relative z-10 order-3 col-span-12 hidden max-w-[230px] justify-self-end pt-10 text-[12px] font-light leading-snug text-neutral-700 md:col-span-3 md:col-start-10 md:block md:pt-16">
          Real-time motion detection, night vision and instant alerts — all monitored from a single
          dashboard built for security teams.
        </p>
      </div>
    </section>
  )
}
