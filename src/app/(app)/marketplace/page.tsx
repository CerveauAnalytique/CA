import React from 'react'
import Link from 'next/link'
import { Store, Sparkles, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react'
import type { Metadata } from 'next'

const MARKETPLACE_ITEMS = [
  {
    id: 'm1',
    title: 'Neural Vision & Carbon Processing Model v4.2',
    category: 'AI Models',
    price: '$149 / mo',
    desc: 'High-precision CNN spatial vision model for real-time carbon estimation and dataset parsing.',
    badge: 'Popular',
  },
  {
    id: 'm2',
    title: 'Enterprise Vector Indexing SDK',
    category: 'SDK & Tools',
    price: '$299 / mo',
    desc: 'Sub-millisecond similarity search & vector database adapter for Postgres and Payload CMS.',
    badge: 'Enterprise',
  },
  {
    id: 'm3',
    title: 'Autonomous Multi-Agent Orchestrator',
    category: 'Agents',
    price: '$99 / mo',
    desc: 'Deploy resilient agent swarms with built-in MCP tool definitions, retries, and fallback logging.',
    badge: 'New',
  },
  {
    id: 'm4',
    title: 'Realtime Voice & Audio Streaming API',
    category: 'API Access',
    price: '$79 / mo',
    desc: 'Low-latency bidirectional WebSocket voice streaming with VAD and noise suppression.',
    badge: 'Verified',
  },
]

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 transition-colors">
      <div className="max-w-[1400px] mx-auto px-6 space-y-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-neutral-800">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-bold rounded-full tracking-widest uppercase">
              <Store size={14} />
              Cerveau Marketplace
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
              AI Models, SDKs & <span className="text-neutral-400">Tools</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-lg">
              Explore pre-built neural models, agent tools, and enterprise data adapters ready to deploy into your workspace.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-xl text-sm hover:opacity-90 transition shadow-lg self-start md:self-auto"
          >
            Visit Hardware Shop →
          </Link>
        </div>

        {/* Marketplace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MARKETPLACE_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-sm hover:shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {item.category}
                  </span>
                  <span className="bg-black/10 dark:bg-white/10 text-neutral-900 dark:text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between">
                <span className="text-sm font-bold font-mono">{item.price}</span>
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-neutral-900 dark:text-white hover:text-blue-500 transition flex items-center"
                >
                  Deploy <ArrowUpRight size={13} className="ml-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Marketplace — Cerveau Analytique',
  description: 'Explore neural models, SDKs, and enterprise agent tools.',
}
