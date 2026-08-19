import React from 'react'
import { Hero } from '@/components/Home/Hero'
import { WorkspaceHero } from '@/components/Home/WorkspaceHero'
import type { Metadata } from 'next'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <Hero />
      <WorkspaceHero />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Cerveau Analytique — AGI Evolution & Analytical Intelligence',
  description:
    'The analytical intelligence layer powering modern engineering teams, neural models, and data labs.',
}
