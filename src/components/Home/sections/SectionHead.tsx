import React from 'react'

export function SectionHead({
  index,
  label,
  title,
  text,
}: {
  index: string
  label: string
  title: string
  text: string
}) {
  return (
    <div className="relative mx-auto max-w-2xl px-6 text-center">
      <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-1 pr-3 font-mono text-[12px]">
        <span className="rounded-md bg-[#f9d84a] px-2 py-0.5">[{index}]</span>
        {label}
      </span>
      <h2 className="mt-8 text-[clamp(30px,4vw,48px)] font-normal leading-tight tracking-tight text-neutral-900">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-neutral-500">{text}</p>
    </div>
  )
}
