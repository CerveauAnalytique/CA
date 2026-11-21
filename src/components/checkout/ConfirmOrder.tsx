'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export const ConfirmOrder: React.FC = () => {
  const [failed, setFailed] = useState<string | null>(null)
  const { confirmOrder } = usePayments()
  const { cart } = useCart()

  const searchParams = useSearchParams()
  const router = useRouter()
  // Ensure we only confirm the order once, even if the component re-renders
  const isConfirming = useRef(false)

  useEffect(() => {
    if (!cart || !cart.items || cart.items?.length === 0) {
      return
    }

    const paymentIntentID = searchParams.get('payment_intent')
    const molliePaymentID = searchParams.get('paymentId')
    const isMollie = searchParams.get('provider') === 'mollie' && Boolean(molliePaymentID)
    const email = searchParams.get('email')

    if (paymentIntentID || isMollie) {
      if (!isConfirming.current) {
        isConfirming.current = true

        confirmOrder(isMollie ? 'mollie' : 'stripe', {
          additionalData: isMollie
            ? { paymentID: molliePaymentID, ...(email ? { customerEmail: email } : {}) }
            : { paymentIntentID },
        }).then((result) => {
          if (result && typeof result === 'object' && 'orderID' in result && result.orderID) {
            const accessToken = 'accessToken' in result ? (result.accessToken as string) : ''
            const queryParams = new URLSearchParams()

            if (email) {
              queryParams.set('email', email)
            }
            if (accessToken) {
              queryParams.set('accessToken', accessToken)
            }

            const queryString = queryParams.toString()
            router.push(`/orders/${result.orderID}${queryString ? `?${queryString}` : ''}`)
          } else {
            setFailed('We could not confirm your payment yet.')
          }
        }).catch((err: unknown) => {
          setFailed(err instanceof Error ? 'Your payment was not completed.' : 'Something went wrong.')
        })
      }
    } else {
      // If no payment intent ID is found, redirect to the home
      router.push('/')
    }
  }, [cart, confirmOrder, router, searchParams])

  return (
    <div className="text-center w-full flex flex-col items-center justify-start gap-4">
      {failed ? (
        <>
          <h1 className="text-2xl">Payment not completed</h1>
          <p className="text-neutral-500">{failed} You have not been charged for an unfinished payment.</p>
          <a href="/checkout" className="underline">Back to checkout</a>
        </>
      ) : (
        <>
          <h1 className="text-2xl">Confirming Order</h1>
          <LoadingSpinner className="w-12 h-6" />
        </>
      )}
    </div>
  )
}
