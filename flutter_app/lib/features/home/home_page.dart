import 'dart:async';
import 'dart:math' as math;
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show LogicalKeyboardKey;
import 'dart:ui' show ImageFilter;
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/widgets/dot_icon.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import 'dot_camera.dart';

const _words = ['business data', 'your databases', 'your IoT', 'your sensors', 'your cameras'];

class HomePage extends StatelessWidget {
  const HomePage({super.key});
  @override
  Widget build(BuildContext context) => Column(children: const [_Hero(), _LogoStrip(), _FeatureCards(), _Updates(), _Problems()]);
}

/// Typing effect of the headline (80 ms per letter, 35 ms deleting, 1.8 s pause).
class _Typing extends StatefulWidget {
  const _Typing(this.words, this.style);
  final List<String> words;
  final TextStyle style;
  @override
  State<_Typing> createState() => _TypingState();
}

class _TypingState extends State<_Typing> {
  String text = '';
  int i = 0;
  bool deleting = false;
  Timer? _t;

  @override
  void initState() {
    super.initState();
    text = widget.words.first;
    _schedule();
  }

  void _schedule() {
    final w = widget.words[i % widget.words.length];
    var delay = deleting ? 35 : 80;
    if (!deleting && text == w) delay = 1800;
    if (deleting && text.isEmpty) delay = 300;
    _t = Timer(Duration(milliseconds: delay), () {
      if (!mounted) return;
      setState(() {
        if (!deleting && text == w) {
          deleting = true;
        } else if (deleting && text.isEmpty) {
          deleting = false;
          i++;
        } else {
          text = deleting ? w.substring(0, text.length - 1) : w.substring(0, text.length + 1);
        }
      });
      _schedule();
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Text.rich(TextSpan(children: [
        TextSpan(text: text),
        WidgetSpan(alignment: PlaceholderAlignment.middle, child: Container(margin: const EdgeInsets.only(left: 2), width: 2, height: widget.style.fontSize! * .9, color: Neutral.c700)),
      ]), style: widget.style);
}

class _Hero extends StatefulWidget {
  const _Hero();
  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  final _q = TextEditingController();
  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  void _go() {
    final q = _q.text.trim();
    context.goL(q.isEmpty ? '/chat-ca7' : '/chat-ca7?q=${Uri.encodeQueryComponent(q)}');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final w = context.width;
    final fs = (w * .043).clamp(34.0, 58.0);
    final h1 = TextStyle(fontSize: fs, fontWeight: FontWeight.w300, height: 1.08, letterSpacing: -fs * .025);
    final desktop = context.isDesktop;
    final minH = math.max(560.0, MediaQuery.sizeOf(context).height - 56);

    final left = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(context.t('The AI brain for'), style: h1),
      DefaultTextStyle.merge(style: TextStyle(color: Neutral.c400), child: _Typing(_words.map(context.t).toList(), h1.copyWith(color: Neutral.c400))),
      const SizedBox(height: 40),
      _ChatInput(controller: _q, onSubmit: _go),
    ]);

    final listBlock = Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        for (final s in ['Data Connect', 'AI Models', 'CA7 Chat', 'Automation']) Text(context.t(s).toUpperCase(), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w300, height: 1.45, letterSpacing: .5, color: Neutral.c700)),
      ]),
      const SizedBox(width: 40),
      Container(width: 1, height: 96, color: Neutral.c300),
      const SizedBox(width: 12),
      Flexible(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 210), child: Text(context.t('Connect a data source, choose an AI model and let your teams, and your support desk, work with answers instead of raw data.'), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w300, height: 1.375, color: Neutral.c600)))),
    ]);

    return Container(
      width: double.infinity,
      constraints: BoxConstraints(minHeight: desktop ? minH : 0),
      color: c.bg,
      child: Stack(clipBehavior: Clip.hardEdge, children: [
        Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(gradient: RadialGradient(center: const Alignment(.44, 0), radius: 1.1, colors: [Brand.dot.withValues(alpha: .08), Colors.transparent], stops: const [0, .7])))),
        Positioned(
          left: 0, right: 0, bottom: -w * .03,
          child: IgnorePointer(child: ImageFiltered(imageFilter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), child: Text('CERVEAU', textAlign: TextAlign.center, style: TextStyle(fontSize: w * .17, fontWeight: FontWeight.w900, height: 1, letterSpacing: -w * .17 * .05, color: c.fg.withValues(alpha: .06))))),
        ),
        Container1280(
          child: desktop
              ? SizedBox(
                  height: minH,
                  child: Stack(children: [
                    Positioned(right: ca7Max * .01, top: minH * .09, bottom: 0, width: math.min(w, ca7Max) * .52, child: const IgnorePointer(child: Center(child: DotCamera()))),
                    Padding(padding: const EdgeInsets.symmetric(vertical: 64), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      SizedBox(width: (math.min(w, ca7Max) - 48) * 5 / 12, child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [left, listBlock])),
                      const Spacer(),
                      SizedBox(width: 230, child: Text(context.t('CA7 connects your databases, APIs, IoT devices, sensors and cameras to one AI platform. Ask questions to your own data, build your own AI models and automate. No code needed.'), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w300, height: 1.375, color: Neutral.c700))),
                    ])),
                  ]),
                )
              : Padding(padding: const EdgeInsets.symmetric(vertical: 40), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [left, const SizedBox(height: 16), const IgnorePointer(child: DotCamera()), const SizedBox(height: 40), listBlock])),
        ),
      ]),
    );
  }
}


