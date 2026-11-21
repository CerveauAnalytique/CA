import { Payload } from 'payload'

export const SAMPLE_POSTS = [
  {
    blogId: 'BLOG-101',
    title: 'Training to cycle across Antarctica with ChatGPT',
    slug: 'training-to-cycle-across-antarctica',
    category: 'Stories',
    coverImageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop',
    excerpt: 'How extreme endurance athletes use real-time AI modeling and climate analysis to navigate Antarctic expeditions.',
    publishedAt: new Date('2026-06-11T12:00:00Z').toISOString(),
  },
  {
    blogId: 'BLOG-102',
    title: 'Creating new simulations of black holes with Codex',
    slug: 'simulations-of-black-holes-with-codex',
    category: 'Stories',
    coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Astrophysicists deploy generative code pipelines to simulate gravitational lensing and event horizon physics.',
    publishedAt: new Date('2026-06-11T12:00:00Z').toISOString(),
  },
  {
    blogId: 'BLOG-103',
    title: 'Chip Ganassi Racing × OpenAI',
    slug: 'chip-ganassi-racing-openai',
    category: 'Stories',
    coverImageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Telemetry optimization and race strategy modeling in real-time motorsport engineering.',
    publishedAt: new Date('2026-05-28T12:00:00Z').toISOString(),
  },
  {
    blogId: 'BLOG-201',
    title: 'Model ML completes finance work more efficiently with GPT-5.6 Sol',
    slug: 'model-ml-finance-work-gpt-56',
    category: 'Business',
    coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Automating complex financial auditing and tabular reporting across global enterprise portfolios.',
    publishedAt: new Date('2026-08-10T12:00:00Z').toISOString(),
  },
  {
    blogId: 'BLOG-202',
    title: 'Virgin Atlantic sharpens customer journeys with ChatGPT Work',
    slug: 'virgin-atlantic-customer-journeys',
    category: 'Business',
    coverImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Delivering personalized flight operations and concierge support at scale.',
    publishedAt: new Date('2026-08-10T12:00:00Z').toISOString(),
  },
  {
    blogId: 'BLOG-203',
    title: 'How Zapier transformed core marketing processes with ChatGPT Work',
    slug: 'zapier-core-marketing-processes',
    category: 'Business',
    coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    excerpt: 'Connecting 5,000+ app integrations to automated content, campaign management, and analytics.',
    publishedAt: new Date('2026-08-10T12:00:00Z').toISOString(),
  },
  {
    blogId: 'BLOG-301',
    title: 'Enterprise AI Architecture & Security Standards',
    slug: 'enterprise-ai-architecture-security',
    category: 'Explore',
    coverImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop',
    excerpt: 'SOC2, HIPAA, and isolation boundaries for mission-critical analytical intelligence deployment.',
    publishedAt: new Date('2026-08-15T12:00:00Z').toISOString(),
  },
]

export async function seedPostsIfEmpty(payload: Payload) {
  try {
    const existing = await payload.find({
      collection: 'posts' as any,
      limit: 1,
    })

    if (existing.docs.length === 0) {
      for (const postData of SAMPLE_POSTS) {
        await payload.create({
          collection: 'posts' as any,
          data: postData,
        })
      }
    }
  } catch (err) {
    // Swallow seeding errors if DB is initializing
  }
}
