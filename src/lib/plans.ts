import { tr } from '@/i18n/translate'

export type Plan = {
  id: 'free' | 'hobby' | 'pro' | 'business' | 'enterprise'
  name: string
  tagline: string
  /** Price per month in euros, 0 = free */
  price: number
  /** "from EUR 99": the price depends on usage */
  from?: boolean
  vat: 'incl' | 'excl' | null
  features: string[]
  cta: string
  href: string
  highlight?: boolean
  icon: 'chat' | 'models' | 'team' | 'integrate' | 'security'
}

/**
 * The five packs. Change prices and limits here.
 * Free EUR 0, Hobby EUR 20, Pro EUR 99-199 (shown as "from EUR 99"), Business EUR 500, Enterprise from EUR 1,500.
 */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: tr('Free'),
    tagline: tr('Test CA7 and build your first project.'),
    price: 0,
    vat: null,
    features: [
      tr('1 project'),
      tr('3 connected data sources'),
      tr('1,000 API calls per month'),
      tr('Community AI models and datasets'),
      tr('Community support'),
    ],
    cta: tr('Start for free'),
    href: '/create-account',
    icon: 'chat',
  },
  {
    id: 'hobby',
    name: tr('Hobby'),
    tagline: tr('For makers and small projects.'),
    price: 20,
    vat: 'incl',
    features: [
      tr('Everything in Free'),
      tr('10 connected data sources'),
      tr('50,000 API calls per month'),
      tr('Build up to 3 of your own AI models'),
      tr('5 GB of data storage'),
      tr('Email support'),
    ],
    cta: tr('Choose Hobby'),
    href: '/dashboard/plan',
    icon: 'models',
  },
  {
    id: 'pro',
    name: tr('Pro'),
    tagline: tr('For small businesses that want answers from their data.'),
    price: 99,
    from: true,
    vat: 'excl',
    features: [
      tr('Everything in Hobby'),
      tr('50 connected data sources'),
      tr('500,000 API calls per month'),
      tr('CA7 Chat on your own data'),
      tr('Anomaly detection'),
      tr('50 GB of data storage'),
      tr('Up to 10 of your own AI models'),
    ],
    cta: tr('Choose Pro'),
    href: '/dashboard/plan',
    highlight: true,
    icon: 'integrate',
  },
  {
    id: 'business',
    name: tr('Business'),
    tagline: tr('For teams and companies that run on their data.'),
    price: 500,
    vat: 'excl',
    features: [
      tr('Everything in Pro'),
      tr('Unlimited connected data sources'),
      tr('5 million API calls per month'),
      tr('Automation based on events and data'),
      tr('Unlimited own AI models'),
      tr('500 GB of data storage'),
      tr('Team accounts and roles'),
      tr('Internal support desk integration'),
      tr('Priority support and payment by invoice'),
    ],
    cta: tr('Talk to us'),
    href: '/contact?plan=business',
    icon: 'team',
  },
  {
    id: 'enterprise',
    name: tr('Enterprise'),
    tagline: tr('For larger organisations.'),
    price: 1500,
    from: true,
    vat: 'excl',
    features: [
      tr('Everything in Business'),
      tr('Private environment'),
      tr('Custom connectors'),
      tr('Single sign-on'),
      tr('Service agreement and dedicated contact'),
      tr('Custom contract'),
    ],
    cta: tr('Contact sales'),
    href: '/contact?plan=enterprise',
    icon: 'security',
  },
]
