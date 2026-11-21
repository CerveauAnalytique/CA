import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'
import { DashShell } from '@/components/Dash/DashShell'
import { getCounts } from '@/lib/caData'

export const metadata: Metadata = {
  title: 'Dashboard — Cerveau Analytique',
  description: 'Your data, API keys and export tools.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/login?redirect=/dashboard')

  const counts = await getCounts(payload, user)

  return (
    <DashShell
      user={{ email: user.email ?? '', name: (user as unknown as { name?: string }).name }}
      counts={counts}
    >
      {children}
    </DashShell>
  )
}
