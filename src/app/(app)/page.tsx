import React from 'react'
import type { Metadata } from 'next'
import { CameraHero } from '@/components/Home/CameraHero'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020618]">
      <CameraHero />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Cerveau Analytique — Complete visibility across every corner of your property',
  description:
    'Real-time motion detection, night vision and instant alerts — all monitored from a single dashboard built for security teams.',
}
