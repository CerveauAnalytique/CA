import React from 'react'
import { Database, BarChart3, Share2, Store, Camera } from 'lucide-react'

const ITEMS = [
  { name: 'Data storage', Icon: Database },
  { name: 'AI Analytique', Icon: BarChart3 },
  { name: 'Data Share API', Icon: Share2 },
  { name: 'Apps marketplace', Icon: Store },
  { name: 'Cameras & sensors', Icon: Camera },
]

export function LogoStrip() {
  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-5">
        {ITEMS.map(({ name, Icon }) => (
          <div
            key={name}
            className="flex h-[84px] items-center justify-center gap-2.5 text-neutral-500"
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[18px] font-semibold tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
