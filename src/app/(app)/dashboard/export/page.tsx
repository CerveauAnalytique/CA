import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { ExportPanel } from '@/components/Dash/ExportPanel'
import { getCounts } from '@/lib/caData'

export default async function ExportPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const counts = await getCounts(payload, user)
  return <ExportPanel items={counts} />
}
