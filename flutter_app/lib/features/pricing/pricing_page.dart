import 'package:flutter/material.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/widgets/dot_icon.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import 'plans.dart';

/// Tint of every pack card (light mode) and its accent (dark mode tint and the badge).
const _tints = {
  'free': (Color(0xFFEFF2F6), Color(0xFF64748B)),
  'hobby': (Color(0xFFEEEAFC), Color(0xFF6C5CE7)),
  'pro': (Color(0xFFE5ECFF), Brand.dot),
  'business': (Color(0xFFFBF1E1), Color(0xFFD08A1E)),
  'enterprise': (Color(0xFFE2F4F7), Color(0xFF168CA0)),
};

/// A value in the compare table: true = included, false = not included, or a text.
typedef _V = Object;

/// The compare table (same facts as the pack lists in plans.dart and the limits in src/lib/limits.ts).
/// (label, tooltip or null, values for free, hobby, pro, business, enterprise)
const _sections = <(String, List<(String, String?, List<_V>)>)>[
  ('Data', [
    ('Connected data sources', 'Databases, REST APIs, CSV files, IoT devices and cameras.', ['3', '10', '50', 'Unlimited', 'Unlimited']),
    ('API calls per month', 'Every call to the CA7 API counts.', ['1,000', '50,000', '500,000', '5 million', 'Unlimited']),
    ('Data storage', null, [false, '5 GB', '50 GB', '500 GB', 'Custom']),
    ('Community AI models and datasets', null, [true, true, true, true, true]),
  ]),
  ('AI', [
    ('Your own AI models', 'AI models you build on your own data.', [false, '3', '10', 'Unlimited', 'Unlimited']),
    ('CA7 Chat on your own data', 'Ask questions in plain language and get answers from your data.', [false, false, true, true, true]),
    ('Anomaly detection', 'CA7 marks values that are unusual.', [false, false, true, true, true]),
    ('Automation', 'Send an e-mail or call a webhook when something happens in your data.', [false, false, false, true, true]),
  ]),
  ('Team and support', [
    ('Team accounts and roles', null, [false, false, false, true, true]),
    ('Support', null, ['Community', 'Email', 'Email', 'Priority', 'Dedicated contact']),
    ('Payment by invoice', null, [false, false, false, true, true]),
    ('Private environment', null, [false, false, false, false, true]),
    ('Custom connectors', null, [false, false, false, false, true]),
    ('Single sign-on', null, [false, false, false, false, true]),
  ]),
];

class PricingPage extends StatelessWidget {
  const PricingPage({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final w = context.width;
    final desktop = w >= Bp.xl;
    final fs = (w * .045).clamp(34.0, 60.0);
    final title = Text.rich(
      TextSpan(children: [
        TextSpan(text: '${context.t('Simple')} '),
        // the "&" in a script letter, like the design
        TextSpan(text: '&', style: TextStyle(fontFamily: 'Georgia', fontFamilyFallback: const ['Times New Roman', 'serif'], fontStyle: FontStyle.italic, fontWeight: FontWeight.w400, color: c.fg)),
        TextSpan(text: ' ${context.t('transparent pricing for every company size')}'),
      ]),
      style: TextStyle(fontSize: fs, fontWeight: FontWeight.w400, height: 1.12, letterSpacing: -fs * .025, color: c.fg),
    );

    // the table needs ~1180 px; smaller screens scroll it sideways with the first column fixed in view
    const tableWidth = 1180.0;
    final table = LayoutBuilder(builder: (_, box) {
      final width = box.maxWidth >= tableWidth ? box.maxWidth : tableWidth;
      final t = SizedBox(width: width, child: const _Table());
      return box.maxWidth >= tableWidth ? t : SingleChildScrollView(scrollDirection: Axis.horizontal, child: t);
    });

    return Container(
      width: double.infinity,
      color: c.bg,
      child: Container1280(
        padding: EdgeInsets.fromLTRB(24, desktop ? 72 : 48, 24, desktop ? 96 : 64),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ConstrainedBox(constraints: const BoxConstraints(maxWidth: 760), child: title),
          const SizedBox(height: 16),
          ConstrainedBox(constraints: const BoxConstraints(maxWidth: 560), child: Text(context.t('Start free, build as a hobby, or run CA7 across your company.'), style: TextStyle(fontSize: 16, height: 1.55, color: c.muted))),
          if (!desktop) Padding(padding: const EdgeInsets.only(top: 20), child: Row(children: [Icon(Icons.swipe_left_outlined, size: 16, color: c.faint), const SizedBox(width: 8), Text(context.t('Swipe to see every pack'), style: TextStyle(fontSize: 12.5, color: c.faint))])),
          SizedBox(height: desktop ? 56 : 28),
          table,
          const SizedBox(height: 32),
          Wrap(children: [
            Text('${context.t('Hobby prices include VAT. Other prices are excluded VAT.')} ', style: TextStyle(fontSize: 13, color: c.muted)),
            Lnk(to: '/contact', child: Text(context.t('Need something different? Contact us.'), style: TextStyle(fontSize: 13, color: c.muted, decoration: TextDecoration.underline))),
          ]),
        ]),
      ),
    );
  }
}

