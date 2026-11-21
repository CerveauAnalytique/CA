import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { AuthBackdrop } from '@/components/AuthBackdrop'
import React from 'react'

import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  return (
    <AuthBackdrop>
      <div className="container py-16">
        <div className="mx-auto w-full max-w-[440px]">
          <ForgotPasswordForm />
        </div>
      </div>
    </AuthBackdrop>
  )
}

export const metadata: Metadata = {
  description: 'Enter your email address to recover your password.',
  openGraph: mergeOpenGraph({
    title: 'Forgot Password',
    url: '/forgot-password',
  }),
  title: 'Forgot Password',
}
