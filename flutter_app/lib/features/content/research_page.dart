import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/dot_icon.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import 'cms.dart';

/// Industries on the research page: (title, photo / dotted icon, height of the card).
/// The photo is `assets/research/<name>.jpg`; while it is missing the card shows the dotted icon `<icon>`.
const _industries = [
  ('SMEs', ('smes', 'team'), 430.0),
  ('Healthcare', ('healthcare', 'helpdesk'), 430.0),
  ('Insurance', ('insurance', 'security'), 220.0),
  ('Manufacturing', ('manufacturing', 'ops'), 420.0),
  ('Logistics', ('logistics', 'analytics'), 320.0),
  ('Retail', ('retail', 'shop'), 420.0),
  ('Energy and utilities', ('energy', 'sensor'), 420.0),
  ('Public sector', ('public-sector', 'datasets'), 300.0),
];

final _researchProvider = FutureProvider.autoDispose((ref) => ref.watch(cmsRepoProvider).sitePage('research'));

/// /research: headline on the start side, a staggered wall of industry cards that fades out at the top and
/// bottom, then the research articles from the database (site page `research`).
class ResearchPage extends ConsumerWidget {
  const ResearchPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(_researchProvider);
    return Column(children: [
      const _Hero(),
      page.when(
        loading: () => const Padding(padding: EdgeInsets.all(64), child: StateBox.loading()),
        error: (e, _) => Padding(padding: const EdgeInsets.all(24), child: StateBox.error('$e')),
        data: (d) => d == null ? const SizedBox.shrink() : _Articles(d),
      ),
    ]);
  }
}

class _Hero extends StatelessWidget {
  const _Hero();
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final desktop = context.isDesktop;
    final fs = (context.width * .036).clamp(34.0, 54.0);
    final text = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 80, height: 1.5, color: Brand.dot),
        const SizedBox(width: 10),
        Text(context.t('Identify the problem'), style: TextStyle(fontSize: 18, color: c.muted)),
      ]),
      const SizedBox(height: 40),
      Text(context.t('Illuminating the path to progress with artificial intelligence'), style: TextStyle(fontSize: fs, fontWeight: FontWeight.w500, height: 1.18, letterSpacing: -fs * .03, color: c.fg)),
      const SizedBox(height: 24),
      Text(context.t('Every industry has its own data and its own problems. Pick yours and see how CA7 turns that data into answers.'), style: TextStyle(fontSize: 15, height: 1.6, color: c.muted)),
    ]);
    return Container(
      width: double.infinity,
      color: c.bg,
      child: Container1280(
        padding: EdgeInsets.fromLTRB(24, desktop ? 0 : 40, 24, 0),
        child: desktop
            ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(flex: 4, child: Padding(padding: const EdgeInsetsDirectional.only(top: 80, end: 48), child: text)),
                const Expanded(flex: 7, child: _Wall(height: 860, columns: 3)),
              ])
            : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [text, const SizedBox(height: 32), const _Wall(height: 640, columns: 2)]),
      ),
    );
  }
}

