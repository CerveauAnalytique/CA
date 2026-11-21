import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/i18n/i18n.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import '../theme/colors.dart';
import '../../core/providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _columns = <String, List<(String, String)>>{
  'Products': [('Products Shop', '/shop'), ('Neural Engine', '/research'), ('API Access', '/api'), ('Analytics Workspace', '/dashboard'), ('Pricing', '/pricing')],
  'Platform': [('Carbon API', '/docs/carbon'), ('Search API', '/docs/search'), ('Predictive API', '/docs/predict'), ('SDKs & Libraries', '/sdks')],
  'Resources': [('Documentation', '/docs'), ('Quickstart', '/docs/quickstart'), ('Community', '/community'), ('System Status', '/status')],
  'Company': [('About Us', '/about'), ('Careers', '/careers'), ('Privacy Policy', '/privacy'), ('Terms of Service', '/terms')],
};
const _legal = [('Privacy Policy', '/privacy'), ('Terms of Service', '/terms'), ('Security', '/security'), ('Cookie Policy', '/cookies')];
const _payments = [('ideal', 'iDEAL'), ('bancontact', 'Bancontact'), ('visa', 'Visa'), ('mastercard', 'Mastercard'), ('amex', 'American Express'), ('applepay', 'Apple Pay'), ('paypal', 'PayPal'), ('sepa', 'SEPA')];

/// Footer of the website: languages, link columns, payment methods, legal.
class SiteFooter extends ConsumerWidget {
  const SiteFooter({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final link = TextStyle(fontSize: 13, color: c.muted);
    final line = BorderSide(color: c.border.withValues(alpha: .12));
    final cols = _columns.entries.map((e) => SizedBox(
          width: context.isMobile ? (context.width - 48 - 24) / 2 : (ca7Max - 48 - 72) / 4,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(context.t(e.key), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.muted))),
            for (final l in e.value) Padding(padding: const EdgeInsets.only(bottom: 6), child: Lnk(to: l.$2, child: Text(context.t(l.$1), style: link))),
          ]),
        ));

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(color: c.footer, border: Border(top: BorderSide(color: c.border.withValues(alpha: .1)))),
      child: Container1280(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final l in languages)
              GestureDetector(
                onTap: () => _switch(context, ref, l.code),
                child: MouseRegion(
                  cursor: SystemMouseCursors.click,
                  child: Text(l.name, style: TextStyle(fontSize: 12, color: context.lang == l.code ? c.fg : c.muted, fontWeight: context.lang == l.code ? FontWeight.w600 : FontWeight.w400)),
                ),
              ),
          ]),
          const SizedBox(height: 16),
          Container(decoration: BoxDecoration(border: Border(top: line)), padding: const EdgeInsets.symmetric(vertical: 16), child: Wrap(spacing: 24, runSpacing: 24, children: cols.toList())),
          Container(
            decoration: BoxDecoration(border: Border(top: line)),
            padding: const EdgeInsets.symmetric(vertical: 16),
            width: double.infinity,
            child: Wrap(crossAxisAlignment: WrapCrossAlignment.center, spacing: 16, runSpacing: 12, children: [
              Text(context.t('Secure payments with Mollie and Stripe'), style: TextStyle(fontSize: 12, color: c.muted)),
              for (final p in _payments) SvgPicture.asset('assets/payments/${p.$1}.svg', height: 28, semanticsLabel: p.$2),
            ]),
          ),
          Container(
            decoration: BoxDecoration(border: Border(top: line)),
            padding: const EdgeInsets.only(top: 16),
            width: double.infinity,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Wrap(spacing: 16, runSpacing: 4, children: [for (final l in _legal) Lnk(to: l.$2, child: Text(context.t(l.$1), style: link))]),
              const SizedBox(height: 12),
              Text(context.t('Cerveau Analytique © 2026'), style: TextStyle(fontSize: 12, color: c.muted)),
            ]),
          ),
        ]),
      ),
    );
  }
}


void _switch(BuildContext context, WidgetRef ref, String code) {
  final path = GoRouterStateHelper.restOfPath(context);
  ref.read(i18nProvider).setLang(code);
  context.go(code == 'en' && path.isEmpty ? '/en' : '/$code$path');
}

/// Keeps the page when the language changes: /nl/pricing -> /de/pricing.
class GoRouterStateHelper {
  static String restOfPath(BuildContext context) {
    final loc = GoRouter.of(context).routeInformationProvider.value.uri.path;
    final m = RegExp(r'^/[a-z]{2}(/.*)?$').firstMatch(loc);
    return m?.group(1) ?? '';
  }
}