/// The "Ask CA7 anything…" box of the hero (port of HomeChatInput.tsx): Enter sends, Shift+Enter is a new line,
/// attach file, web search and deep reasoning toggles with badges.
class _ChatInput extends StatefulWidget {
  const _ChatInput({required this.controller, required this.onSubmit});
  final TextEditingController controller;
  final VoidCallback onSubmit;
  @override
  State<_ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<_ChatInput> {
  bool web = false, deep = false;
  String? attachment;

  Future<void> _attach() async {
    final f = await FilePicker.pickFile();
    if (f != null && mounted) setState(() => attachment = f.name);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final dark = Theme.of(context).brightness == Brightness.dark;
    Widget badge(String text, Color bg, Color fg, VoidCallback close, {IconData? icon}) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[Icon(icon, size: 12, color: fg), const SizedBox(width: 6)],
            Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: fg)),
            const SizedBox(width: 4),
            GestureDetector(onTap: close, child: Icon(Icons.close, size: 12, color: fg)),
          ]),
        );
    Widget toggle(IconData i, String tip, bool on, Color onColor, Color onBg, VoidCallback tap) => Tooltip(
          message: tip,
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: tap,
            child: Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(shape: BoxShape.circle, color: on ? onBg : null), child: Icon(i, size: 16, color: on ? onColor : c.faint)),
          ),
        );
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 672),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: dark ? const Color(0xFF1E1E20) : Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: dark ? Neutral.c800 : const Color(0xCCE5E5E5)),
            boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 25, offset: Offset(0, 20), spreadRadius: -5), BoxShadow(color: Color(0x0D000000), blurRadius: 10, offset: Offset(0, 8), spreadRadius: -6)],
          ),
          child: Column(children: [
            if (attachment != null || web || deep)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: Wrap(spacing: 8, runSpacing: 8, children: [
                    if (attachment != null) badge('📎 $attachment', dark ? Neutral.c800 : Neutral.c100, c.fg, () => setState(() => attachment = null)),
                    if (web) badge('Web Search Active', dark ? const Color(0x99172554) : Brand.blue50, Brand.blue, () => setState(() => web = false), icon: Icons.language),
                    if (deep) badge('Deep Reasoning Mode', dark ? const Color(0x99451A03) : const Color(0xFFFFFBEB), const Color(0xFFD97706), () => setState(() => deep = false), icon: Icons.lightbulb_outline),
                  ]),
                ),
              ),
            Shortcuts(
              shortcuts: const {SingleActivator(LogicalKeyboardKey.enter): _SubmitIntent()},
              child: Actions(
                actions: {_SubmitIntent: CallbackAction<_SubmitIntent>(onInvoke: (_) { widget.onSubmit(); return null; })},
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: 36, maxHeight: 140),
                  child: TextField(
                    controller: widget.controller,
                    minLines: 1,
                    maxLines: 5,
                    style: const TextStyle(fontSize: 15, height: 1.625),
                    decoration: InputDecoration(hintText: context.t('Ask CA7 anything…'), filled: false, isCollapsed: true, border: InputBorder.none, enabledBorder: InputBorder.none, focusedBorder: InputBorder.none, contentPadding: const EdgeInsets.symmetric(vertical: 4)),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.only(top: 4),
              decoration: BoxDecoration(border: Border(top: BorderSide(color: dark ? const Color(0x99262626) : Neutral.c100))),
              child: Row(children: [
                toggle(Icons.attach_file, context.t('Attach file'), false, c.fg, Colors.transparent, _attach),
                const SizedBox(width: 8),
                toggle(Icons.language, context.t('Toggle web search'), web, Brand.blue, dark ? const Color(0x66172554) : Brand.blue50, () => setState(() => web = !web)),
                const SizedBox(width: 8),
                toggle(Icons.lightbulb_outline, context.t('Toggle deep reasoning'), deep, const Color(0xFFF59E0B), dark ? const Color(0x66451A03) : const Color(0xFFFFFBEB), () => setState(() => deep = !deep)),
                const Spacer(),
                GestureDetector(
                  onTap: widget.onSubmit,
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: context.isDesktop ? 24 : 12, vertical: 10),
                      decoration: BoxDecoration(color: dark ? Colors.white : Colors.black, borderRadius: BorderRadius.circular(99)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text(context.t('Start chat'), style: TextStyle(color: dark ? Colors.black : Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                        const SizedBox(width: 8),
                        Icon(Icons.arrow_upward, size: 14, color: dark ? Colors.black : Colors.white),
                      ]),
                    ),
                  ),
                ),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 10),
        Text(context.t('Powered by CA7 Engine • Press Enter to chat'), style: TextStyle(fontSize: 11.5, color: c.faint)),
      ]),
    );
  }
}

