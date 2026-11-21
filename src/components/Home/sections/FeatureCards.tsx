import React from 'react'
import { SectionHead } from './SectionHead'
import { AccessIcon, ProtectionIcon, ThreatIcon } from './icons'

const CARDS = [
  {
    Icon: ProtectionIcon,
    title: 'Smart Protection',
    text: 'Stop breaches early with adaptive security that learns from new attack patterns.',
  },
  {
    Icon: AccessIcon,
    title: 'Access Control',
    text: 'Control permissions and authentication with enterprise security and zero-trust access.',
  },
  {
    Icon: ThreatIcon,
    title: 'Threat Detection',
    text: 'Spot suspicious activity instantly with AI-powered monitoring across all systems.',
  },
]

const Corner = ({ className }: { className: string }) => (
  <span className={`absolute h-[7px] w-[7px] rotate-45 bg-neutral-300 ${className}`} />
)

export function FeatureCards() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
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
        label="Fabulous Features"
        title="Security built for the AI era"
        text="Protect sensitive data, monitor threats in real time, and automate security workflows across your entire infrastructure."
      />

      <div className="relative mx-auto mt-20 max-w-[1040px] px-6">
        <div className="relative grid grid-cols-1 border border-neutral-200 md:grid-cols-3">
          <Corner className="-left-1 -top-1" />
          <Corner className="-right-1 -top-1" />
          <Corner className="-bottom-1 -left-1" />
          <Corner className="-bottom-1 -right-1" />
          {CARDS.map(({ Icon, title, text }, i) => (
            <div
              key={title}
              className={`flex flex-col items-center px-8 py-12 text-center ${
                i < CARDS.length - 1 ? 'border-b md:border-b-0 md:border-r border-neutral-200' : ''
              }`}
            >
              <Icon />
              <h3 className="mt-8 font-mono text-[18px] font-medium text-neutral-900">{title}</h3>
              <p className="mt-3 max-w-[250px] text-[13px] leading-relaxed text-neutral-500">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
