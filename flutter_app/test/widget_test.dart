import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ca7_app/app/theme/theme.dart';
import 'package:ca7_app/core/i18n/i18n.dart';
import 'package:ca7_app/features/pricing/pricing_page.dart';

Widget _app(Widget child) => ProviderScope(
      child: MaterialApp(
        theme: Ca7Theme.light(),
        builder: (c, w) => I18nScope(notifier: I18n(), child: w!),
        home: Scaffold(body: SingleChildScrollView(child: child)),
      ),
    );

void main() {
  testWidgets('pricing page shows the five packs and the VAT note', (tester) async {
    tester.view.physicalSize = const Size(1440, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(_app(const PricingPage()));
    await tester.pump();
    for (final name in ['Free', 'Hobby', 'Pro', 'Business', 'Enterprise']) {
      expect(find.text(name), findsOneWidget);
    }
    expect(find.text('€1,500'), findsOneWidget);
    expect(find.text('Most popular'), findsOneWidget);
    expect(find.textContaining('Hobby prices include VAT'), findsOneWidget);
  });

  testWidgets('pricing page does not overflow on a phone', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(_app(const PricingPage()));
    await tester.pump();
    expect(tester.takeException(), isNull);
  });
}
