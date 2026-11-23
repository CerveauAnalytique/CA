import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/day_night_switch.dart';
import '../../core/widgets/lnk.dart';
import '../theme/colors.dart';

const _links = [('/shop', 'Shop'), ('/models', 'AI Models'), ('/datasets', 'Datasets'), ('/pricing', 'Pricing'), ('/research', 'Research'), ('/api', 'API'), ('/docs', 'Docs')];

/// Slide-in menu for phones (the website's MobileMenu sheet).
class MobileMenu extends ConsumerWidget {
  const MobileMenu({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final user = ref.watch(authProvider).user;
    final dark = ref.watch(themeModeProvider) == ThemeMode.dark;
    void close() => Navigator.of(context).maybePop();
    Widget chip(String label, String to) => Lnk(to: to, onTap: close, child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: c.bg, borderRadius: BorderRadius.circular(99)), child: Text(context.t(label), style: const TextStyle(fontSize: 13))));
    return Drawer(
      backgroundColor: c.bg,
      width: 320,
      child: SafeArea(
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Align(alignment: Alignment.centerRight, child: IconButton(tooltip: context.t('Close menu'), onPressed: close, icon: const Icon(Icons.close))),
          for (final l in _links) Lnk(to: l.$1, onTap: close, child: Padding(padding: const EdgeInsets.symmetric(vertical: 12), child: Text(context.t(l.$2), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w400)))),
          const SizedBox(height: 16),
          Lnk(to: '/chat-ca7', onTap: close, child: Container(height: 44, alignment: Alignment.center, decoration: BoxDecoration(color: c.primaryBg, borderRadius: BorderRadius.circular(99)), child: Text(context.t('Start chat'), style: TextStyle(color: c.primaryFg, fontWeight: FontWeight.w500)))),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(16)),
            child: user != null
                ? Wrap(spacing: 8, runSpacing: 8, children: [
                    chip('Dashboard', '/dashboard'),
                    chip('Account', '/dashboard/settings'),
                  ])
                : chip('Log in', '/login'),
          ),
          const SizedBox(height: 16),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(context.t('Appearance'), style: TextStyle(color: c.muted, fontSize: 14)),
            DayNightSwitch(dark: dark, label: context.t('Appearance'), onChanged: (v) => ref.read(themeModeProvider.notifier).state = v ? ThemeMode.dark : ThemeMode.light),
          ]),
        ]),
      ),
    );
  }
}
