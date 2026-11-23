import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/responsive.dart';
import '../dashboard/limits.dart';
import 'api_hub.dart';

/// /api: the BAPI artwork (white in light mode, deep navy in dark mode), the API calls of every pack, and the
/// newest APIs of the API Hub.
class ApiPage extends StatelessWidget {
  const ApiPage({super.key});
  @override
  Widget build(BuildContext context) => const Column(children: [_Hero(), _Numbers(), _HubPreview()]);
}

// ---- hero ---------------------------------------------------------------------------------------------------------

class _Hero extends StatelessWidget {
  const _Hero();
  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final bg = dark ? const Color(0xFF05041F) : Colors.white;
    final fg = dark ? Colors.white : Neutral.c900;
    final desktop = context.isDesktop;
    final h = desktop ? math.max(620.0, math.min(MediaQuery.sizeOf(context).height - 56, 820.0)) : 560.0;
    final big = desktop ? (context.width * .1).clamp(110.0, 190.0) : 96.0;
    // B big, then every letter a bit smaller and higher (like the artwork)
    const letters = [('B', 1.0, 0.0), ('A', .72, .06), ('P', .58, .0), ('I', .44, .02)];
    final word = Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      for (var i = 0; i < letters.length; i++)
        Padding(
          padding: EdgeInsetsDirectional.only(start: i == 0 ? 0 : big * .32, top: big * letters[i].$3),
          child: Text(letters[i].$1, style: TextStyle(fontSize: big * letters[i].$2, fontWeight: FontWeight.w800, height: 1, color: fg)),
        ),
    ]);
    return Container(
      width: double.infinity,
      height: h,
      color: bg,
      child: Stack(children: [
        Positioned.fill(child: RepaintBoundary(child: CustomPaint(painter: _Shapes(bg: bg, dark: dark, mobile: !desktop)))),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
              Semantics(label: 'BAPI', child: ExcludeSemantics(child: word)),
              const SizedBox(height: 20),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 260),
                child: Text(context.t('Connect, publish and use APIs on one platform.'), textAlign: TextAlign.end, style: TextStyle(fontSize: 15, height: 1.45, color: fg.withValues(alpha: .85))),
              ),
              const SizedBox(height: 28),
              Wrap(spacing: 10, runSpacing: 10, alignment: WrapAlignment.end, children: [
                hubPill(context, 'Get an API key', '/dashboard/api'),
                hubPill(context, 'Open the API Hub', '/api/hub', dark: false),
              ]),
            ]),
          ),
        ),
      ]),
    );
  }
}

/// One shape of the artwork. Positions are fractions of the hero; `pill` rounds the short side fully, `oval`
/// draws an ellipse. `fade` lets the color run out into the background (towards the end of the gradient).
class _S {
  const _S(this.l, this.t, this.r, this.b, this.colors, {this.kind = 'rect', this.vertical = true, this.fade = false});
  final double l, t, r, b;
  final List<Color> colors;
  final String kind;
  final bool vertical, fade;
}

const _blue = Color(0xFF3A4BF0), _blueLight = Color(0xFF6F86FF), _pink = Color(0xFFF472D0), _purple = Color(0xFF8B3FE0);
const _yellow = Color(0xFFFFCC1F), _cream = Color(0xFFFFF1B0), _green = Color(0xFF0E8A5A), _lime = Color(0xFF8DBA0A), _sky = Color(0xFFDCE6FF);

const _shapes = [
  // left
  _S(.07, .12, .14, 1.05, [_blue, _blue], fade: true),
  _S(.14, -.05, .28, .12, [_pink, _purple]),
  _S(.14, .78, .28, 1.05, [_pink, _purple]),
  _S(.075, .07, .28, .17, [_blueLight, _blue], kind: 'pill', vertical: false),
  _S(-.09, .53, .13, .81, [_blueLight, _sky], kind: 'oval'),
  _S(.07, .53, .28, .81, [_yellow, _cream], kind: 'oval'),
  _S(.0, .62, .21, .72, [Color(0xFF05041F), _green, _lime], kind: 'pill', vertical: false),
  // top middle
  _S(.615, -.05, .66, .36, [_blue, _blue], fade: true),
  // right
  _S(.755, .3, .86, 1.05, [_blue, _blue], fade: true),
  _S(.755, .17, .96, .46, [_blue, _blueLight], kind: 'oval'),
  _S(.89, .17, 1.1, .45, [_yellow, _cream], kind: 'oval'),
  _S(.96, .45, 1.0, .9, [_pink, _purple]),
  _S(.825, .265, 1.05, .36, [Color(0xFF05041F), _green, _lime], kind: 'pill', vertical: false),
  // bottom middle
  _S(.545, .86, .75, 1.05, [_blue, _blue], fade: true),
  _S(.545, .80, .75, .89, [_blueLight, _blue], kind: 'pill', vertical: false),
];

