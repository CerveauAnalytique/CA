'use client'

import React, { useEffect, useState, useRef } from 'react'

export function Face() {
  const [blink, setBlink] = useState(false)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 4000)

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const dx = e.clientX - centerX
      const dy = e.clientY - centerY

      const distance = Math.hypot(dx, dy) || 1
      const maxDistance = 350
      const clampedDist = Math.min(distance, maxDistance)
      const ratio = (clampedDist / maxDistance) * 5

      setEyeOffset({
        x: (dx / distance) * ratio,
        y: (dy / distance) * ratio,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      clearInterval(blinkInterval)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col items-center space-y-2.5 select-none">
      <div className="flex space-x-4">
        {/* Left Eye */}
        <div className="relative w-6 h-12 md:w-7 md:h-14 bg-neutral-900 dark:bg-white rounded-full overflow-hidden shadow-[inset_0_4px_10px_rgba(255,255,255,0.2)]">
          <div
            className={`absolute inset-0 bg-neutral-900 dark:bg-white transition-transform duration-150 ${
              blink ? 'scale-y-100' : 'scale-y-0'
            }`}
            style={{ transformOrigin: 'top' }}
          />
          {!blink && (
            <div
              className="absolute w-3 h-5 md:w-3.5 md:h-6 bg-white dark:bg-neutral-950 rounded-full transition-transform duration-75 ease-out"
              style={{
                top: `calc(50% - 9px + ${eyeOffset.y}px)`,
                left: `calc(50% - 6px + ${eyeOffset.x}px)`,
              }}
            >
              <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-70" />
            </div>
          )}
        </div>

        {/* Right Eye */}
        <div className="relative w-6 h-12 md:w-7 md:h-14 bg-neutral-900 dark:bg-white rounded-full overflow-hidden shadow-[inset_0_4px_10px_rgba(255,255,255,0.2)]">
          <div
            className={`absolute inset-0 bg-neutral-900 dark:bg-white transition-transform duration-150 ${
              blink ? 'scale-y-100' : 'scale-y-0'
            }`}
            style={{ transformOrigin: 'top' }}
          />
          {!blink && (
            <div
              className="absolute w-3 h-5 md:w-3.5 md:h-6 bg-white dark:bg-neutral-950 rounded-full transition-transform duration-75 ease-out"
              style={{
                top: `calc(50% - 9px + ${eyeOffset.y}px)`,
                left: `calc(50% - 6px + ${eyeOffset.x}px)`,
              }}
            >
              <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-70" />
            </div>
          )}
        </div>
      </div>

      {/* Nose/Mouth */}
      <div className="w-2 h-3.5 bg-neutral-900 dark:bg-white rounded-full shadow-sm animate-pulse" />
    </div>
  )
}
