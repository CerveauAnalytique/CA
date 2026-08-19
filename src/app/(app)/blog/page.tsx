import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  title: 'Blog & Insights — Cerveau Analytique',
  description: 'Perspectives on AI, analytics, and building intelligent products.',
}

const posts = [
  {
    slug: 'data-flywheel-effect',
    category: 'INSIGHTS',
    title: 'The Data Flywheel Effect: Why More Users Makes Your AI Smarter',
    excerpt: 'How network effects in machine learning create compounding competitive advantages for data-driven businesses.',
    date: 'Aug 12, 2026',
    author: 'Marie Dupont',
  },
  {
    slug: 'real-time-rag',
    category: 'ENGINEERING',
    title: 'Building Real-Time RAG Pipelines at Scale',
    excerpt: 'A deep dive into our architecture for serving retrieval-augmented generation with sub-100ms p99 latency.',
    date: 'Aug 1, 2026',
    author: 'Kenji Watanabe',
  },
  {
    slug: 'vector-db-comparison',
    category: 'RESEARCH',
    title: 'Vector Database Showdown: 2026 Edition',
    excerpt: 'We benchmarked six leading vector databases on recall, throughput, and cost at the 100M-vector scale.',
    date: 'Jul 22, 2026',
    author: 'Amara Osei',
  },
  {
    slug: 'llm-fine-tuning-guide',
    category: 'GUIDES',
    title: 'Fine-Tuning LLMs for Domain-Specific Analytics Tasks',
    excerpt: 'A practical guide to domain adaptation, dataset curation, and evaluation harnesses for analytics workloads.',
    date: 'Jul 8, 2026',
    author: 'Sophie Laurent',
  },
]

const catColor: Record<string, string> = {
  INSIGHTS: 'research-tag--company',
  ENGINEERING: 'research-tag--product',
  RESEARCH: 'research-tag--research',
  GUIDES: 'research-tag--safety',
}

export default function BlogPage() {
  return (
    <div className="static-page">
      <div className="static-page-hero">
        <div className="static-container">
          <p className="static-eyebrow">Blog & Insights</p>
          <h1 className="static-title">Thinking out loud</h1>
          <p className="static-subtitle">
            Engineering deep-dives, product announcements, and perspectives from the Cerveau team.
          </p>
        </div>
      </div>

      <div className="static-container">
        <div className="blog-list">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
              <span className={`research-tag ${catColor[post.category] ?? ''}`}>{post.category}</span>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-meta">
                <span>{post.author}</span>
                <span className="research-dot" />
                <span>{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
