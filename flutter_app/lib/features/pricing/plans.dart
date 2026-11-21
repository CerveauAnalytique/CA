/// The five packs (mirror of src/lib/plans.ts and src/lib/limits.ts). Texts are English and translated with context.t().
class Plan {
  const Plan({required this.id, required this.name, required this.tagline, required this.price, this.from = false, this.vat, required this.features, required this.cta, required this.href, this.highlight = false, required this.icon});
  final String id, name, tagline, cta, href, icon;
  final int price;
  final bool from, highlight;
  final String? vat; // 'incl' | 'excl'
  final List<String> features;
}

const plans = <Plan>[
  Plan(id: 'free', name: 'Free', tagline: 'Test CA7 and build your first project.', price: 0, features: ['1 project', '3 connected data sources', '1,000 API calls per month', 'Community AI models and datasets', 'Community support'], cta: 'Start for free', href: '/create-account', icon: 'chat'),
  Plan(id: 'hobby', name: 'Hobby', tagline: 'For makers and small projects.', price: 20, vat: 'incl', features: ['Everything in Free', '10 connected data sources', '50,000 API calls per month', 'Build up to 3 of your own AI models', '5 GB of data storage', 'Email support'], cta: 'Choose Hobby', href: '/dashboard/plan', icon: 'models'),
  Plan(id: 'pro', name: 'Pro', tagline: 'For small businesses that want answers from their data.', price: 99, from: true, vat: 'excl', features: ['Everything in Hobby', '50 connected data sources', '500,000 API calls per month', 'CA7 Chat on your own data', 'Anomaly detection', '50 GB of data storage', 'Up to 10 of your own AI models'], cta: 'Choose Pro', href: '/dashboard/plan', highlight: true, icon: 'integrate'),
  Plan(id: 'business', name: 'Business', tagline: 'For teams and companies that run on their data.', price: 500, vat: 'excl', features: ['Everything in Pro', 'Unlimited connected data sources', '5 million API calls per month', 'Automation based on events and data', 'Unlimited own AI models', '500 GB of data storage', 'Team accounts and roles', 'Internal support desk integration', 'Priority support and payment by invoice'], cta: 'Talk to us', href: '/contact?plan=business', icon: 'team'),
  Plan(id: 'enterprise', name: 'Enterprise', tagline: 'For larger organisations.', price: 1500, from: true, vat: 'excl', features: ['Everything in Business', 'Private environment', 'Custom connectors', 'Single sign-on', 'Service agreement and dedicated contact', 'Custom contract'], cta: 'Contact sales', href: '/contact?plan=enterprise', icon: 'security'),
];

/// Limits enforced by the backend (src/lib/limits.ts); the app only shows them.
String formatPrice(int v) => v.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},');
