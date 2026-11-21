import { loadSettings, runningLow } from '@/lib/ai/engine'
import { whoAmI } from '@/lib/ai/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { payload, user, consent } = await whoAmI(request)
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 })
  if (!(await loadSettings(payload)).flags.runningLow) return Response.json({ items: [], disabled: true })
  return Response.json(await runningLow(payload, user.id, consent))
}
