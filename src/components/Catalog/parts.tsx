import Link from 'next/link'
import React from 'react'

export function CatalogHead({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string
  title: string
  text: string
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">{eyebrow}</p>
      <h1 className="mt-3 text-[clamp(30px,4vw,48px)] font-light leading-tight tracking-tight">{title}</h1>
      <p className="mt-3 max-w-xl text-[15px] text-neutral-500">{text}</p>
    </div>
  )
}

export function SearchBox({ action, q, extra }: { action: string; q: string; extra?: Record<string, string> }) {
  return (
    <form action={action} className="mt-8 flex items-center gap-2 rounded-full bg-neutral-100 px-5 py-1.5">
      <input
        name="q"
        defaultValue={q}
        placeholder="Search…"
        className="h-9 flex-1 bg-transparent text-[14px] outline-none placeholder:text-neutral-400"
      />
      {Object.entries(extra ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </form>
  )
}

export function Chips({
  items,
  active,
  hrefFor,
}: {
  items: { value: string; label: string }[]
  active: string
  hrefFor: (value: string) => string
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((i) => (
        <Link
          key={i.value}
          href={hrefFor(i.value)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] ${
            i.value === active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  )
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">{children}</span>
  )
}

export function Specs({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="space-y-3 text-[13px]">
      {rows
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4">
            <dt className="text-neutral-400">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
    </dl>
  )
}

export const formatBytes = (n?: number | null) => {
  if (!n) return null
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${u[i]}`
}

export const formatNumber = (n?: number | null) => (n == null ? null : n.toLocaleString('en-US'))
