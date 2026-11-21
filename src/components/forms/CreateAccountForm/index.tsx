'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link, { setLanguageCookie, useLocale, useT } from '@/i18n/client'
import { LANGUAGES, LOCALES, isLocale, localizePath } from '@/i18n/config'
import { translate } from '@/i18n/translate'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
  passwordConfirm: string
  language: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const t = useT()
  const locale = useLocale()
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>({ defaultValues: { language: locale } })

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = response.statusText || t('There was an error creating the account.')
        setError(message)
        return
      }

      const redirect = searchParams.get('redirect')

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login(data)
        clearTimeout(timer)
        const target = redirect || `/account?success=${encodeURIComponent(translate(isLocale(data.language) ? data.language : locale, 'Account created successfully'))}`
        // the language chosen here is saved on the account and used from now on
        if (isLocale(data.language) && data.language !== locale) {
          setLanguageCookie(data.language)
          window.location.assign(localizePath(target, data.language))
          return
        }
        router.push(target)
      } catch (_) {
        clearTimeout(timer)
        setError(t('There was an error with the credentials provided. Please try again.'))
      }
    },
    [login, router, searchParams, locale, t],
  )

  return (
    <form className="max-w-lg py-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="prose dark:prose-invert mb-6">
        <p>{t('Create an account to save your orders and your language.')}</p>
      </div>

      <Message error={error} />

      <div className="flex flex-col gap-8 mb-8">
        <FormItem>
          <Label htmlFor="email" className="mb-2">
            {t('Email address')}
          </Label>
          <Input
            id="email"
            {...register('email', { required: t('Email is required.') })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="password" className="mb-2">
            {t('New password')}
          </Label>
          <Input
            id="password"
            {...register('password', { required: t('Password is required.') })}
            type="password"
          />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="passwordConfirm" className="mb-2">
            {t('Confirm password')}
          </Label>
          <Input
            id="passwordConfirm"
            {...register('passwordConfirm', {
              required: t('Please confirm your password.'),
              validate: (value) => value === password.current || t('The passwords do not match'),
            })}
            type="password"
          />
          {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="language" className="mb-2">
            {t('Language')}
          </Label>
          <select
            id="language"
            {...register('language')}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGES[l].flag} {LANGUAGES[l].name}
              </option>
            ))}
          </select>
        </FormItem>
      </div>
      <Button disabled={loading} type="submit" variant="default">
        {loading ? t('Processing') : t('Create account')}
      </Button>

      <div className="prose dark:prose-invert mt-8">
        <p>
          {t('Already have an account?')}{' '}
          <Link href={`/login${allParams}`}>{t('Log in')}</Link>
        </p>
      </div>
    </form>
  )
}
