import React from 'react'
import { getT } from '@/i18n/server'
import { tr } from '@/i18n/translate'
import { SectionHead } from './SectionHead'
import { DotIcon, type DotIconName } from '@/components/Logo/DotIcon'

const CARDS = [
  {
    icon: 'integrate' as DotIconName,
    title: tr('Data Connect'),
    text: tr('Connect databases, REST APIs, CSV files, IoT devices, sensors and cameras in one place.'),
  },
  {
    icon: 'models' as DotIconName,
    title: tr('AI Models'),
    text: tr('Use existing AI models or build your own on your company data.'),
  },
  {
    icon: 'analytics' as DotIconName,
    title: tr('Data Intelligence'),
    text: tr('AI finds patterns, anomalies and trends in your data and answers questions about it.'),
  },
]

const Corner = ({ className }: { className: string }) => (
  <span className={`absolute h-[7px] w-[7px] rotate-45 bg-neutral-300 ${className} dark:bg-neutral-700`} />
)

export async function FeatureCards() {
  const t = await getT()
  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1.2px)',
          backgroundSize: '7px 7px',
          maskImage:
            'radial-gradient(ellipse 28% 30% at 8% 30%, #000, transparent), radial-gradient(ellipse 25% 25% at 92% 8%, #000, transparent)',
          WebkitMaskImage:
            'radial-gradient(ellipse 28% 30% at 8% 30%, #000, transparent), radial-gradient(ellipse 25% 25% at 92% 8%, #000, transparent)',
        }}
      />
      <SectionHead
        index="01/04"
        label={t('Everything you need')}
        title={t('The AI brain for business data')}
        text={t('CA7 connects databases, APIs, IoT devices, sensors and cameras, stores your data and lets AI analyze it, so your teams solve real problems.')}
      />

      <div className="relative mx-auto mt-20 max-w-[1040px] px-6">
        <div className="relative grid grid-cols-1 border border-neutral-200 md:grid-cols-3 dark:border-neutral-800">
          <Corner className="-left-1 -top-1" />
          <Corner className="-right-1 -top-1" />
          <Corner className="-bottom-1 -left-1" />
          <Corner className="-bottom-1 -right-1" />
          {CARDS.map(({ icon, title, text }, i) => (
            <div
              key={title}
              className={`flex flex-col items-center px-8 py-12 text-center ${
                i < CARDS.length - 1 ? 'border-b md:border-b-0 md:border-e border-neutral-200' : ''
              }`}
            >
              <DotIcon name={icon} size={112} />
              <h3 className="mt-8 font-mono text-[18px] font-medium text-neutral-900 dark:text-white">{t(title)}</h3>
              <p className="mt-3 max-w-[250px] text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">{t(text)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
