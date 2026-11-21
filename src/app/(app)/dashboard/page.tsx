import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from '@/i18n/client'
import React from 'react'
import { Card } from '@/components/Dash/DashShell'
import { CopyField } from '@/components/Dash/CopyField'
import { getCounts } from '@/lib/caData'

export default async function DashboardOverview() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const counts = await getCounts(payload, user)
  const total = counts.reduce((a, c) => a + c.count, 0)
  const keyOn = Boolean((user as unknown as { enableAPIKey?: boolean })?.enableAPIKey)
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <Card title="Workspace">
          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Your data hub. Connect cameras, sensors and apps, then read everything through one API.
          </p>
          <p className="mt-4 text-[11px] text-neutral-400">API endpoint</p>
          <CopyField value={`${base}/api/ca/export`} />
          <p className="mt-4 text-[11px] text-neutral-400">API key</p>
          <p className="text-xs">
            {keyOn ? 'Active' : 'Not created yet'} ·{' '}
            <Link href="/dashboard/api" className="underline">
              manage
            </Link>
          </p>
        </Card>

        <Card title="Quick start">
          <ol className="list-decimal space-y-1.5 ps-4 text-xs text-neutral-600 dark:text-neutral-300">
            <li>
              Create an <Link href="/dashboard/api" className="underline">API key</Link>
            </li>
            <li>Call the API from your app or server</li>
            <li>
              Or use the <Link href="/dashboard/export" className="underline">sync tool</Link> to send your
              data to your own server
            </li>
          </ol>
        </Card>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Records', total],
            ['Data sources', counts.filter((c) => c.count > 0).length],
            ['Collections', counts.length],
            ['API key', keyOn ? 'On' : 'Off'],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900">
              <p className="text-[11px] text-neutral-400">{label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          ))}
        </div>

        <Card
          title="Data sources"
          action={
            <Link href="/dashboard/export" className="text-xs text-neutral-500 underline dark:text-neutral-400">
              Export
            </Link>
          }
        >
          <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-start text-[13px]">
            <thead className="text-[11px] text-neutral-400">
              <tr>
                <th className="rounded-s-lg bg-white px-3 py-2 font-normal dark:bg-neutral-950">Collection</th>
                <th className="bg-white px-3 py-2 font-normal dark:bg-neutral-950">Records</th>
                <th className="rounded-e-lg bg-white px-3 py-2 font-normal dark:bg-neutral-950">API</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((c) => (
                <tr key={c.slug} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                  <td className="px-3 py-2.5 font-medium">{c.label}</td>
                  <td className="px-3 py-2.5">{c.count}</td>
                  <td className="px-3 py-2.5">
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] dark:bg-neutral-800">
                      ?collections={c.slug}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
