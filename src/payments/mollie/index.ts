import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

/**
 * Mollie payment adapter for the Payload ecommerce plugin (no extra npm package: it calls the
 * Mollie REST API directly).  Flow: initiatePayment creates a Mollie payment and returns its
 * checkoutUrl; the shopper pays on Mollie (iDEAL, Bancontact, cards, ...), is sent back to
 * /checkout/confirm-order?provider=mollie&paymentId=tr_..., and confirmOrder creates the order
 * once Mollie reports the payment as paid.  A webhook keeps the transaction status in sync.
 */

const API = process.env.MOLLIE_API_URL || 'https://api.mollie.com/v2'

type MolliePayment = {
  id: string
  status: 'open' | 'pending' | 'authorized' | 'paid' | 'canceled' | 'expired' | 'failed'
  amount: { currency: string; value: string }
  metadata?: { cartID?: string | number; shippingAddress?: unknown } | null
  _links?: { checkout?: { href: string } }
}

async function mollie<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.detail || body?.title || `Mollie error ${res.status}`)
  return body as T
}

/** Minor units (cents) to Mollie's decimal string. All currencies here use 2 decimals. */
const toValue = (minor: number) => (minor / 100).toFixed(2)

type Args = {
  apiKey: string
  /** Public https URL of this site, used for the redirect and webhook. */
  siteUrl: string
  label?: string
}

