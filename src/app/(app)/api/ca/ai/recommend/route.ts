import { loadSettings, recommend } from '@/lib/ai/engine'
import { whoAmI } from '@/lib/ai/auth'
import { rateLimit, clientKey } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/** GET /api/ca/ai/recommend?products=1,2  Suggestions with the reason; personal ones only with consent. Checked by the Compliance Engine. */
export async function GET(request: Request) {
  const limited = rateLimit(`rec:${clientKey(request)}`, 60, 60_000)
  if (!limited.ok) return Response.json({ error: 'Too many requests.' }, { status: 429 })
  const { payload, user, consent } = await whoAmI(request)
  if (!(await loadSettings(payload)).flags.recommendations) return Response.json({ items: [], disabled: true })
  const ids = (new URL(request.url).searchParams.get('products') || '').split(',').filter(Boolean).slice(0, 20)
  return Response.json(await recommend(payload, { productIds: ids, userId: user?.id, consent }))
}
