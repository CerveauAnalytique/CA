import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:ca7_app/app/theme/theme.dart';
import 'package:ca7_app/core/i18n/i18n.dart';
import 'package:ca7_app/features/home/home_page.dart';

void main() {
  for (final w in [1280.0, 390.0]) {
    testWidgets('home page builds without errors at width $w', (tester) async {
      tester.view.physicalSize = Size(w, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final router = GoRouter(routes: [GoRoute(path: '/', builder: (c, s) => const Scaffold(body: SingleChildScrollView(child: HomePage())))]);
      await tester.pumpWidget(ProviderScope(child: MaterialApp.router(routerConfig: router, theme: Ca7Theme.light(), builder: (c, x) => I18nScope(notifier: I18n(), child: x!))));
      await tester.pump(const Duration(milliseconds: 500));
      expect(tester.takeException(), isNull);
      expect(find.text('Ask questions to your own data'), findsOneWidget);
      expect(find.text('Camera Intelligence'), findsWidgets);
    });
  }
}