class _SubmitIntent extends Intent {
  const _SubmitIntent();
}

class _LogoStrip extends StatelessWidget {
  const _LogoStrip();
  @override
  Widget build(BuildContext context) {
    const items = [('Data Connect', 'integrate'), ('AI Models', 'models'), ('Data Intelligence', 'analytics'), ('CA7 Chat', 'chat'), ('Data API', 'api')];
    final c = context.ca;
    return Container1280(
      padding: EdgeInsets.zero,
      child: Wrap(alignment: WrapAlignment.center, children: [
        for (final it in items)
          SizedBox(
            width: context.isDesktop ? ca7Max / 5 : context.width / 2,
            height: 104,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              DotIcon(it.$2, size: 60),
              const SizedBox(width: 12),
              Flexible(child: Text(context.t(it.$1), style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, letterSpacing: -.2, color: c.muted))),
            ]),
          ),
      ]),
    );
  }
}

/// `[01/04] Everything you need` badge, title and text.
class SectionHead extends StatelessWidget {
  const SectionHead({super.key, required this.index, required this.label, required this.title, required this.text});
  final String index, label, title, text;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final fs = (context.width * .04).clamp(30.0, 48.0);
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 672),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(children: [
            Container(
              padding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
              decoration: BoxDecoration(color: c.bg, border: Border.all(color: Neutral.c200), borderRadius: BorderRadius.circular(8)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: const Color(0xFFF9D84A), borderRadius: BorderRadius.circular(6)), child: Text('[$index]', style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12, color: Colors.black))),
                const SizedBox(width: 8),
                Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12))),
              ]),
            ),
            const SizedBox(height: 32),
            Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: fs, height: 1.15, letterSpacing: -fs * .025)),
            const SizedBox(height: 20),
            ConstrainedBox(constraints: const BoxConstraints(maxWidth: 512), child: Text(text, textAlign: TextAlign.center, style: TextStyle(fontSize: 15, height: 1.6, color: c.muted))),
          ]),
        ),
      ),
    );
  }
}

