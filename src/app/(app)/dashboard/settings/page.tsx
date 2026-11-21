import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { ProfileForm } from '@/components/Dash/ProfileForm'
import { AiConsent } from '@/components/Dash/AiConsent'

export const metadata = { title: 'Profile' }

export default async function SettingsPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await getHeaders() })
  const u = user as unknown as { id: string | number; name?: string; username?: string; email: string; language?: string; aiConsent?: boolean }
  return (
    <>
      <ProfileForm id={u.id} name={u.name ?? ''} username={u.username ?? ''} email={u.email} language={u.language ?? 'en'} />
      <AiConsent initial={Boolean(u.aiConsent)} />
    </>
  )
}
