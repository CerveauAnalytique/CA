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
    'Turn IoT and company data into answers: build your own AI models, use datasets and one API, and support your teams.',
}