class _Shapes extends CustomPainter {
  _Shapes({required this.bg, required this.dark, required this.mobile});
  final Color bg;
  final bool dark, mobile;

  @override
  void paint(Canvas canvas, Size size) {
    final rnd = math.Random(11);
    for (final s in _shapes) {
      // phones: only the outer shapes, so the word stays free
      if (mobile && s.l > .3 && s.r < .75) continue;
      final r = Rect.fromLTRB(s.l * size.width, s.t * size.height, s.r * size.width, s.b * size.height);
      final path = Path();
      switch (s.kind) {
        case 'oval':
          path.addOval(r);
        case 'pill':
          path.addRRect(RRect.fromRectAndRadius(r, Radius.circular(math.min(r.width, r.height) / 2)));
        default:
          path.addRect(r);
      }
      // the light mode artwork drops the dark start color of the green pills
      final colors = !dark && s.colors.first == const Color(0xFF05041F) ? [_green.withValues(alpha: .15), ...s.colors.skip(1)] : s.colors;
      final fill = s.fade ? [colors.first, colors.first.withValues(alpha: .7), bg] : colors;
      final paint = Paint()
        ..shader = LinearGradient(
          begin: s.vertical ? Alignment.topCenter : Alignment.centerLeft,
          end: s.vertical ? Alignment.bottomCenter : Alignment.centerRight,
          colors: fill,
        ).createShader(r);
      canvas.drawPath(path, paint);
      // soft shadow at the side, like the depth in the artwork
      if (s.kind == 'rect') {
        canvas.drawPath(path, Paint()..shader = LinearGradient(colors: [Colors.transparent, (dark ? Colors.black : _purple).withValues(alpha: dark ? .45 : .12)]).createShader(r));
      }
      // grain: tiny light dots inside the shape
      canvas.save();
      canvas.clipPath(path);
      final n = math.min(3500, (r.width * r.height * .018).round());
      final dot = Paint();
      for (var i = 0; i < n; i++) {
        final x = r.left + rnd.nextDouble() * r.width, y = r.top + rnd.nextDouble() * r.height;
        dot.color = (rnd.nextBool() ? Colors.white : Colors.black).withValues(alpha: .05 + rnd.nextDouble() * .18);
        canvas.drawCircle(Offset(x, y), .6 + rnd.nextDouble() * .7, dot);
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _Shapes old) => old.dark != dark || old.mobile != mobile || old.bg != bg;
}

// ---- API calls per pack (the "breakdown" rows) ----------------------------------------------------------------

String _short(double n) {
  if (n >= 1e6) return '${(n / 1e6).toStringAsFixed(n % 1e6 == 0 ? 0 : 1)}M';
  if (n >= 1e3) return '${(n / 1e3).toStringAsFixed(n % 1e3 == 0 ? 0 : 1)}K';
  return n.toStringAsFixed(0);
}

class _Numbers extends StatelessWidget {
  const _Numbers();
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final desktop = context.isDesktop;
    final fs = (context.width * .034).clamp(30.0, 50.0);
    // (pack, color of the number, light tint, height of the row on desktop)
    const rows = [
      ('business', 'Business pack', Color(0xFF9B2FAE), Color(0xFFF6E8F5), 290.0),
      ('pro', 'Pro pack', Color(0xFF1F3B3B), Color(0xFFE8ECEC), 260.0),
      ('hobby', 'Hobby pack', Color(0xFF6C5CE7), Color(0xFFF0EEFC), 180.0),
      ('free', 'Free pack', Color(0xFF3D5A48), Color(0xFFF4FBF6), 96.0),
    ];
    final text = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      LineEyebrow(context.t('API calls per month'), color: const Color(0xFF6C5CE7)),
      const SizedBox(height: 40),
      Text(context.t('How many API calls every pack includes'), style: TextStyle(fontSize: fs, fontWeight: FontWeight.w500, height: 1.18, letterSpacing: -fs * .03, color: c.fg)),
      const SizedBox(height: 20),
      Text(context.t('Every call to the CA7 API counts. Enterprise has no limit. You see your use in the dashboard.'), style: TextStyle(fontSize: 15, height: 1.6, color: c.muted)),
      const SizedBox(height: 28),
      hubPill(context, 'Compare the packs', '/pricing', dark: false),
    ]);
    final list = Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      for (final r in rows)
        Container(
          constraints: BoxConstraints(minHeight: desktop ? r.$5 : 88),
          color: dark ? r.$3.withValues(alpha: .14) : r.$4,
          padding: EdgeInsets.symmetric(horizontal: desktop ? 44 : 22, vertical: 22),
          alignment: AlignmentDirectional.topStart,
          child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            SizedBox(
              width: desktop ? 190 : 110,
              child: Text(_short(limits[r.$1]!.apiCalls), textAlign: TextAlign.end, style: TextStyle(fontSize: desktop ? 64 : 40, fontWeight: FontWeight.w500, height: 1, letterSpacing: -2, color: dark ? Color.lerp(r.$3, Colors.white, .45) : r.$3)),
            ),
            const SizedBox(width: 20),
            Expanded(child: Text(context.t(r.$2), style: TextStyle(fontSize: desktop ? 22 : 16, color: c.muted))),
          ]),
        ),
    ]);
    return Container(
      width: double.infinity,
      color: c.bg,
      child: Container1280(
        padding: EdgeInsets.fromLTRB(24, desktop ? 0 : 56, 24, desktop ? 0 : 40),
        child: desktop
            ? IntrinsicHeight(
                child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Expanded(flex: 5, child: Padding(padding: const EdgeInsetsDirectional.only(top: 72, end: 56, bottom: 72), child: text)),
                  Expanded(flex: 8, child: list),
                ]),
              )
            : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [text, const SizedBox(height: 32), list]),
      ),
    );
  }
}

