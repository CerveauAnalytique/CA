'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link, { setLanguageCookie, useLocale, useT } from '@/i18n/client'
import { isLocale, localizePath } from '@/i18n/config'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = useRef(searchParams.get('redirect'))
  const t = useT()
  const locale = useLocale()
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<null | string>(null)

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const user = await login(data)
        const target = redirect?.current || '/dashboard'
        // sign-in for another tool (/api/ca/oidc/authorize) is a server route, not a page
        if (target.startsWith('/api/')) {
          window.location.assign(target)
          return
        }
        // the account remembers the customer's language: open the site in it
        const lang = (user as { language?: string } | undefined)?.language
        if (isLocale(lang) && lang !== locale) {
          setLanguageCookie(lang)
          window.location.assign(localizePath(target, lang))
          return
        }
        router.push(target)
      } catch (_) {
        setError(t('There was an error with the credentials provided. Please try again.'))
      }
    },
    [login, router, locale, t],
  )

  const [show, setShow] = React.useState(false)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Message className="classes.message" error={error} />
      <div className="flex flex-col gap-5">
        <FormItem>
          <Label htmlFor="email">{t('Email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-11 rounded-xl"
            {...register('email', { required: t('Email is required.') })}
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('Password')}</Label>
            <Link
              href={`/forgot-password${allParams}`}
              className="text-[12px] text-neutral-500 underline hover:text-neutral-900 dark:hover:text-white"
            >
              {t('Forgot your password?')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              className="h-11 rounded-xl pe-16"
              {...register('password', { required: t('Please provide a password.') })}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              aria-pressed={show}
            >
              {show ? t('Hide') : t('Show')}
            </button>
          </div>
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>
      </div>

      <Button className="mt-6 h-11 w-full rounded-full" disabled={isLoading} size="lg" type="submit" variant="default">
        {isLoading ? t('Processing') : t('Continue')}
      </Button>

      <p className="mt-6 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
        <Link href={`/create-account${allParams}`} className="font-medium text-neutral-900 underline dark:text-white">
          {t('Create an account')}
        </Link>
      </p>
    </form>
  )
}
