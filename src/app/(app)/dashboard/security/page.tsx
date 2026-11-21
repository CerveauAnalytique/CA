import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { SecurityPanel } from '@/components/Dash/SecurityPanel'

export const metadata = { title: 'Security' }

export default async function SecurityPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!(user as unknown as { roles?: string[] } | null)?.roles?.includes('admin')) {
    return <p className="text-sm text-neutral-500">Only admins can see the security dashboard.</p>
  }
  return <SecurityPanel />
}
