import { assistantAnswer, loadSettings } from '@/lib/ai/engine'
import { whoAmI } from '@/lib/ai/auth'
import { clientKey, rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/** POST /api/ca/ai/assistant { messages: [{role, content}] }  The AI shopping assistant; its answer is checked against real prices and stock first. */
export async function POST(request: Request) {
  const { payload, user } = await whoAmI(request)
  const limited = user ? rateLimit(`ai:u:${user.id}`, 40, 600_000) : rateLimit(`ai:ip:${clientKey(request)}`, 10, 600_000)
  if (!limited.ok) return Response.json({ error: 'Too many questions. Try again in a few minutes.' }, { status: 429 })
  if (!(await loadSettings(payload)).flags.assistant) return Response.json({ error: 'The assistant is switched off.' }, { status: 503 })
  const b = await request.json().catch(() => ({}))
  const messages = (Array.isArray(b.messages) ? b.messages : []).filter((m: { role?: string; content?: unknown }) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-10).map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content.slice(0, 2000) }))
  if (!messages.length || messages[messages.length - 1].role !== 'user') return Response.json({ error: 'Send a question.' }, { status: 400 })
  return Response.json(await assistantAnswer(payload, messages, user?.id))
}
