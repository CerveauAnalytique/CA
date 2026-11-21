import React from 'react'
import { getT } from '@/i18n/server'
import { tr } from '@/i18n/translate'
import { DotIcon, type DotIconName } from '@/components/Logo/DotIcon'

const ITEMS: { name: string; icon: DotIconName }[] = [
  { name: tr('Data storage'), icon: 'database' },
  { name: tr('AI models'), icon: 'models' },
  { name: tr('Datasets'), icon: 'datasets' },
  { name: tr('Data API'), icon: 'api' },
  { name: tr('IoT devices'), icon: 'camera' },
]

export async function LogoStrip() {
  const t = await getT()
  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-5">
        {ITEMS.map(({ name, icon }) => (
          <div key={name} className="flex h-[104px] items-center justify-center gap-3 text-neutral-600">
            <DotIcon name={icon} size={60} />
            <span className="text-[17px] font-semibold tracking-tight">{t(name)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
