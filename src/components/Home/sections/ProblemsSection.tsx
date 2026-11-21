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
    <section className="relative bg-white py-24">
      <SectionHead
        index="03/04"
        label={t('Solve problems')}
        title={t('Help every team in your company')}
        text={t('Start with a real problem. Pick an AI model, connect a dataset and use the API, so your teams get answers and your support team gets time back.')}
      />

      <div className="relative mx-auto mt-16 grid max-w-[1040px] gap-4 px-6 md:grid-cols-2">
        {PROBLEMS.map((p) => (
          <div key={t(p.title)} className="flex gap-5 rounded-2xl bg-neutral-50 p-6">
            <DotIcon name={p.icon} size={96} className="shrink-0" />
            <div>
              <h3 className="font-mono text-[17px] font-medium text-neutral-900">{t(p.title)}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{t(p.problem)}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{t(p.solution)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3 px-6">
        <Link href="/models" className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-[14px] font-medium text-white">
          {t('Browse AI models')}
        </Link>
        <Link href="/datasets" className="inline-flex h-11 items-center rounded-full bg-neutral-100 px-6 text-[14px] font-medium">
          {t('Explore datasets')}
        </Link>
        <Link href="/api" className="inline-flex h-11 items-center rounded-full bg-neutral-100 px-6 text-[14px] font-medium">
          {t('Use the API')}
        </Link>
      </div>
    </section>
  )
}
