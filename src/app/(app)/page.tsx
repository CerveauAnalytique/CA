import React from 'react'
import type { Metadata } from 'next'
import { CameraHero } from '@/components/Home/CameraHero'
import { LogoStrip } from '@/components/Home/sections/LogoStrip'
import { FeatureCards } from '@/components/Home/sections/FeatureCards'
import { UpdatesSection } from '@/components/Home/sections/UpdatesSection'
import { ProblemsSection } from '@/components/Home/sections/ProblemsSection'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <CameraHero />
      <LogoStrip />
      <FeatureCards />
      <UpdatesSection />
      <ProblemsSection />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'CA7 — The AI brain for business data',
  description:
    'CA7 connects databases, APIs, IoT devices, sensors and cameras to one AI platform: ask your own data questions, build your own AI models and automate.',
}
