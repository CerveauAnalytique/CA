import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';

const _tabs = [
  ('/dashboard', 'Overview'),
  ('/dashboard/settings', 'Profile'),
  ('/dashboard/connect', 'Data Connect'),
  ('/dashboard/intelligence', 'Data Intelligence'),
  ('/dashboard/automation', 'Automation'),
  ('/dashboard/camera', 'Camera Intelligence'),
  ('/dashboard/api', 'API keys'),
  ('/dashboard/export', 'Export & sync'),
  ('/dashboard/plan', 'Pack & billing'),
  ('/dashboard/platform', 'Platform'),
];

/// Settings page frame: title + tabs (same sections as src/components/Dash/DashShell.tsx).
class DashboardShell extends ConsumerWidget {
  const DashboardShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final user = ref.watch(authProvider).user;
    final path = GoRouterState.of(context).uri.path.replaceFirst(RegExp(r'^/[a-z]{2}'), '');
    final name = user?.displayName ?? '';
    return Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 64 : 48),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('DASHBOARD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 1.54, color: c.faint)),
        const SizedBox(height: 12),
        Text('Your data, $name', style: TextStyle(fontSize: (context.width * .04).clamp(30.0, 44.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
        const SizedBox(height: 12),
        ConstrainedBox(constraints: const BoxConstraints(maxWidth: 576), child: Text('Connect your data, see what it says, automate, and manage your API key and pack.', style: TextStyle(fontSize: 15, color: c.muted))),
        const SizedBox(height: 32),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final t in _tabs)
            Lnk(
              to: t.$1,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: path == t.$1 ? c.primaryBg : (Theme.of(context).brightness == Brightness.light ? Neutral.c100 : Neutral.c800), borderRadius: BorderRadius.circular(99)),
                child: Text(context.t(t.$2), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: path == t.$1 ? c.primaryFg : c.muted)),
              ),
            ),
        ]),
        const SizedBox(height: 32),
        child,
      ]),
    );
  }
}
