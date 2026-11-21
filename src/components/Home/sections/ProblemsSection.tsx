import React from 'react'
import Link from '@/i18n/client'
import { getT } from '@/i18n/server'
import { tr } from '@/i18n/translate'
import { SectionHead } from './SectionHead'
import { DotIcon, type DotIconName } from '@/components/Logo/DotIcon'

const PROBLEMS: { icon: DotIconName; title: string; problem: string; solution: string }[] = [
  {
    icon: 'ops',
    title: tr('Operations'),
    problem: tr('Machines, rooms and sites generate data nobody has time to read.'),
    solution: tr('Sensors and devices feed an AI model that spots faults and sends an alert before work stops.'),
  },
  {
    icon: 'helpdesk',
    title: tr('Internal support'),
    problem: tr('Colleagues keep asking the same questions about systems and data.'),
    solution: tr('CA7 answers them from your own datasets, so your support team handles only what needs a person.'),
  },
  {
    icon: 'security',
    title: tr('Safety and security'),
    problem: tr('Sites and devices run day and night, but nobody watches every hour.'),
    solution: tr('Your AI model watches sensors and cameras and reports events to the right team.'),
  },
  {
    icon: 'analytics',
    title: tr('Data teams'),
    problem: tr('Data sits in many tools and is hard to reuse.'),
    solution: tr('Datasets, models and one API give every team the same, clean source to build on.'),
  },
]

export async function ProblemsSection() {
  const t = await getT()
  return (
    <section className="relative bg-white py-24 dark:bg-neutral-950">
      <SectionHead
        index="03/04"
        label={t('Solve problems')}
        title={t('Help every team in your company')}
        text={t('Start with a real problem. Pick an AI model, connect a dataset and use the API, so your teams get answers and your support team gets time back.')}
      />

      <div className="relative mx-auto mt-16 max-w-[1040px] px-6">
        <div className="rounded-3xl bg-neutral-900 p-7 text-white dark:bg-neutral-800 dark:ring-1 dark:ring-white/20 md:p-9">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">{t('Example')}</p>
          <p className="mt-3 text-[18px] font-light leading-snug md:text-[22px]">
            {t('A logistics company connects 30 cameras, 12 sensors and its warehouse system to CA7.')}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-300">
            {t('The owner asks: “How many pallets were processed today, how many trucks are still waiting, and are there temperature deviations?”')}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-300">
            {t('CA7 gets the data from the connected systems, analyzes it and answers based on the data that is available.')}
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-4 grid max-w-[1040px] gap-4 px-6 md:grid-cols-2">
        {PROBLEMS.map((p) => (
          <div key={t(p.title)} className="flex gap-5 rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-900">
            <DotIcon name={p.icon} size={96} className="shrink-0" />
            <div>
              <h3 className="font-mono text-[17px] font-medium text-neutral-900 dark:text-white">{t(p.title)}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{t(p.problem)}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">{t(p.solution)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3 px-6">
        <Link href="/models" className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-[14px] font-medium text-white dark:bg-white dark:text-neutral-900">
          {t('Browse AI models')}
        </Link>
        <Link href="/datasets" className="inline-flex h-11 items-center rounded-full bg-neutral-100 px-6 text-[14px] font-medium dark:bg-neutral-800">
          {t('Explore datasets')}
        </Link>
        <Link href="/api" className="inline-flex h-11 items-center rounded-full bg-neutral-100 px-6 text-[14px] font-medium dark:bg-neutral-800">
          {t('Use the API')}
        </Link>
      </div>
    </section>
  )
}
