import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { ConnectPanel, type SourceRow } from '@/components/Dash/ConnectPanel'

export const metadata = { title: 'Data Connect' }

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const { type } = await searchParams
  const res = await payload.find({ collection: 'data-sources', depth: 0, limit: 100, sort: '-createdAt', overrideAccess: false, user })
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
        Connect a REST API, upload a CSV file, or push data from IoT devices, an MQTT bridge or scripts. SQL databases and direct MQTT are not available yet.
      </p>
      <ConnectPanel sources={res.docs as unknown as SourceRow[]} base={base} defaultType={type} />
    </>
  )
}
