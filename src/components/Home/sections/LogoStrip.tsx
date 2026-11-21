import React from 'react'
import { Sparkle, Map as MapIcon, Layers, Sun, Cog } from 'lucide-react'

const LOGOS = [
  { name: 'Acme Corp', Icon: Sparkle },
  { name: 'Starmap', Icon: MapIcon },
  { name: 'Epicurious', Icon: Layers },
  { name: 'Nietzsche', Icon: Sun },
  { name: 'splatter', Icon: Cog },
]

export function LogoStrip() {
  return (
    <div className="border-y border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-5">
        {LOGOS.map(({ name, Icon }, i) => (
          <div
            key={name}
            className={`flex h-[84px] items-center justify-center gap-2.5 text-neutral-500 ${
              i < LOGOS.length - 1 ? 'md:border-r border-neutral-200' : ''
            } ${i % 2 === 0 ? 'border-r md:border-r-0' : ''}`}
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[19px] font-semibold tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
