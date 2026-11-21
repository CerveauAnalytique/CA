import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { getT } from '@/i18n/server'
import React from 'react'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LoginForm } from '@/components/forms/LoginForm'
import { AuthBackdrop } from '@/components/AuthBackdrop'
import { redirect } from 'next/navigation'

export default async function Login() {
  const t = await getT()
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <AuthBackdrop>
    <div className="container">
      <div className="mx-auto my-12 w-full max-w-[400px] bg-transparent py-4">
        <RenderParams />
        <div className="mb-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ca7-wordmark-white.svg" alt="CA7" className="h-8 w-auto" />
        </div>
        <h1 className="text-center text-[28px] font-light tracking-tight">{t('Log in')}</h1>
        <p className="mb-8 mt-2 text-center text-[14px] text-neutral-500 dark:text-neutral-400">
          {t('Log in to manage your account and review your order history.')}
        </p>
        <LoginForm />
      </div>
    </div>
    </AuthBackdrop>
  )
}

export const metadata: Metadata = {
  description: 'Login or create an account to get started.',
  openGraph: {
    title: 'Login',
    url: '/login',
  },
  title: 'Login',
}
