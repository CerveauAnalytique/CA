import React from 'react'
import { Hero } from '@/components/Home/Hero'
import { BlogCards, BlogPostItem } from '@/components/Home/BlogCards'
import { WorkspaceHero } from '@/components/Home/WorkspaceHero'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function HomePage() {
  let posts: BlogPostItem[] = []

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'posts' as any,
      limit: 10,
      sort: '-publishedAt',
    })

    if (result && result.docs && result.docs.length > 0) {
      posts = result.docs.map((doc: any) => ({
        id: doc.id,
        blogId: doc.blogId || `BLOG-${doc.id}`,
        title: doc.title,
        slug: doc.slug,
        category: doc.category || 'Stories',
        coverImageUrl: doc.coverImageUrl || doc.coverImage?.url || undefined,
        excerpt: doc.excerpt,
        publishedAt: doc.publishedAt
          ? new Date(doc.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : undefined,
      }))
    }
  } catch (error) {
    // If Payload CMS is initializing, swallow error & render fallback blog cards
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <Hero />
      <BlogCards posts={posts} />
      <WorkspaceHero />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Cerveau Analytique — AGI Evolution & Analytical Intelligence',
  description:
    'The analytical intelligence layer powering modern engineering teams, neural models, and data labs.',
}