/// Columns of cards, every second column shifted up, faded at the top and bottom.
class _Wall extends StatelessWidget {
  const _Wall({required this.height, required this.columns});
  final double height;
  final int columns;
  @override
  Widget build(BuildContext context) {
    final cols = List.generate(columns, (_) => <(String, (String, String), double)>[]);
    for (var i = 0; i < _industries.length; i++) {
      cols[i % columns].add(_industries[i]);
    }
    const gap = 20.0;
    return SizedBox(
      height: height,
      child: ShaderMask(
        blendMode: BlendMode.dstIn,
        shaderCallback: (r) => const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black, Colors.black, Colors.transparent],
          stops: [0, .06, .72, 1],
        ).createShader(r),
        child: ClipRect(
          child: OverflowBox(
            alignment: Alignment.topCenter,
            maxHeight: double.infinity,
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              for (var i = 0; i < columns; i++) ...[
                if (i > 0) const SizedBox(width: gap),
                Expanded(
                  child: Transform.translate(
                    // the middle column starts higher, like a staggered wall
                    offset: Offset(0, i.isOdd ? -180 : 30),
                    child: Column(children: [
                      for (final it in cols[i]) Padding(padding: const EdgeInsets.only(bottom: gap), child: _IndustryCard(it.$1, it.$2, it.$3)),
                    ]),
                  ),
                ),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}

class _IndustryCard extends StatefulWidget {
  const _IndustryCard(this.title, this.icon, this.height);
  final String title;
  final (String, String) icon; // (photo name, dotted icon)
  final double height;
  @override
  State<_IndustryCard> createState() => _IndustryCardState();
}

class _IndustryCardState extends State<_IndustryCard> {
  bool _hover = false;
  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final title = context.t(widget.title);
    final q = context.t('How can CA7 help in {industry}?').replaceAll('{industry}', title);
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: Lnk(
        to: '/chat-ca7?q=${Uri.encodeQueryComponent(q)}',
        child: AnimatedScale(
          scale: _hover ? 1.015 : 1,
          duration: const Duration(milliseconds: 200),
          child: Container(
            height: widget.height,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: dark ? const [Color(0xFF141B33), Color(0xFF0D1222)] : const [Color(0xFFF3F6FF), Color(0xFFE3EAFB)],
              ),
            ),
            child: Stack(children: [
              Positioned.fill(
                child: Image.asset(
                  'assets/research/${widget.icon.$1}.jpg',
                  fit: BoxFit.cover,
                  // no photo yet: the dotted icon
                  errorBuilder: (_, __, ___) => Padding(
                    padding: const EdgeInsets.only(bottom: 72),
                    child: Center(child: AnimatedOpacity(opacity: _hover ? 1 : .85, duration: const Duration(milliseconds: 200), child: DotIcon(widget.icon.$2, size: (widget.height * .5).clamp(90.0, 200.0)))),
                  ),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(22, 28, 22, 22),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0x003E5C66), Color(0xE63E5C66)],
                    ),
                  ),
                  child: Row(children: [
                    Expanded(child: Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w500, color: Colors.white))),
                    Icon(rtl ? Icons.north_west : Icons.north_east, size: 20, color: Colors.white),
                  ]),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// The research articles of the `research` site page (title, subtitle and its cards).
class _Articles extends StatelessWidget {
  const _Articles(this.d);
  final Map<String, dynamic> d;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final items = [
      for (final b in ((d['blocks'] ?? const []) as List).whereType<Map>())
        if (b['blockType'] == 'cards') ...((b['items'] ?? const []) as List).whereType<Map>(),
    ];
    final fs = (context.width * .03).clamp(28.0, 40.0);
    return Container(
      width: double.infinity,
      color: c.bg,
      child: Container1280(
        padding: EdgeInsets.fromLTRB(24, 32, 24, context.isDesktop ? 96 : 64),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${d['title']}', style: TextStyle(fontSize: fs, fontWeight: FontWeight.w500, height: 1.2, letterSpacing: -fs * .02, color: c.fg)),
          if ('${d['subtitle'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 640), child: Text('${d['subtitle']}', style: TextStyle(fontSize: 15, height: 1.6, color: c.muted)))),
          const SizedBox(height: 40),
          LayoutBuilder(builder: (_, box) {
            final cols = box.maxWidth >= 960 ? 3 : (box.maxWidth >= 600 ? 2 : 1);
            final w = (box.maxWidth - 20 * (cols - 1)) / cols;
            return Wrap(spacing: 20, runSpacing: 20, children: [
              for (final it in items)
                SizedBox(
                  width: w,
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(8), border: Border.all(color: c.border)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if ('${it['meta'] ?? ''}'.isNotEmpty) Text('${it['meta']}', style: TextStyle(fontFamily: 'GeistMono', fontSize: 11, letterSpacing: .4, color: c.faint)),
                      const SizedBox(height: 12),
                      Text('${it['title']}', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, height: 1.35, color: c.fg)),
                      if ('${it['text'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text('${it['text']}', style: TextStyle(fontSize: 13.5, height: 1.6, color: c.muted))),
                    ]),
                  ),
                ),
            ]);
          }),
        ]),
      ),
    );
  }
}
