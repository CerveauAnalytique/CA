import React from 'react'

type Block = { blockType: string; text?: string; level?: string; code?: string; items?: { text?: string; title?: string }[] }

/** Renders the blocks of a help article (heading, paragraph, list, code, callout). */
export function Blocks({ blocks }: { blocks?: Block[] }) {
  return (
    <div className="space-y-4">
      {(blocks ?? []).map((b, i) => {
        switch (b.blockType) {
          case 'heading':
            return <h2 key={i} className="pt-4 text-[20px] font-semibold tracking-tight">{b.text}</h2>
          case 'list':
            return (
              <ul key={i} className="list-disc space-y-1.5 ps-5 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {(b.items ?? []).map((it, j) => <li key={j}>{it.text}</li>)}
              </ul>
            )
          case 'code':
            return <pre key={i} className="overflow-x-auto rounded-xl bg-neutral-900 p-4 text-[12.5px] text-neutral-100"><code>{b.code}</code></pre>
          case 'callout':
            return <p key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[14px] text-amber-900">{b.text}</p>
          default:
            return <p key={i} className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">{b.text}</p>
        }
      })}
    </div>
  )
}
