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
  title: 'CA7 — Create your own digital brain for your IoT',
  description:
    'Solve company problems with AI models, datasets and one API: smart cameras, sensors and internal support.',
}
