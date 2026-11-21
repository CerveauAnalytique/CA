import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/i18n/i18n.dart';
import '../core/providers.dart';
import '../core/widgets/atoms.dart';
import '../features/auth/auth_pages.dart';
import '../features/catalog/catalog.dart';
import '../features/chat/chat_page.dart';
import '../features/content/cms.dart';
import '../features/shop/checkout_pages.dart';
import '../features/support/support_pages.dart';
import '../features/shop/shop_pages.dart';
import '../features/dashboard/dashboard_pages.dart';
import '../features/dashboard/dashboard_shell.dart';
import '../features/home/home_page.dart';
import '../features/pricing/pricing_page.dart';
import 'shell/shell.dart';

Page<void> _p(GoRouterState s, Widget child) => NoTransitionPage<void>(key: s.pageKey, child: child);

/// Waits until the stored login is restored before showing a page that needs an account.
class _AuthGate extends ConsumerWidget {
  const _AuthGate({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return auth.user == null ? const Padding(padding: EdgeInsets.symmetric(vertical: 96), child: StateBox.loading()) : child;
  }
}

/// Same address scheme as the website: /{lang}/page. A page without a language code gets one (cookie/default).
GoRouter createRouter(WidgetRef ref) {
  final auth = ref.read(authProvider);
  final i18n = ref.read(i18nProvider);

  GoRoute r(String path, Widget Function(GoRouterState) b) => GoRoute(path: path, pageBuilder: (c, s) => _p(s, b(s)));

  return GoRouter(
    initialLocation: '/',
    refreshListenable: auth,
    redirect: (context, state) {
      final segs = state.uri.pathSegments;
      final q = state.uri.hasQuery ? '?${state.uri.query}' : '';
      if (segs.isEmpty || !isLang(segs.first)) return '/${i18n.lang}${state.uri.path == '/' ? '' : state.uri.path}$q';
      final lang = segs.first;
      final rest = '/${segs.skip(1).join('/')}';
      final needsLogin = rest == '/dashboard' || rest.startsWith('/dashboard/');
      if (needsLogin && auth.ready && auth.user == null) return '/$lang/login?redirect=${Uri.encodeComponent(rest)}';
      if ((rest == '/login' || rest == '/create-account') && auth.user != null) return '/$lang/dashboard';
      return null;
    },
    errorBuilder: (context, state) => Shell(lang: state.uri.pathSegments.isNotEmpty && isLang(state.uri.pathSegments.first) ? state.uri.pathSegments.first : 'en', child: NotFoundPage(path: state.uri.path)),
    routes: [
      ShellRoute(
        builder: (context, state, child) => Shell(lang: state.uri.pathSegments.isNotEmpty && isLang(state.uri.pathSegments.first) ? state.uri.pathSegments.first : 'en', location: state.uri.toString(), child: child),
        routes: [
          GoRoute(
            path: '/:lang',
            pageBuilder: (c, s) => _p(s, const HomePage()),
            routes: [
              r('pricing', (_) => const PricingPage()),
              r('login', (_) => const LoginPage()),
              r('create-account', (_) => const CreateAccountPage()),
              r('forgot-password', (_) => const ForgotPasswordPage()),
              r('chat-ca7', (_) => const ChatPage()),
              r('models', (_) => const CatalogListPage(models: true)),
              r('models/:slug', (s) => CatalogDetailPage(slug: s.pathParameters['slug']!, models: true)),
              r('datasets', (_) => const CatalogListPage(models: false)),
              r('datasets/:slug', (s) => CatalogDetailPage(slug: s.pathParameters['slug']!, models: false)),
              r('support', (_) => const SupportPage()),
              r('support/request', (_) => const SupportRequestPage()),
              r('support/articles/:slug', (s) => SupportArticlePage(slug: s.pathParameters['slug']!)),
              r('blog', (_) => const BlogPage()),
              r('blog/:slug', (s) => BlogPostPage(slug: s.pathParameters['slug']!)),
              r('shop', (_) => const ShopPage()),
              r('shop/:slug', (s) => ProductPage(slug: s.pathParameters['slug']!)),
              r('products', (_) => const ShopPage()),
              r('products/:slug', (s) => ProductPage(slug: s.pathParameters['slug']!)),
              r('cart', (_) => const CartPage()),
              r('checkout', (_) => const CheckoutPage()),
              r('checkout/confirm-order', (_) => const ConfirmOrderPage()),
              r('orders', (_) => const OrdersPage()),
              r('orders/:id', (s) => OrderPage(id: s.pathParameters['id']!)),
              r('find-order', (_) => const FindOrderPage()),
              GoRoute(path: 'account', redirect: (c, s) => '/${s.pathParameters['lang']}/dashboard/settings'),
              GoRoute(path: 'api-access', redirect: (c, s) => '/${s.pathParameters['lang']}/pricing'),
              r('account/addresses', (_) => const AddressesPage()),
              ShellRoute(
                builder: (c, s, child) => _AuthGate(child: DashboardShell(child: child)),
                routes: [
                  r('dashboard', (_) => const OverviewPage()),
                  r('dashboard/settings', (_) => const ProfilePage()),
                  r('dashboard/connect', (_) => const ConnectPage()),
                  r('dashboard/intelligence', (_) => const IntelligencePage()),
                  r('dashboard/automation', (_) => const AutomationPage()),
                  r('dashboard/camera', (_) => const CameraPage()),
                  r('dashboard/api', (_) => const ApiKeysPage()),
                  r('dashboard/export', (_) => const ExportPage()),
                  r('dashboard/plan', (_) => const PlanPage()),
                  r('dashboard/platform', (_) => const PlatformPage()),
                ],
              ),
              // everything else comes from the database: /about, /docs/quickstart, /privacy, CMS pages, ...
              r(':a', (s) => CmsPage(s.pathParameters['a']!)),
              r(':a/:b', (s) => CmsPage('${s.pathParameters['a']}/${s.pathParameters['b']}')),
            ],
          ),
        ],
      ),
    ],
  );
}
