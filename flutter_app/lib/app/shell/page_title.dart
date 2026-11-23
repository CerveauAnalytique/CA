import 'package:flutter/widgets.dart';
import '../../core/i18n/i18n.dart';

/// (path pattern, page name for visitors, what a logged-in user is doing). `*` matches one path segment.
/// The first match wins, so the more specific patterns come first.
const _titles = <(String, String, String)>[
  ('', 'The AI brain for business data', 'Home'),
  ('/login', 'Log in', 'Logging in'),
  ('/create-account', 'Create account', 'Creating an account'),
  ('/forgot-password', 'Forgot password', 'Resetting the password'),
  ('/reset-password', 'Reset password', 'Resetting the password'),
  ('/pricing', 'Pricing', 'Comparing the packs'),
  ('/chat-ca7', 'CA7 Chat', 'Chatting with CA7'),
  ('/models/*', 'AI model', 'Looking at an AI model'),
  ('/models', 'AI Models', 'Browsing AI models'),
  ('/datasets/*', 'Dataset', 'Looking at a dataset'),
  ('/datasets', 'Datasets', 'Browsing datasets'),
  ('/support/request', 'Contact support', 'Asking support for help'),
  ('/support/articles/*', 'Help center', 'Reading a help article'),
  ('/support', 'Help center', 'Getting help'),
  ('/blog/*', 'Blog', 'Reading a blog post'),
  ('/blog', 'Blog', 'Reading the blog'),
  ('/research', 'Research', 'Reading research'),
  ('/api/hub/new', 'Publish your API', 'Publishing an API'),
  ('/api/hub/*/edit', 'Edit your API', 'Editing an API'),
  ('/api/hub/*', 'API Hub', 'Looking at an API'),
  ('/api/hub', 'API Hub', 'Browsing the API Hub'),
  ('/api', 'API', 'Exploring the API'),
  ('/shop/*', 'Product', 'Looking at a product'),
  ('/products/*', 'Product', 'Looking at a product'),
  ('/shop', 'Shop', 'Shopping'),
  ('/products', 'Shop', 'Shopping'),
  ('/assistant', 'AI Shopping Assistant', 'Shopping with the assistant'),
  ('/cart', 'Cart', 'Checking the cart'),
  ('/checkout/confirm-order', 'Checkout', 'Confirming an order'),
  ('/checkout', 'Checkout', 'Checking out'),
  ('/orders/*', 'Order', 'Looking at an order'),
  ('/orders', 'Orders', 'Looking at orders'),
  ('/find-order', 'Find order', 'Finding an order'),
  ('/account/addresses', 'Addresses', 'Editing addresses'),
  ('/dashboard/settings', 'Settings', 'Editing settings'),
  ('/dashboard/connect', 'Data Connect', 'Connecting data'),
  ('/dashboard/intelligence', 'Data Intelligence', 'Analyzing data'),
  ('/dashboard/automation', 'Automation', 'Setting up automation'),
  ('/dashboard/camera', 'Camera Intelligence', 'Managing cameras'),
  ('/dashboard/api', 'API keys', 'Managing API keys'),
  ('/dashboard/export', 'Export', 'Exporting data'),
  ('/dashboard/plan', 'Plan', 'Managing the plan'),
  ('/dashboard/platform', 'Platform', 'Managing the platform'),
  ('/dashboard/security', 'Security', 'Checking security'),
  ('/dashboard/ai', 'AI Center', 'Managing AI'),
  ('/dashboard', 'Dashboard', 'Looking at the dashboard'),
  ('/docs/*', 'Docs', 'Reading the docs'),
  ('/docs', 'Docs', 'Reading the docs'),
];

bool _match(String pattern, List<String> segs) {
  final p = pattern.split('/').where((s) => s.isNotEmpty).toList();
  if (p.length != segs.length) return false;
  for (var i = 0; i < p.length; i++) {
    if (p[i] != '*' && p[i] != segs[i]) return false;
  }
  return true;
}

/// Text of the browser tab: "Phylena | {page}" for visitors, "Phylena | {what you are doing}" when logged in.
/// [location] is the address without the language, e.g. `/dashboard/connect`.
String pageTitle(BuildContext context, String location, {required bool loggedIn}) {
  final segs = Uri.parse(location).pathSegments.where((s) => s.isNotEmpty).toList();
  for (final (pattern, page, doing) in _titles) {
    if (_match(pattern, segs)) return 'Phylena | ${context.t(loggedIn ? doing : page)}';
  }
  // a database page (/about, /privacy, /docs/quickstart, ...): its address as a name
  final last = segs.isEmpty ? '' : segs.last.replaceAll('-', ' ');
  return last.isEmpty ? 'Phylena' : 'Phylena | ${context.t(last[0].toUpperCase() + last.substring(1))}';
}
