import { tr } from '@/i18n/translate'

export type Plan = {
  id: 'free' | 'hobby' | 'company'
  name: string
  tagline: string
  /** Price per month in euros, 0 = free */
  price: number
  vat: 'incl' | 'excl' | null
  features: string[]
  cta: string
  href: string
  highlight?: boolean
  icon: 'chat' | 'models' | 'team'
}

/** The three packs. Change prices and limits here. */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: tr('Free'),
    tagline: tr('Try CA7 and build your first project.'),
    price: 0,
    vat: null,
    features: [
      tr('1 project'),
      tr('3 IoT devices'),
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
    tagline: tr('For hobby builders who want their own AI models.'),
    price: 20,
    vat: 'incl',
    features: [
      tr('Everything in Free'),
      tr('10 IoT devices'),
      tr('50,000 API calls per month'),
      tr('Build up to 3 of your own AI models'),
      tr('5 GB of data storage'),
      tr('Email support'),
    ],
    cta: tr('Choose Hobby'),
    href: '/create-account?plan=hobby',
    highlight: true,
    icon: 'models',
  },
  {
    id: 'company',
    name: tr('Company'),
    tagline: tr('For teams that run IoT and company data on CA7.'),
    price: 500,
    vat: 'excl',
    features: [
      tr('Everything in Hobby'),
      tr('Unlimited IoT devices'),
      tr('5 million API calls per month'),
      tr('Unlimited own AI models'),
      tr('500 GB of data storage'),
      tr('Team accounts and roles'),
      tr('Internal support desk integration'),
      tr('Priority support and payment by invoice'),
    ],
    cta: tr('Talk to us'),
    href: '/contact?plan=company',
    icon: 'team',
  },
]