// ---- newest APIs of the hub -----------------------------------------------------------------------------------

class _HubPreview extends ConsumerWidget {
  const _HubPreview();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final latest = ref.watch(latestApisProvider);
    final fs = (context.width * .034).clamp(30.0, 50.0);
    return Container(
      width: double.infinity,
      color: c.card,
      child: Container1280(
        padding: EdgeInsets.fromLTRB(24, context.isDesktop ? 96 : 64, 24, context.isDesktop ? 112 : 72),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          LineEyebrow(context.t('API Hub')),
          const SizedBox(height: 28),
          Wrap(spacing: 24, runSpacing: 20, crossAxisAlignment: WrapCrossAlignment.end, alignment: WrapAlignment.spaceBetween, children: [
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 620),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(context.t('APIs from companies like yours'), style: TextStyle(fontSize: fs, fontWeight: FontWeight.w500, height: 1.15, letterSpacing: -fs * .03, color: c.fg)),
                const SizedBox(height: 14),
                Text(context.t('Publish your own API with its OpenAPI file, or find one to connect to CA7.'), style: TextStyle(fontSize: 15, height: 1.6, color: c.muted)),
              ]),
            ),
            Wrap(spacing: 10, runSpacing: 10, children: [hubPill(context, 'Publish your API', '/api/hub/new'), hubPill(context, 'View all APIs', '/api/hub', dark: false)]),
          ]),
          const SizedBox(height: 40),
          latest.when(
            loading: () => const Padding(padding: EdgeInsets.all(32), child: StateBox.loading()),
            error: (_, __) => cardGrid([ca7ApiCard(context)]),
            data: (items) => cardGrid([ca7ApiCard(context), for (final a in items) ApiCard.of(context, a)]),
          ),
        ]),
      ),
    );
  }
}
