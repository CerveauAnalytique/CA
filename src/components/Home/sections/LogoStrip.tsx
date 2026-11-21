import React from 'react'
import { DotIcon, type DotIconName } from '@/components/Logo/DotIcon'

const ITEMS: { name: string; icon: DotIconName }[] = [
  { name: 'Data storage', icon: 'database' },
  { name: 'AI models', icon: 'models' },
  { name: 'Datasets', icon: 'datasets' },
  { name: 'Data API', icon: 'api' },
  { name: 'Cameras & sensors', icon: 'camera' },
]

export function LogoStrip() {
  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-5">
        {ITEMS.map(({ name, icon }) => (
          <div key={name} className="flex h-[92px] items-center justify-center gap-3 text-neutral-600">
            <DotIcon name={icon} size={44} />
            <span className="text-[17px] font-semibold tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
