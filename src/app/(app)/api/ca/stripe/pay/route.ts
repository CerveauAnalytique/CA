export const dynamic = 'force-dynamic'

const safeJson = (v: string) => JSON.stringify(v).replace(/[<>&]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))

/**
 * GET /api/ca/stripe/pay?cs=<client secret>&email=<e-mail>
 * The card form of Stripe (Payment Element) for a payment that /api/payments/stripe/initiate started.
 * Card data goes straight from the browser to Stripe, never through CA7. Afterwards Stripe sends the shopper back to the app.
 * (A small HTML response, not a website page: the app opens it for the card step.)
 */
export async function GET(request: Request) {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const url = new URL(request.url)
  const cs = url.searchParams.get('cs') || ''
  const email = url.searchParams.get('email') || ''
  const lang = (url.searchParams.get('lang') || 'en').replace(/[^a-z]/g, '').slice(0, 2) || 'en'
  if (!pk || !/^pi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+$/.test(cs)) return new Response('Invalid payment.', { status: 400 })
  const app = (process.env.CA7_APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || url.origin).replace(/\/$/, '')
  const piId = cs.split('_secret_')[0]
  const returnUrl = `${app}/${lang}/checkout/confirm-order?provider=stripe&paymentIntent=${piId}${email ? `&email=${encodeURIComponent(email)}` : ''}`
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pay by card</title>
<style>body{font-family:system-ui,sans-serif;background:#fafafa;margin:0;display:flex;justify-content:center;padding:32px 16px}main{width:100%;max-width:440px;background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:24px}h1{font-size:20px;font-weight:500;margin:0 0 16px}button{margin-top:20px;width:100%;padding:12px;border:0;border-radius:99px;background:#111;color:#fff;font-size:15px;cursor:pointer}button:disabled{opacity:.5}#msg{color:#b91c1c;font-size:13px;margin-top:12px}small{color:#777;display:block;margin-top:12px}</style></head>
<body><main><h1>Pay by card</h1><form id="f"><div id="pe"></div><button id="b">Pay</button><div id="msg"></div></form><small>Secure payment by Stripe. Your card details are sent to Stripe only.</small></main>
<script src="https://js.stripe.com/v3/"></script>
<script>
const stripe=Stripe(${safeJson(pk)});
const elements=stripe.elements({clientSecret:${safeJson(cs)}});
elements.create('payment').mount('#pe');
document.getElementById('f').addEventListener('submit',async(e)=>{e.preventDefault();const b=document.getElementById('b');b.disabled=true;
const {error}=await stripe.confirmPayment({elements,confirmParams:{return_url:${safeJson(returnUrl)}}});
if(error){document.getElementById('msg').textContent=error.message||'Payment failed.';b.disabled=false}});
</script></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; connect-src https://api.stripe.com; style-src 'self' 'unsafe-inline'" } })
}
