import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { clientKey, rateLimit } from '@/lib/rateLimit'
import { limitsOf } from '@/lib/limits'
import { track } from '@/lib/security/track'
import { analyze, summaryText } from '@/lib/intelligence'

export const dynamic = 'force-dynamic'

// requests per 10 minutes: visitors without an account and customers who are logged in
const LIMIT_ANON = Number(process.env.CA7_CHAT_LIMIT_ANON || 10)
const LIMIT_USER_OVERRIDE = process.env.CA7_CHAT_LIMIT_USER ? Number(process.env.CA7_CHAT_LIMIT_USER) : null
const WINDOW = 10 * 60 * 1000
const MAX_BODY = 200_000

type Msg = { role: 'user' | 'assistant'; content: string }

const API_URL = (process.env.CA7_API_URL || 'http://127.0.0.1:11434').replace(/\/$/, '')
const MODEL = process.env.CA7_MODEL || 'ca7'

const MAX_MESSAGES = 30
const MAX_CHARS = 12000

/**
 * POST /api/ca/chat  { messages: [{role, content}] }
 * Streams the CA7 model's answer as plain text. The model runs on an Ollama-compatible
 * server (CA7_API_URL, default http://127.0.0.1:11434) - see ai/ca7/README.md.
 */
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) {
    return Response.json({ error: 'That message is too long.' }, { status: 413 })
  }

  // logged-in customers get a higher limit; everyone else is limited per address
  let user = null as { id: string | number; plan?: string | null; roles?: string[] | null } | null
  try {
    const payload = await getPayload({ config: configPromise })
    user = (await payload.auth({ headers: request.headers })).user as typeof user
  } catch {
    /* treated as a visitor */
  }
  const limited = user
    ? rateLimit(`u:${user.id}`, LIMIT_USER_OVERRIDE ?? limitsOf(user).chat, WINDOW)
    : rateLimit(`ip:${clientKey(request)}`, LIMIT_ANON, WINDOW)
  if (!limited.ok) {
    await track(request, 'rate_limited', user?.id, { route: 'chat' })
    return Response.json(
      { error: user ? 'You have reached the limit for now. Try again in a few minutes.' : 'You have reached the limit for visitors. Log in for more messages, or try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } },
    )
  }

  let messages: Msg[]
  try {
    const body = await request.json()
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      .filter(
        (m: Msg) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string',
      )
      .slice(-MAX_MESSAGES)
      .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'Send at least one user message.' }, { status: 400 })
  }

  // Pro and up: CA7 answers from the customer's own data (their connected sources)
  if (user && limitsOf(user).chatOnData) {
    try {
      const payload = await getPayload({ config: configPromise })
      const sources = await payload.find({ collection: 'data-sources', where: { owner: { equals: user.id } }, limit: 10, depth: 0, overrideAccess: true })
      const parts: string[] = []
      for (const src of sources.docs) {
        const recs = await payload.find({ collection: 'data-records', where: { source: { equals: src.id } }, sort: '-recordedAt', limit: 300, depth: 0, overrideAccess: true })
        const stats = analyze(recs.docs.reverse().map((d) => ({ data: d.data as Record<string, unknown>, at: d.recordedAt ?? undefined })), true)
        if (stats.length) parts.push(summaryText(src.name, stats))
      }
      if (parts.length) {
        messages = [
          { role: 'user', content: `Context: this is the customer's own data. Answer questions about it using only these facts, and say when you do not know.\n\n${parts.join('\n\n').slice(0, 6000)}` },
          { role: 'assistant', content: 'Understood. I will answer from your data.' },
          ...messages,
        ]
      }
    } catch {
      /* chat still works without the data context */
    }
  }

  let upstream: Response
  try {
    upstream = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, stream: true }),
      signal: AbortSignal.timeout(120_000),
    })
  } catch {
    return Response.json(
      { error: 'CA7 is offline. Start the model server and try again.' },
      { status: 503 },
    )
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    const missing = upstream.status === 404 || /not found/i.test(detail)
    return Response.json(
      {
        error: missing
          ? `The model "${MODEL}" is not installed yet. Run: bash ai/ca7/build.sh`
          : 'CA7 could not answer right now.',
      },
      { status: 502 },
    )
  }

  // Ollama streams one JSON object per line; forward only the text.
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const chunk = JSON.parse(line)
              const text = chunk?.message?.content
              if (text) controller.enqueue(encoder.encode(text))
            } catch {
              /* ignore partial line */
            }
          }
        }
      } finally {
        controller.close()
      }
    },
    cancel() {
      upstream.body?.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
