import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/colors.dart';
import '../../app/theme/theme.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';

const _tabs = [
  ('/dashboard', 'Overview', Icons.space_dashboard_outlined),
  ('/dashboard/connect', 'Data Connect', Icons.cable_outlined),
  ('/dashboard/intelligence', 'Data Intelligence', Icons.insights_outlined),
  ('/dashboard/automation', 'Automation', Icons.bolt_outlined),
  ('/dashboard/camera', 'Camera Intelligence', Icons.videocam_outlined),
  ('/dashboard/api', 'API keys', Icons.vpn_key_outlined),
  ('/dashboard/export', 'Export & sync', Icons.ios_share_outlined),
  ('/dashboard/platform', 'Platform', Icons.hub_outlined),
  ('/dashboard/plan', 'Pack & billing', Icons.credit_card_outlined),
];

const _adminTabs = [('/dashboard/security', 'Security', Icons.shield_outlined), ('/dashboard/ai', 'AI Control Center', Icons.auto_awesome_outlined)];

/// Dashboard frame in the style of ChatGPT: a calm sidebar on the left (sections, account at the bottom),
/// one centered column for the content. On a phone the sections become a scrolling row.
class DashboardShell extends ConsumerWidget {
  const DashboardShell({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final user = ref.watch(authProvider).user;
    final path = GoRouterState.of(context).uri.path.replaceFirst(RegExp(r'^/[a-z]{2}'), '');
    final items = [..._tabs, if (user?.isAdmin ?? false) ..._adminTabs];
    final wide = context.width >= 900;

    Widget item((String, String, IconData) t) {
      final on = path == t.$1;
      return Lnk(
        to: t.$1,
        child: Container(
          margin: const EdgeInsets.only(bottom: 2),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: BoxDecoration(color: on ? (Theme.of(context).brightness == Brightness.light ? Neutral.c200 : Neutral.c800) : Colors.transparent, borderRadius: BorderRadius.circular(10)),
          child: Row(children: [
            Icon(t.$3, size: 18, color: on ? c.fg : c.muted),
            const SizedBox(width: 10),
            Expanded(child: Text(context.t(t.$2), style: TextStyle(fontSize: 14, fontWeight: on ? FontWeight.w600 : FontWeight.w400, color: on ? c.fg : c.muted))),
          ]),
        ),
      );
    }

    final content = Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 860),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: wide ? 40 : 16, vertical: wide ? 40 : 20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(context.t(items.firstWhere((t) => t.$1 == path, orElse: () => ('', path == '/dashboard/settings' ? 'Settings' : 'Dashboard', Icons.circle)).$2), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w500, letterSpacing: -.4)),
            const SizedBox(height: 24),
            child,
          ]),
        ),
      ),
    );

    if (!wide) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(children: [for (final t in [...items, ('/dashboard/settings', 'Settings', Icons.settings_outlined)]) Padding(padding: const EdgeInsets.only(right: 6), child: IntrinsicWidth(child: item(t)))]),
        ),
        content,
      ]);
    }

    final minH = MediaQuery.sizeOf(context).height - Ca7Theme.headerHeight - 40;
    final sidebar = Container(
      width: 264,
      constraints: BoxConstraints(minHeight: minH),
      decoration: BoxDecoration(color: c.card, border: Border(right: BorderSide(color: c.border))),
      padding: const EdgeInsets.all(12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(padding: const EdgeInsets.fromLTRB(12, 8, 12, 12), child: Text('DASHBOARD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 1.4, color: c.faint))),
        for (final t in items) item(t),
        const SizedBox(height: 24),
        Divider(color: c.border),
        // the account: settings and log out live here, not in the navbar
        Lnk(
          to: '/dashboard/settings',
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: path == '/dashboard/settings' ? (Theme.of(context).brightness == Brightness.light ? Neutral.c200 : Neutral.c800) : Colors.transparent, borderRadius: BorderRadius.circular(10)),
            child: Row(children: [
              CircleAvatar(radius: 14, backgroundColor: Neutral.c800, child: Text((user?.displayName ?? '?').characters.first.toUpperCase(), style: const TextStyle(fontSize: 12, color: Colors.white))),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user?.displayName ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                Text('${(user?.plan ?? 'free')[0].toUpperCase()}${(user?.plan ?? 'free').substring(1)} · ${context.t('Settings')}', style: TextStyle(fontSize: 11, color: c.muted)),
              ])),
              Icon(Icons.settings_outlined, size: 16, color: c.muted),
            ]),
          ),
        ),
      ]),
    );

    // (no IntrinsicHeight: pages with a LayoutBuilder do not support it)
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [sidebar, Expanded(child: content)]);
  }
}
