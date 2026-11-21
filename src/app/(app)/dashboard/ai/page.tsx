import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { AiPanel } from '@/components/Dash/AiPanel'

export const metadata = { title: 'AI Control Center' }

export default async function AiPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!(user as unknown as { roles?: string[] } | null)?.roles?.includes('admin')) return <p className="text-sm text-neutral-500">Only admins can open the AI Control Center.</p>
  return <AiPanel />
}
