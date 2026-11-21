import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { ApiKeyPanel } from '@/components/Dash/ApiKeyPanel'

export default async function ApiPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const enabled = Boolean((user as unknown as { enableAPIKey?: boolean })?.enableAPIKey)
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return <ApiKeyPanel enabled={enabled} base={base} />
}
