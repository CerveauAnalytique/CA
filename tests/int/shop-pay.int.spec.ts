import { describe, it, expect, beforeAll } from 'vitest'
import { GET as pay } from '@/app/(app)/api/ca/stripe/pay/route'
import { GET as methods } from '@/app/(app)/api/ca/shop/route'

describe('Stripe card page and payment methods', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.CA7_APP_URL = 'https://cloud.ca7.io'
  })
  it('shows which methods are on', async () => {
    expect(await (await methods()).json()).toMatchObject({ stripe: true })
  })
  it('renders the card form for a valid client secret and returns to the app', async () => {
    const r = await pay(new Request('http://x/api/ca/stripe/pay?cs=pi_3Abc_secret_XyZ123&email=a@b.nl&lang=nl'))
    const html = await r.text()
    expect(r.status).toBe(200)
    expect(html).toContain('js.stripe.com/v3')
    expect(html).toContain('https://cloud.ca7.io/nl/checkout/confirm-order?provider=stripe\\u0026paymentIntent=pi_3Abc')
  })
  it('rejects a bad secret and does not let an e-mail break out of the script', async () => {
    expect((await pay(new Request('http://x/api/ca/stripe/pay?cs=nope'))).status).toBe(400)
    const html = await (await pay(new Request('http://x/api/ca/stripe/pay?cs=pi_3Abc_secret_XyZ123&email=' + encodeURIComponent('</script><script>alert(1)</script>')))).text()
    expect(html).not.toContain('</script><script>alert')
  })
})