class _FeatureCards extends StatelessWidget {
  const _FeatureCards();
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    const cards = [
      ('integrate', 'Data Connect', 'Connect databases, REST APIs, CSV files, IoT devices, sensors and cameras in one place.'),
      ('models', 'AI Models', 'Use existing AI models or build your own on your company data.'),
      ('analytics', 'Data Intelligence', 'AI finds patterns, anomalies and trends in your data and answers questions about it.'),
    ];
    Widget card(int i, (String, String, String) it) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
          decoration: BoxDecoration(border: Border(right: context.isDesktop && i < 2 ? const BorderSide(color: Neutral.c200) : BorderSide.none, bottom: !context.isDesktop && i < 2 ? const BorderSide(color: Neutral.c200) : BorderSide.none)),
          child: Column(children: [
            DotIcon(it.$1, size: 112),
            const SizedBox(height: 32),
            Text(context.t(it.$2), style: const TextStyle(fontFamily: 'GeistMono', fontSize: 18, fontWeight: FontWeight.w500)),
            const SizedBox(height: 12),
            ConstrainedBox(constraints: const BoxConstraints(maxWidth: 250), child: Text(context.t(it.$3), textAlign: TextAlign.center, style: TextStyle(fontSize: 13, height: 1.6, color: c.muted))),
          ]),
        );
    return Container(
      color: c.bg,
      padding: const EdgeInsets.symmetric(vertical: 96),
      width: double.infinity,
      child: Column(children: [
        SectionHead(index: '01/04', label: context.t('Everything you need'), title: context.t('The AI brain for business data'), text: context.t('CA7 connects databases, APIs, IoT devices, sensors and cameras, stores your data and lets AI analyze it, so your teams solve real problems.')),
        const SizedBox(height: 80),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1040),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                decoration: BoxDecoration(border: Border.all(color: Neutral.c200)),
                child: context.isDesktop ? Row(children: [for (var i = 0; i < 3; i++) Expanded(child: card(i, cards[i]))]) : Column(children: [for (var i = 0; i < 3; i++) card(i, cards[i])]),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

class _Updates extends StatefulWidget {
  const _Updates();
  @override
  State<_Updates> createState() => _UpdatesState();
}

class _UpdatesState extends State<_Updates> {
  int open = 0;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    const items = [
      ('1.0', 'CA7 Chat', 'Ask questions to your own data and get answers based on the data that is available.'),
      ('2.0', 'Data Storage', 'Store datasets, logs, sensor information and other data securely, searchable in seconds.'),
      ('3.0', 'Automation', 'Let AI take action based on events and data.'),
      ('4.0', 'Data API', 'Let other apps and systems talk to CA7 through one API, with full control over who can see what.'),
      ('5.0', 'Camera Intelligence', 'Add smart cameras as an extra module: detect objects and get alerts, as one more data source.'),
    ];
    final list = Column(children: [
      for (var i = 0; i < items.length; i++)
        Container(
          decoration: BoxDecoration(border: i > 0 ? const Border(top: BorderSide(color: Neutral.c200)) : null),
          child: Column(children: [
            InkWell(
              onTap: () => setState(() => open = open == i ? -1 : i),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Row(children: [
                  Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: open == i ? const Color(0xFFF9D84A) : c.card, border: open == i ? null : Border.all(color: Neutral.c200), borderRadius: BorderRadius.circular(6)), child: Text(items[i].$1, style: TextStyle(fontFamily: 'GeistMono', fontSize: 12, color: open == i ? Colors.black : c.fg))),
                  const SizedBox(width: 16),
                  Expanded(child: Text(context.t(items[i].$2), style: const TextStyle(fontFamily: 'GeistMono', fontSize: 17, fontWeight: FontWeight.w500))),
                  AnimatedRotation(turns: open == i ? .5 : 0, duration: const Duration(milliseconds: 200), child: const Icon(Icons.keyboard_arrow_down, size: 18)),
                ]),
              ),
            ),
            if (open == i) Padding(padding: const EdgeInsetsDirectional.only(start: 70, end: 24, bottom: 24), child: Align(alignment: AlignmentDirectional.centerStart, child: Text(context.t(items[i].$3), style: TextStyle(fontSize: 13, height: 1.6, color: c.muted)))),
          ]),
        ),
    ]);
    final art = Container(constraints: const BoxConstraints(minHeight: 320), alignment: Alignment.center, padding: const EdgeInsets.all(32), child: const DotIcon('chat', size: 220));
    return Container(
      width: double.infinity,
      color: c.card,
      padding: const EdgeInsets.symmetric(vertical: 96),
      child: Column(children: [
        SectionHead(index: '02/04', label: context.t('Build your brain'), title: context.t('Ask questions to your own data'), text: context.t('No code and no experts needed. Connect your data, ask CA7 in plain language, and let AI act on what it finds.')),
        const SizedBox(height: 64),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1040),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                decoration: BoxDecoration(color: c.bg, border: Border.all(color: Neutral.c200)),
                child: context.isDesktop ? IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Expanded(child: art), Expanded(child: Container(decoration: const BoxDecoration(border: BorderDirectional(start: BorderSide(color: Neutral.c200))), child: list))])) : Column(children: [art, Container(decoration: const BoxDecoration(border: Border(top: BorderSide(color: Neutral.c200))), child: list)]),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

