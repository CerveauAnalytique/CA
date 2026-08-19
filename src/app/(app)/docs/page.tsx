import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  title: 'Documentation — Cerveau Analytique',
  description: 'Guides, references, and tutorials for the Cerveau Analytique platform.',
}

const sections = [
  {
    title: 'Getting Started',
    icon: '🚀',
    links: [
      { label: 'Quickstart', href: '/docs/quickstart' },
      { label: 'Authentication', href: '/docs/auth' },
      { label: 'Your first query', href: '/docs/first-query' },
    ],
  },
  {
    title: 'API Reference',
    icon: '⚡',
    links: [
      { label: 'REST API', href: '/docs/rest' },
      { label: 'GraphQL API', href: '/docs/graphql' },
      { label: 'Streaming', href: '/docs/streaming' },
    ],
  },
  {
    title: 'SDKs',
    icon: '📦',
    links: [
      { label: 'JavaScript / TypeScript', href: '/sdks#js' },
      { label: 'Python', href: '/sdks#python' },
      { label: 'Go', href: '/sdks#go' },
    ],
  },
  {
    title: 'Guides',
    icon: '📖',
    links: [
      { label: 'Semantic Search', href: '/docs/guides/semantic-search' },
      { label: 'Predictive Models', href: '/docs/guides/predictive' },
      { label: 'Webhooks', href: '/docs/guides/webhooks' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="static-page">
      <div className="static-page-hero">
        <div className="static-container">
          <p className="static-eyebrow">Documentation</p>
          <h1 className="static-title">Everything you need to build</h1>
          <p className="static-subtitle">
            Comprehensive guides and API references to integrate Cerveau Analytique into your products.
          </p>
        </div>
      </div>

      <div className="static-container">
        <div className="docs-grid">
          {sections.map((section) => (
            <div key={section.title} className="docs-card">
              <div className="docs-card-icon">{section.icon}</div>
              <h2 className="docs-card-title">{section.title}</h2>
              <ul className="docs-card-links">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="docs-link">
                      {link.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
