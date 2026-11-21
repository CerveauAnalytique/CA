'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Plus, Square } from 'lucide-react'
import { BrainIcon } from '@/components/Logo/BrainIcon'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; error?: boolean }

const SUGGESTIONS = [
  'Summarise these sensor readings: 21.4, 21.6, 35.2, 21.5',
  'Write a SQL query for daily camera motion events',
  'How do I share my data through the API?',
  'Which anomalies matter in temperature data?',
]

const uid = () => Math.random().toString(36).slice(2)

/** Renders ```code``` blocks nicely, everything else as plain text. */
function Content({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?(?:```|$))/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const body = part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
          return (
            <pre
              key={i}
              className="my-3 overflow-x-auto rounded-xl bg-neutral-900 p-3.5 text-[12.5px] leading-relaxed text-neutral-100"
            >
              <code>{body}</code>
            </pre>
          )
        }
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        )
      })}
    </>
  )
}

export function ChatCa7() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const send = useCallback(
    async (text: string, history: Msg[]) => {
      const q = text.trim()
      if (!q || busy) return
      const user: Msg = { id: uid(), role: 'user', content: q }
      const bot: Msg = { id: uid(), role: 'assistant', content: '' }
      setMessages([...history, user, bot])
      setInput('')
      setBusy(true)

      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch('/api/ca/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...history, user].map(({ role, content }) => ({ role, content })),
          }),
          signal: ctrl.signal,
        })
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'CA7 could not answer right now.')
        }
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = dec.decode(value, { stream: true })
          setMessages((m) =>
            m.map((x) => (x.id === bot.id ? { ...x, content: x.content + chunk } : x)),
          )
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setMessages((m) =>
            m.map((x) =>
              x.id === bot.id ? { ...x, content: (e as Error).message, error: true } : x,
            ),
          )
        }
      } finally {
        setBusy(false)
        abortRef.current = null
      }
    },
    [busy],
  )

  // Question coming from the home page chat bar: /chat-ca7?q=...
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) send(q, [])
  }, [send])

  const empty = messages.length === 0

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col px-6" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="flex h-14 items-center justify-end">
        {!empty && (
          <button
            type="button"
            onClick={() => {
              abortRef.current?.abort()
              setMessages([])
              setBusy(false)
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
          >
            <Plus size={13} /> New chat
          </button>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
            <BrainIcon className="h-14 w-14" />
            <h1 className="mt-6 text-[clamp(30px,4vw,44px)] font-light leading-tight tracking-tight">
              What can CA7 help you with?
            </h1>
            <p className="mt-3 max-w-md text-[15px] text-neutral-500">
              The AI that is very good with data: sensors, cameras, SQL, analytics.
            </p>
            <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s, [])}
                  className="rounded-2xl bg-neutral-100 px-4 py-3 text-left text-[13px] text-neutral-700 transition hover:bg-neutral-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-6 pb-6">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex gap-3'}>
                {m.role === 'assistant' && <BrainIcon className="mt-1 h-6 w-6 shrink-0" />}
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-md bg-neutral-900 px-4 py-2.5 text-[14.5px] text-white'
                      : `min-w-0 max-w-[92%] text-[14.5px] leading-relaxed ${
                          m.error ? 'text-red-600' : 'text-neutral-800'
                        }`
                  }
                >
                  {m.content ? (
                    <Content text={m.content} />
                  ) : (
                    <span className="inline-flex gap-1 py-2">
                      <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
                      <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:120ms]" />
                      <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:240ms]" />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input, messages.filter((m) => !m.error))
          }}
          className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-5 pt-3"
        >
          <div className="flex items-end gap-2 rounded-[28px] bg-white p-2 pl-5 shadow-xl shadow-black/5 ring-1 ring-neutral-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input, messages.filter((m) => !m.error))
                }
              }}
              rows={1}
              placeholder="Ask CA7 anything…"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[15px] outline-none placeholder:text-neutral-400"
            />
            {busy ? (
              <button
                type="button"
                aria-label="Stop"
                onClick={() => abortRef.current?.abort()}
                className="grid h-10 w-10 place-items-center rounded-full bg-neutral-900 text-white"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send"
                disabled={!input.trim()}
                className="grid h-10 w-10 place-items-center rounded-full bg-neutral-900 text-white disabled:opacity-30"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-neutral-400">
            CA7 can make mistakes. Check important numbers.
          </p>
        </form>
      </div>
    </div>
  )
}