class _Problems extends StatelessWidget {
  const _Problems();
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    const problems = [
      ('ops', 'Operations', 'Machines, rooms and sites generate data nobody has time to read.', 'Sensors and devices feed an AI model that spots faults and sends an alert before work stops.'),
      ('helpdesk', 'Internal support', 'Colleagues keep asking the same questions about systems and data.', 'CA7 answers them from your own datasets, so your support team handles only what needs a person.'),
      ('security', 'Safety and security', 'Sites and devices run day and night, but nobody watches every hour.', 'Your AI model watches sensors and cameras and reports events to the right team.'),
      ('analytics', 'Data teams', 'Data sits in many tools and is hard to reuse.', 'Datasets, models and one API give every team the same, clean source to build on.'),
    ];
    Widget pcard((String, String, String, String) p) => Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(16)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            DotIcon(p.$1, size: 96),
            const SizedBox(width: 20),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(context.t(p.$2), style: const TextStyle(fontFamily: 'GeistMono', fontSize: 17, fontWeight: FontWeight.w500)),
              const SizedBox(height: 8),
              Text(context.t(p.$3), style: const TextStyle(fontSize: 13, height: 1.6, color: Neutral.c400)),
              const SizedBox(height: 8),
              Text(context.t(p.$4), style: TextStyle(fontSize: 14, height: 1.6, color: c.muted)),
            ])),
          ]),
        );
    Widget pill(String label, String to, bool dark) => Lnk(
          to: to,
          child: Container(height: 44, padding: const EdgeInsets.symmetric(horizontal: 24), alignment: Alignment.center, decoration: BoxDecoration(color: dark ? c.primaryBg : (Theme.of(context).brightness == Brightness.light ? Neutral.c100 : Neutral.c800), borderRadius: BorderRadius.circular(99)), child: Text(context.t(label), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: dark ? c.primaryFg : c.fg))),
        );
    return Container(
      width: double.infinity,
      color: c.bg,
      padding: const EdgeInsets.symmetric(vertical: 96),
      child: Column(children: [
        SectionHead(index: '03/04', label: context.t('Solve problems'), title: context.t('Help every team in your company'), text: context.t('Start with a real problem. Pick an AI model, connect a dataset and use the API, so your teams get answers and your support team gets time back.')),
        const SizedBox(height: 64),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1040),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(children: [
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(context.isDesktop ? 36 : 28),
                  decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(24)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(context.t('Example').toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 1.54, color: Neutral.c400)),
                    const SizedBox(height: 12),
                    Text(context.t('A logistics company connects 30 cameras, 12 sensors and its warehouse system to CA7.'), style: TextStyle(fontSize: context.isDesktop ? 22 : 18, fontWeight: FontWeight.w300, height: 1.3, color: Colors.white)),
                    const SizedBox(height: 16),
                    Text(context.t('The owner asks: “How many pallets were processed today, how many trucks are still waiting, and are there temperature deviations?”'), style: const TextStyle(fontSize: 15, height: 1.6, color: Neutral.c300)),
                    const SizedBox(height: 16),
                    Text(context.t('CA7 gets the data from the connected systems, analyzes it and answers based on the data that is available.'), style: const TextStyle(fontSize: 15, height: 1.6, color: Neutral.c300)),
                  ]),
                ),
                const SizedBox(height: 16),
                context.isDesktop
                    ? Column(children: [IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Expanded(child: pcard(problems[0])), const SizedBox(width: 16), Expanded(child: pcard(problems[1]))])), const SizedBox(height: 16), IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Expanded(child: pcard(problems[2])), const SizedBox(width: 16), Expanded(child: pcard(problems[3]))]))])
                    : Column(children: [for (final p in problems) Padding(padding: const EdgeInsets.only(bottom: 16), child: pcard(p))]),
              ]),
            ),
          ),
        ),
        const SizedBox(height: 40),
        Wrap(alignment: WrapAlignment.center, spacing: 12, runSpacing: 12, children: [pill('Browse AI models', '/models', true), pill('Explore datasets', '/datasets', false), pill('Use the API', '/api', false)]),
      ]),
    );
  }
}
