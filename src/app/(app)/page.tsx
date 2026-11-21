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
  title: 'Cerveau Analytique — Complete visibility across every corner of your property',
  description:
    'Real-time motion detection, night vision and instant alerts — all monitored from a single dashboard built for security teams.',
}