export const mollieAdapter = ({ apiKey, siteUrl, label = 'iDEAL / Bancontact / Card' }: Args): PaymentAdapter => {
  const base = siteUrl.replace(/\/$/, '')
  // where the shopper lands after paying: the website, or the Flutter app when CA7_APP_URL is set
  const returnBase = (process.env.CA7_APP_URL || siteUrl).replace(/\/$/, '')

  return {
    name: 'mollie',
    label,
    group: {
      name: 'mollie',
      type: 'group',
      admin: { condition: (data) => data?.paymentMethod === 'mollie' },
      fields: [{ name: 'paymentID', type: 'text', label: 'Mollie payment ID' }],
    },

    initiatePayment: async ({ data, req, transactionsSlug }) => {
      const { cart, currency, customerEmail, billingAddress, shippingAddress } = data
      const amount = cart?.subtotal
      if (!apiKey) throw new Error('Mollie API key is required.')
      if (!currency) throw new Error('Currency is required.')
      if (!cart?.items?.length) throw new Error('Cart is empty or not provided.')
      if (!customerEmail || typeof customerEmail !== 'string') {
        throw new Error('A valid customer email is required to make a purchase.')
      }
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('A valid amount is required to initiate a payment.')
      }

      const items = cart.items.map((item) => {
        const { product, variant, ...rest } = item as Record<string, any>
        return {
          ...rest,
          product: typeof product === 'object' ? product.id : product,
          quantity: item.quantity,
          ...(variant ? { variant: typeof variant === 'object' ? variant.id : variant } : {}),
        }
      })

      const webhookUrl = base.startsWith('https://') ? `${base}/api/payments/mollie/webhooks` : undefined
      const payment = await mollie<MolliePayment>(apiKey, '/payments', {
        method: 'POST',
        body: JSON.stringify({
          amount: { currency: currency.toUpperCase(), value: toValue(amount) },
          description: `Order ${cart.id}`,
          // replaced with the payment id right below
          redirectUrl: `${returnBase}/checkout/confirm-order?provider=mollie`,
          ...(webhookUrl ? { webhookUrl } : {}),
          metadata: { cartID: cart.id, shippingAddress },
        }),
      })

      // Mollie does not append the payment id to the return URL, so put it there ourselves.
      const redirectUrl = `${returnBase}/checkout/confirm-order?provider=mollie&paymentId=${payment.id}&email=${encodeURIComponent(customerEmail)}`
      await mollie(apiKey, `/payments/${payment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ redirectUrl }),
      })

      await req.payload.create({
        collection: transactionsSlug as any,
        req,
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount,
          billingAddress,
          cart: cart.id,
          currency: currency.toUpperCase(),
          items,
          paymentMethod: 'mollie',
          status: 'pending',
          mollie: { paymentID: payment.id },
        } as any,
      })

      return {
        message: 'Payment initiated successfully',
        paymentID: payment.id,
        checkoutUrl: payment._links?.checkout?.href ?? '',
      }
    },

    confirmOrder: async ({ cartsSlug = 'carts', data, ordersSlug = 'orders', req, transactionsSlug = 'transactions' }) => {
      const payload = req.payload
      const paymentID = (data as any).paymentID as string | undefined
      const customerEmail = data.customerEmail
      if (!paymentID || !/^tr_[\w-]+$/.test(paymentID)) throw new Error('A valid Mollie payment ID is required')

      const found = await payload.find({
        collection: transactionsSlug as any,
        req,
        where: { 'mollie.paymentID': { equals: paymentID } },
      })
      const transaction = found.docs[0] as any
      if (!transaction) throw new Error('No transaction found for this payment')

      const payment = await mollie<MolliePayment>(apiKey, `/payments/${paymentID}`)
      if (payment.status !== 'paid') throw new Error(`Payment not completed (${payment.status}).`)

      // idempotent: the same payment must only create one order
      if (transaction.order) {
        const orderId = typeof transaction.order === 'object' ? transaction.order.id : transaction.order
        const existing = await payload.findByID({ collection: ordersSlug as any, id: orderId, req, depth: 0 })
        return {
          message: 'Order already confirmed',
          orderID: orderId,
          transactionID: transaction.id,
          ...((existing as any).accessToken ? { accessToken: (existing as any).accessToken } : {}),
        }
      }

      const cartID = payment.metadata?.cartID ?? transaction.cart
      const order: any = await payload.create({
        collection: ordersSlug as any,
        req,
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          ...(req.user ? { customer: req.user.id } : { customerEmail: customerEmail || transaction.customerEmail }),
          items: transaction.items,
          shippingAddress: payment.metadata?.shippingAddress,
          status: 'processing',
          transactions: [transaction.id],
        } as any,
      })

      if (cartID) {
        await payload.update({
          collection: cartsSlug as any,
          id: typeof cartID === 'object' ? (cartID as any).id : cartID,
          req,
          data: { purchasedAt: new Date().toISOString() } as any,
        })
      }
      await payload.update({
        collection: transactionsSlug as any,
        id: transaction.id,
        req,
        data: { order: order.id, status: 'succeeded' } as any,
      })

      return {
        message: 'Order confirmed successfully',
        orderID: order.id,
        transactionID: transaction.id,
        ...(order.accessToken ? { accessToken: order.accessToken } : {}),
      }
    },

    endpoints: [
      {
        method: 'post',
        path: '/webhooks',
        handler: async (req) => {
          // Mollie sends form data: id=tr_xxx. We never trust the body; we ask Mollie for the status.
          const form = req.formData ? await req.formData().catch(() => null) : null
          const id = String(form?.get('id') ?? '')
          if (/^tr_[\w-]+$/.test(id)) {
            try {
              const payment = await mollie<MolliePayment>(apiKey, `/payments/${id}`)
              const map: Record<string, string> = { canceled: 'cancelled', expired: 'expired', failed: 'failed' }
              const status = map[payment.status]
              if (status) {
                const found = await req.payload.find({
                  collection: 'transactions',
                  where: { 'mollie.paymentID': { equals: id } },
                  limit: 1,
                })
                const t = found.docs[0]
                if (t && t.status === 'pending') {
                  await req.payload.update({ collection: 'transactions', id: t.id, data: { status } as any })
                }
              }
            } catch (err) {
              req.payload.logger.error({ err, msg: 'Mollie webhook failed' })
            }
          }
          // always answer 200, otherwise Mollie keeps retrying
          return Response.json({ received: true })
        },
      },
    ],
  }
}

export const mollieAdapterClient = (): Pick<PaymentAdapter, 'name' | 'label'> & {
  confirmOrder: boolean
  initiatePayment: boolean
} => ({
  name: 'mollie',
  label: 'iDEAL / Bancontact / Card',
  confirmOrder: true,
  initiatePayment: true,
})
