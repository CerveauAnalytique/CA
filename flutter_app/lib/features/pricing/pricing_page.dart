import 'package:flutter/material.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/dot_icon.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import 'plans.dart';

class PricingPage extends StatelessWidget {
  const PricingPage({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final w = context.width;
    final cols = w >= Bp.xl ? 5 : (w >= Bp.md ? 2 : 1);
    return Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 64 : 48),
      child: Column(children: [
        Eyebrow(context.t('Pricing')),
        const SizedBox(height: 12),
        Text(context.t('Choose your pack'), textAlign: TextAlign.center, style: TextStyle(fontSize: (w * .04).clamp(30.0, 48.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
        const SizedBox(height: 12),
        ConstrainedBox(constraints: const BoxConstraints(maxWidth: 576), child: Muted(context.t('Start free, build as a hobby, or run CA7 across your company.'), size: 15, center: true)),
        const SizedBox(height: 48),
        LayoutBuilder(builder: (_, box) {
          const gap = 16.0;
          final cw = (box.maxWidth - gap * (cols - 1)) / cols;
          // cards in a row have the same height (CSS grid), so the buttons line up
          return Column(children: [
            for (var i = 0; i < plans.length; i += cols)
              Padding(
                padding: EdgeInsets.only(top: i == 0 ? 0 : gap),
                child: IntrinsicHeight(
                  child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    for (var j = i; j < i + cols; j++) ...[
                      if (j > i) const SizedBox(width: gap),
                      SizedBox(width: cw, child: j < plans.length ? _PlanCard(plans[j]) : const SizedBox()),
                    ],
                  ]),
                ),
              ),
          ]);
        }),
        const SizedBox(height: 32),
        Wrap(alignment: WrapAlignment.center, children: [
          Text('${context.t('Hobby prices include VAT. Other prices are excluded VAT.')} ', style: TextStyle(fontSize: 13, color: c.muted)),
          Lnk(to: '/contact', child: Text(context.t('Need something different? Contact us.'), style: TextStyle(fontSize: 13, color: c.muted, decoration: TextDecoration.underline))),
        ]),
      ]),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard(this.p);
  final Plan p;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: p.highlight ? (dark ? const Color(0x661E3A8A) : Brand.blue50) : c.card,
        borderRadius: BorderRadius.circular(24),
        border: p.highlight ? Border.all(color: dark ? const Color(0x663B82F6) : Brand.blue200) : null,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Padding(padding: const EdgeInsets.all(8), child: DotIcon(p.icon, size: 72)),
          if (p.highlight) Flexible(child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: Brand.blue, borderRadius: BorderRadius.circular(99)), child: Text(context.t('Most popular'), overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.white)))),
        ]),
        const SizedBox(height: 16),
        Text(context.t(p.name), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, letterSpacing: -.3)),
        const SizedBox(height: 4),
        Text(context.t(p.tagline), style: TextStyle(fontSize: 13, color: c.muted, height: 1.4)),
        const SizedBox(height: 24),
        Wrap(crossAxisAlignment: WrapCrossAlignment.end, spacing: 8, children: [
          if (p.from) Text(context.t('from'), style: TextStyle(fontSize: 13, color: c.muted)),
          Text('€${formatPrice(p.price)}', style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w300, height: 1, letterSpacing: -1)),
          if (p.price > 0) Text(context.t('per month'), style: TextStyle(fontSize: 13, color: c.muted)),
        ]),
        SizedBox(height: 24, child: Padding(padding: const EdgeInsets.only(top: 4), child: Text(p.vat == 'excl' ? context.t('excl. VAT') : (p.vat == 'incl' ? context.t('incl. VAT') : ''), style: TextStyle(fontSize: 12, color: c.faint)))),
        const SizedBox(height: 20),
        Lnk(
          to: p.href,
          child: Container(height: 48, alignment: Alignment.center, decoration: BoxDecoration(color: p.highlight ? Brand.blue : c.primaryBg, borderRadius: BorderRadius.circular(99)), child: Text(context.t(p.cta), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: p.highlight ? Colors.white : c.primaryFg))),
        ),
        const SizedBox(height: 28),
        for (final f in p.features)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Padding(padding: EdgeInsets.only(top: 2), child: Icon(Icons.check, size: 16, color: Brand.dot)),
              const SizedBox(width: 10),
              Expanded(child: Text(context.t(f), style: TextStyle(fontSize: 14, height: 1.4, color: dark ? Neutral.c300 : Neutral.c700))),
            ]),
          ),
      ]),
    );
  }
}
