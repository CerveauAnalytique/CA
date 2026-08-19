'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Camera, User as UserIcon } from 'lucide-react'

type FormData = {
  email: string
  name: User['name']
  avatar?: string
  password?: string
  passwordConfirm?: string
}

export const AccountForm: React.FC = () => {
  const { setUser, user } = useAuth()
  const [changePassword, setChangePassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const {
    formState: { errors, isLoading, isSubmitting, isDirty },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const router = useRouter()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setAvatarPreview(result)
        setValue('avatar', result, { shouldDirty: true })
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        try {
          const payloadData: Record<string, any> = {
            name: data.name,
            email: data.email,
          }

          if (data.avatar) {
            payloadData.avatar = data.avatar
          }

          if (changePassword && data.password) {
            payloadData.password = data.password
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
            body: JSON.stringify(payloadData),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PATCH',
          })

          if (response.ok) {
            const json = await response.json()
            setUser(json.doc)
            toast.success('Successfully updated account & avatar!')
            setChangePassword(false)
            reset({
              name: json.doc.name,
              email: json.doc.email,
              avatar: json.doc.avatar,
              password: '',
              passwordConfirm: '',
            })
          } else {
            toast.error('There was a problem updating your account.')
          }
        } catch (err) {
          toast.error('Error updating account settings.')
        }
      }
    },
    [user, setUser, reset, changePassword],
  )

  useEffect(() => {
    if (user === null) {
      router.push(
        `/login?error=${encodeURIComponent(
          'You must be logged in to view this page.',
        )}&redirect=${encodeURIComponent('/account')}`,
      )
    }

    if (user) {
      const existingAvatar = (user as any)?.avatar?.url || (user as any)?.avatar || ''
      setAvatarPreview(existingAvatar)
      reset({
        name: user.name || '',
        email: user.email || '',
        avatar: existingAvatar,
        password: '',
        passwordConfirm: '',
      })
    }
  }, [user, router, reset])

  return (
    <form className="max-w-xl space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* Profile Picture Upload Section */}
      <div className="flex items-center gap-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 mb-6">
        <div className="relative group flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800 flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-neutral-400" />
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
          >
            <Camera className="w-6 h-6 text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Profile Photo</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Upload your avatar photo. It will appear across your account and top navbar.
          </p>
          <label
            htmlFor="avatar-upload"
            className="inline-block mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer underline"
          >
            Choose new image
          </label>
        </div>
      </div>

      {!changePassword ? (
        <Fragment>
          <div className="prose dark:prose-invert mb-6">
            <p className="text-sm text-neutral-400">
              Update your account details below. Your name will appear in the top navbar instead of masked email. Or{' '}
              <Button
                className="px-0 text-white underline hover:cursor-pointer"
                onClick={() => setChangePassword(!changePassword)}
                type="button"
                variant="link"
              >
                click here
              </Button>{' '}
              to change your password.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <FormItem>
              <Label htmlFor="email" className="mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                {...register('email', { required: 'Please provide an email.' })}
                type="email"
              />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <FormItem>
              <Label htmlFor="name" className="mb-2">
                Display Name / Full Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Jack Line"
                {...register('name', { required: 'Please provide a name.' })}
                type="text"
              />
              {errors.name && <FormError message={errors.name.message} />}
            </FormItem>
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="prose dark:prose-invert mb-6">
            <p className="text-sm text-neutral-400">
              Change your password below, or{' '}
              <Button
                className="px-0 text-white underline hover:cursor-pointer"
                onClick={() => setChangePassword(!changePassword)}
                type="button"
                variant="link"
              >
                cancel
              </Button>
              .
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <FormItem>
              <Label htmlFor="password" className="mb-2">
                New password
              </Label>
              <Input
                id="password"
                {...register('password', { required: 'Please provide a new password.' })}
                type="password"
              />
              {errors.password && <FormError message={errors.password.message} />}
            </FormItem>

            <FormItem>
              <Label htmlFor="passwordConfirm" className="mb-2">
                Confirm password
              </Label>
              <Input
                id="passwordConfirm"
                {...register('passwordConfirm', {
                  required: 'Please confirm your new password.',
                  validate: (value) => value === password.current || 'The passwords do not match',
                })}
                type="password"
              />
              {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
            </FormItem>
          </div>
        </Fragment>
      )}

      <div className="pt-2">
        <Button disabled={isLoading || isSubmitting || !isDirty} type="submit" variant="default">
          {isLoading || isSubmitting
            ? 'Processing...'
            : changePassword
              ? 'Change Password'
              : 'Save Account Settings'}
        </Button>
      </div>
    </form>
  )
}
