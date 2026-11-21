import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import Link from '@/i18n/client'
import { planOf } from '@/lib/limits'
import { PLATFORM, checkService, serviceUrl } from '@/lib/platform'
import { enabled as oidcEnabled, issuer } from '@/lib/oidc'

export const metadata = { title: 'Platform' }

const LABEL = { online: 'Online', offline: 'Not reachable', 'not-connected': 'Not connected' } as const
const DOT = { online: 'bg-green-500', offline: 'bg-red-500', 'not-connected': 'bg-neutral-400' } as const

export default async function PlatformPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const isAdmin = Boolean((user as unknown as { roles?: string[] })?.roles?.includes('admin'))
  const allowed = isAdmin || planOf(user as never) === 'enterprise'

  if (!allowed) {
    return (
      <section className="max-w-xl rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
        <h2 className="text-[14px] font-semibold">Private environment</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          The platform tools (OpenRemote, Dify, Airbyte, ThingsBoard) are part of the Enterprise pack, with your own private environment.{' '}
          <Link href="/contact?plan=enterprise" className="underline">Contact sales</Link>
        </p>
      </section>
    )
  }

  const rows = await Promise.all(PLATFORM.map(async (s) => ({ s, status: await checkService(s), url: serviceUrl(s) })))
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
        The tools CA7 runs next to this site. CA7 is the front: your account, API, branding and billing. These tools do the work behind it.
        Install them with <code>platform/install.sh</code> and set their addresses in the environment (see <code>platform/README.md</code>).
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ s, status, url }) => (
          <section key={s.id} className="flex flex-col rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold">{s.name}</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500"><span className={`h-2 w-2 rounded-full ${DOT[status]}`} />{LABEL[status]}</span>
            </div>
            <p className="text-xs text-neutral-400">{s.role}</p>
            <p className="mt-2 flex-1 text-sm text-neutral-600 dark:text-neutral-300">{s.text}</p>
            <div className="mt-4 flex items-center gap-3">
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-neutral-900 px-4 py-1.5 text-[13px] font-medium text-white dark:bg-white dark:text-neutral-900">Open {s.name}</a>
              ) : (
                <span className="text-xs text-neutral-500">Set <code>{s.env}</code> (for example {s.defaultUrl})</span>
              )}
            </div>
          </section>
        ))}
      </div>
      <section className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-white">TimescaleDB (business data and storage)</h2>
        <p className="mt-1">PostgreSQL with time-series storage for sensor data and business data. Started by <code>platform/docker-compose.yml</code> on port 5433. Not a web page; connect with a database tool or from Airbyte and Dify.</p>
      </section>
      <section className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-white">Sign in with your CA7 account</h2>
        {oidcEnabled() ? (
          <div className="mt-2 space-y-1">
            <p>CA7 is an OpenID Connect provider. Add it as a login provider in ThingsBoard and in OpenRemote (Keycloak). Then one CA7 account opens both.</p>
            <p>Issuer: <code>{issuer()}</code></p>
            <p>Discovery: <code>{issuer()}/.well-known/openid-configuration</code></p>
            <p>Steps per tool: <code>platform/SSO.md</code>. Dify and Airbyte (open-source editions) have no OIDC login: they keep their own login.</p>
          </div>
        ) : (
          <p className="mt-2">Not switched on. Set <code>CA7_OIDC_PRIVATE_KEY</code> and <code>CA7_OIDC_CLIENTS</code> (see <code>platform/SSO.md</code>).</p>
        )}
      </section>
    </div>
  )
}