class _Table extends StatelessWidget {
  const _Table();
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    const labelFlex = 6, planFlex = 5, gap = 14.0;
    Widget row(Widget label, List<Widget> cells) => Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Expanded(flex: labelFlex, child: label),
          for (final cell in cells) ...[const SizedBox(width: gap), Expanded(flex: planFlex, child: cell)],
        ]);

    Widget value(_V v) {
      if (v == true) return Align(alignment: AlignmentDirectional.centerStart, child: Padding(padding: const EdgeInsetsDirectional.only(start: 18), child: Icon(Icons.check_circle_outline, size: 18, color: c.muted)));
      if (v == false) return Padding(padding: const EdgeInsetsDirectional.only(start: 22), child: Text('—', style: TextStyle(fontSize: 14, color: c.faint)));
      return Padding(padding: const EdgeInsetsDirectional.only(start: 18), child: Text(context.t('$v'), style: TextStyle(fontSize: 13.5, color: c.fg)));
    }

    Widget label(String text, String? tip) => Row(children: [
          Flexible(child: Text(context.t(text), style: TextStyle(fontSize: 13.5, color: c.fg))),
          if (tip != null) ...[
            const SizedBox(width: 6),
            Tooltip(message: context.t(tip), triggerMode: TooltipTriggerMode.tap, child: Icon(Icons.help_outline, size: 14, color: c.faint)),
          ],
        ]);

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Expanded(flex: labelFlex, child: SizedBox()),
        for (final p in plans) ...[const SizedBox(width: gap), Expanded(flex: planFlex, child: _PlanCard(p))],
      ])),
      const SizedBox(height: 28),
      for (final s in _sections) ...[
        Padding(
          padding: const EdgeInsets.only(top: 20, bottom: 10),
          child: Text(context.t(s.$1), style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, letterSpacing: .3, color: c.fg)),
        ),
        Container(height: 1, color: c.fg.withValues(alpha: .7)),
        for (final r in s.$2)
          Container(
            constraints: const BoxConstraints(minHeight: 52),
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.border))),
            child: row(label(r.$1, r.$2), [for (final v in r.$3) value(v)]),
          ),
      ],
    ]);
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard(this.p);
  final Plan p;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final (tint, accent) = _tints[p.id] ?? (c.card, Brand.dot);
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      decoration: BoxDecoration(
        color: dark ? accent.withValues(alpha: .14) : tint,
        borderRadius: BorderRadius.circular(14),
        border: p.highlight ? Border.all(color: accent.withValues(alpha: .55), width: 1.5) : null,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          DotIcon(p.icon, size: 52),
          const Spacer(),
          if (p.highlight)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
              decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(99)),
              child: Text(context.t('Most popular'), style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Colors.white)),
            ),
        ]),
        const SizedBox(height: 12),
        Text(context.t('{name} plan').replaceAll('{name}', context.t(p.name)), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.fg)),
        const SizedBox(height: 4),
        Text(context.t(p.tagline), style: TextStyle(fontSize: 12, height: 1.4, color: c.muted)),
        const Spacer(),
        const SizedBox(height: 20),
        if (p.from) Text(context.t('from'), style: TextStyle(fontSize: 12, color: c.muted)),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(padding: const EdgeInsets.only(top: 6), child: Text('€', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: c.fg))),
          const SizedBox(width: 2),
          Flexible(child: FittedBox(fit: BoxFit.scaleDown, alignment: AlignmentDirectional.centerStart, child: Text(formatPrice(p.price), style: TextStyle(fontSize: 44, fontWeight: FontWeight.w500, height: 1.05, letterSpacing: -1.5, color: c.fg)))),
        ]),
        const SizedBox(height: 4),
        Text(
          [if (p.price > 0) context.t('per month'), if (p.vat == 'excl') context.t('excl. VAT'), if (p.vat == 'incl') context.t('incl. VAT')].join(' · '),
          style: TextStyle(fontSize: 11.5, color: c.faint),
        ),
        const SizedBox(height: 16),
        Lnk(
          to: p.href,
          child: Container(
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: p.highlight ? accent : c.primaryBg, borderRadius: BorderRadius.circular(8)),
            child: Text(context.t(p.cta), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: p.highlight ? Colors.white : c.primaryFg)),
          ),
        ),
      ]),
    );
  }
}
