'use client'

import React, { useEffect, useState } from 'react'

export function Face() {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 4000)

    return () => clearInterval(blinkInterval)
  }, [])

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex space-x-5">
        {/* Left Eye */}
        <div className="relative w-6 h-12 md:w-8 md:h-16 bg-neutral-900 dark:bg-white rounded-full overflow-hidden shadow-[inset_0_4px_10px_rgba(255,255,255,0.2)]">
          <div
            className={`absolute inset-0 bg-neutral-900 dark:bg-white transition-transform duration-150 ${
              blink ? 'scale-y-100' : 'scale-y-0'
            }`}
            style={{ transformOrigin: 'top' }}
          />
          {!blink && <div className="absolute top-3 left-2 w-2 h-2 bg-white/20 rounded-full blur-[1px]" />}
        </div>

        {/* Right Eye */}
        <div className="relative w-6 h-12 md:w-8 md:h-16 bg-neutral-900 dark:bg-white rounded-full overflow-hidden shadow-[inset_0_4px_10px_rgba(255,255,255,0.2)]">
          <div
            className={`absolute inset-0 bg-neutral-900 dark:bg-white transition-transform duration-150 ${
              blink ? 'scale-y-100' : 'scale-y-0'
            }`}
            style={{ transformOrigin: 'top' }}
          />
          {!blink && <div className="absolute top-3 left-2 w-2 h-2 bg-white/20 rounded-full blur-[1px]" />}
        </div>
      </div>

      {/* Mouth */}
      <div className="w-2.5 h-4 bg-neutral-900 dark:bg-white rounded-full shadow-sm animate-pulse" />
    </div>
  )
}
