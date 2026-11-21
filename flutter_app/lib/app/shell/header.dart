import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/dot_icon.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import '../theme/colors.dart';
import '../theme/theme.dart';
import '../../features/shop/shop_data.dart';
import 'search_dialog.dart';

const _explore = [
  ('/shop', 'Shop', 'Apps and tools for CA7', 'shop'),
  ('/models', 'AI Models', 'Models for your IoT and company data', 'models'),
  ('/datasets', 'Datasets', 'Data from IoT devices, sensors and logs', 'datasets'),
];

/// The fixed 56 px navbar of the website.
class SiteHeader extends ConsumerWidget implements PreferredSizeWidget {
  const SiteHeader({super.key, required this.onMenu});
  final VoidCallback onMenu;
  @override
  Size get preferredSize => const Size.fromHeight(Ca7Theme.headerHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final path = GoRouterState.of(context).uri.path.replaceFirst(RegExp(r'^/[a-z]{2}'), '');
    final mobile = context.isMobile;
    final pad = mobile ? 12.0 : ((context.width - Ca7Theme.maxWidth) / 2 + 24).clamp(24.0, 9999.0);

    Widget nav(String label, String to, {bool exact = false}) {
      final active = exact ? path == to : path.startsWith(to);
      return Lnk(
        to: to,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(6)),
          child: Text(context.t(label), style: TextStyle(fontSize: 13, color: active ? c.fg : c.muted)),
        ),
      );
    }

    final startBtn = Lnk(
      to: '/chat-ca7',
      child: Container(
        height: 32,
        padding: EdgeInsets.symmetric(horizontal: mobile ? 12 : 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(color: c.primaryBg, borderRadius: BorderRadius.circular(8)),
        child: Text(context.t('Start chat'), style: TextStyle(color: c.primaryFg, fontSize: 13, fontWeight: FontWeight.w500)),
      ),
    );

    Widget iconBtn(IconData i, String tip, VoidCallback onTap) => Tooltip(
          message: tip,
          child: InkWell(borderRadius: BorderRadius.circular(18), onTap: onTap, child: SizedBox(width: 36, height: 36, child: Icon(i, size: 18, color: c.muted))),
        );

    return Container(
      height: Ca7Theme.headerHeight,
      padding: EdgeInsets.symmetric(horizontal: pad),
      decoration: BoxDecoration(color: c.header, border: Border(bottom: BorderSide(color: c.border))),
      child: Row(children: [
        Lnk(to: '/', child: Padding(padding: EdgeInsetsDirectional.only(end: mobile ? 8 : 32), child: const Ca7Logo())),
        if (!mobile) ...[
          const _ExploreMenu(),
          nav('Pricing', '/pricing'),
          nav('Research', '/research'),
          nav('API', '/api', exact: true),
          nav('Docs', '/docs'),
          const SizedBox(width: 20),
          GestureDetector(
            onTap: () => openSearch(context),
            child: MouseRegion(
              cursor: SystemMouseCursors.click,
              child: Container(
                width: 230,
                height: 32,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(color: c.inputBg, border: Border.all(color: c.border.withValues(alpha: .08)), borderRadius: BorderRadius.circular(8)),
                child: Row(children: [
                  Icon(Icons.search, size: 14, color: c.muted),
                  const SizedBox(width: 8),
                  Expanded(child: Text(context.t('Search docs, research, products…'), overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, color: c.faint))),
                  Text('⌘K', style: TextStyle(fontSize: 10, color: c.faint)),
                ]),
              ),
            ),
          ),
        ],
        const Spacer(),
        if (!mobile) ...[
          iconBtn(Icons.storefront_outlined, context.t('Marketplace & Enterprise Models'), () => context.goL('/marketplace')),
          iconBtn(Icons.support_outlined, context.t('Help center'), () => context.goL('/support')),
          const SizedBox(width: 4),
          if (user != null) ...[
            Lnk(to: '/dashboard/settings', child: Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Row(children: [
              CircleAvatar(radius: 10, backgroundColor: Neutral.c800, child: const Icon(Icons.person, size: 12, color: Neutral.c300)),
              const SizedBox(width: 8),
              Text(user.displayName, style: TextStyle(fontSize: 13, color: c.muted)),
            ]))),
            TextButton.icon(onPressed: () async { await ref.read(authProvider).logout(); if (context.mounted) context.goL('/'); }, icon: const Icon(Icons.logout, size: 14), label: Text(context.t('Log out'), style: const TextStyle(fontSize: 12)), style: TextButton.styleFrom(foregroundColor: c.muted)),
          ] else
            Lnk(to: '/login', child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Text(context.t('Log in'), style: TextStyle(fontSize: 13, color: c.muted)))),
          const SizedBox(width: 8),
        ],
        const _CartButton(),
        startBtn,
        if (!mobile) ...[
          const SizedBox(width: 8),
          iconBtn(Theme.of(context).brightness == Brightness.dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, context.t('Appearance'), () => ref.read(themeModeProvider.notifier).state = Theme.of(context).brightness == Brightness.dark ? ThemeMode.light : ThemeMode.dark),
        ],
        if (mobile) ...[
          const SizedBox(width: 8),
          iconBtn(Icons.search, context.t('Search docs, research, products…'), () => openSearch(context)),
          iconBtn(Icons.menu, context.t('Open menu'), onMenu),
        ],
      ]),
    );
  }
}

class _ExploreMenu extends StatefulWidget {
  const _ExploreMenu();
  @override
  State<_ExploreMenu> createState() => _ExploreMenuState();
}

class _ExploreMenuState extends State<_ExploreMenu> {
  final _ctl = MenuController();
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    return MenuAnchor(
      controller: _ctl,
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(c.bg),
        elevation: const WidgetStatePropertyAll(8),
        shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: c.border.withValues(alpha: .1)))),
        padding: const WidgetStatePropertyAll(EdgeInsets.all(8)),
      ),
      menuChildren: [
        Row(mainAxisSize: MainAxisSize.min, children: [
          for (final i in _explore)
            InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () { _ctl.close(); context.goL(i.$1); },
              child: Container(
                width: 168,
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SvgPicture.asset('assets/nav/${i.$4}.svg', width: 96, height: 96),
                  const SizedBox(height: 8),
                  Text(context.t(i.$2), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(context.t(i.$3), style: TextStyle(fontSize: 12, color: c.muted, height: 1.35)),
                ]),
              ),
            ),
        ]),
      ],
      builder: (_, ctl, __) => GestureDetector(
        onTap: () => ctl.isOpen ? ctl.close() : ctl.open(),
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(children: [
              Text(context.t('Explore'), style: TextStyle(fontSize: 13, color: c.muted)),
              const Icon(Icons.keyboard_arrow_down, size: 14, color: Color(0xFF555555)),
            ]),
          ),
        ),
      ),
    );
  }
}


/// Cart icon with the number of items (the website's CART button).
class _CartButton extends ConsumerWidget {
  const _CartButton();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final n = ref.watch(cartProvider).cart?.count ?? 0;
    final c = context.ca;
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Lnk(
        to: '/cart',
        child: Tooltip(
          message: context.t('Cart'),
          child: SizedBox(
            height: 32,
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.shopping_cart_outlined, size: 16, color: c.muted),
              if (n > 0) Padding(padding: const EdgeInsets.only(left: 4), child: Text('$n', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.fg))),
            ]),
          ),
        ),
      ),
    );
  }
}
