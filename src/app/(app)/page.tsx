import React from 'react'
import type { Metadata } from 'next'
import { CameraHero } from '@/components/Home/CameraHero'
import { LogoStrip } from '@/components/Home/sections/LogoStrip'
import { FeatureCards } from '@/components/Home/sections/FeatureCards'
import { UpdatesSection } from '@/components/Home/sections/UpdatesSection'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <CameraHero />
      <LogoStrip />
      <FeatureCards />
      <UpdatesSection />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Cerveau Analytique — Create your own digital brain',
  description:
    'The AI tool that saves, analyzes and shares data from smart cameras, sensors and more. Build your own digital brain — with an API and apps marketplace for everyone.',
}
