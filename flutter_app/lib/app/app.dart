import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/i18n/i18n.dart';
import '../core/providers.dart';
import '../features/shop/shop_data.dart';
import 'router.dart';
import 'theme/theme.dart';

class Ca7App extends ConsumerStatefulWidget {
  const Ca7App({super.key});
  @override
  ConsumerState<Ca7App> createState() => _Ca7AppState();
}

class _Ca7AppState extends ConsumerState<Ca7App> {
  late final GoRouter _router = createRouter(ref);

  @override
  void initState() {
    super.initState();
    // ca7.nl and ca7.be start in Dutch
    if (kIsWeb && (Uri.base.host.endsWith('.nl') || Uri.base.host.endsWith('.be'))) ref.read(i18nProvider).setLang('nl');
    ref.read(authProvider).restore();
    ref.read(cartProvider).load();
  }

  @override
  Widget build(BuildContext context) {
    final i18n = ref.watch(i18nProvider);
    final mode = ref.watch(themeModeProvider);
    return MaterialApp.router(
      title: 'CA7',
      debugShowCheckedModeBanner: false,
      theme: Ca7Theme.light(),
      darkTheme: Ca7Theme.dark(),
      themeMode: mode,
      routerConfig: _router,
      builder: (context, child) => I18nScope(
        notifier: i18n,
        child: Directionality(textDirection: i18n.rtl ? TextDirection.rtl : TextDirection.ltr, child: child ?? const SizedBox()),
      ),
    );
  }
}
