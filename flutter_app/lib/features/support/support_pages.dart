import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';

/// Help center: topics, articles and the support request all come from the database (support-topics, support-articles).
final _topicsProvider = FutureProvider.autoDispose((ref) async => ((await ref.watch(apiClientProvider).get('/api/support-topics', query: {'limit': 50, 'sort': 'order', 'depth': 0}))['docs'] as List).map((d) => Map<String, dynamic>.from(d as Map)).toList());
final _articlesProvider = FutureProvider.autoDispose((ref) async => ((await ref.watch(apiClientProvider).get('/api/support-articles', query: {'limit': 200, 'sort': '-helpful', 'depth': 1}))['docs'] as List).map((d) => Map<String, dynamic>.from(d as Map)).toList());
final _articleProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>((ref, slug) async {
  final docs = (await ref.watch(apiClientProvider).get('/api/support-articles', query: {'limit': 1, 'depth': 1, 'where[slug][equals]': slug}))['docs'] as List;
  return docs.isEmpty ? null : Map<String, dynamic>.from(docs.first as Map);
});

Widget _wrap(BuildContext context, List<Widget> children, {double max = 1000}) => Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 64 : 40),
      child: Align(alignment: Alignment.topCenter, child: ConstrainedBox(constraints: BoxConstraints(maxWidth: max), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children))),
    );

TextStyle _h1(BuildContext c) => TextStyle(fontSize: (c.width * .04).clamp(28.0, 44.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1);

class SupportPage extends ConsumerStatefulWidget {
  const SupportPage({super.key});
  @override
  ConsumerState<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends ConsumerState<SupportPage> {
  final _q = TextEditingController();
  Timer? _t;
  List<Map<String, dynamic>> _hits = [];
  String? _topic;

  void _search(String v) {
    _t?.cancel();
    if (v.trim().length < 2) return setState(() => _hits = []);
    _t = Timer(const Duration(milliseconds: 250), () async {
      try {
        final r = await ref.read(apiClientProvider).get('/api/ca/support/suggest', query: {'q': v.trim()});
        if (mounted) setState(() => _hits = ((r['articles'] ?? const []) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList());
      } catch (_) {}
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _topic ??= GoRouterState.of(context).uri.queryParameters['topic'];
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final topics = ref.watch(_topicsProvider).value ?? const [];
    final articles = ref.watch(_articlesProvider).value ?? const [];
    int? topicId(Map<String, dynamic> a) => a['topic'] is Map ? (a['topic'] as Map)['id'] as int? : null;
    final active = topics.where((t) => t['slug'] == _topic).firstOrNull;
    final list = active != null ? articles.where((a) => topicId(a) == active['id']).toList() : articles.take(6).toList();
    return _wrap(context, [
      Center(child: Column(children: [
        const Eyebrow('Help center'),
        const SizedBox(height: 12),
        Text(context.t('How can we help?'), textAlign: TextAlign.center, style: _h1(context)),
        const SizedBox(height: 24),
        ConstrainedBox(constraints: const BoxConstraints(maxWidth: 560), child: Column(children: [
          TextField(controller: _q, onChanged: _search, decoration: InputDecoration(prefixIcon: const Icon(Icons.search, size: 18), hintText: context.t('Search the help center'))),
          if (_q.text.trim().length >= 2)
            Container(
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(color: c.bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: Neutral.c200)),
              child: _hits.isEmpty
                  ? Padding(padding: const EdgeInsets.all(16), child: Row(children: [Text('${context.t('No article found.')} '), Lnk(to: '/support/request', child: Text(context.t('Ask the support team'), style: const TextStyle(decoration: TextDecoration.underline)))]))
                  : Column(children: [for (final h in _hits) ListTile(dense: true, title: Text('${h['title']}'), subtitle: Text('${h['topic'] ?? ''}'), onTap: () => context.goL('/support/articles/${h['slug']}'))]),
            ),
        ])),
      ])),
      const SizedBox(height: 40),
      Text(context.t('Browse by topic'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
      const SizedBox(height: 16),
      LayoutBuilder(builder: (_, box) {
        final cols = box.maxWidth >= 760 ? 3 : (box.maxWidth >= 500 ? 2 : 1);
        final w = (box.maxWidth - 12 * (cols - 1)) / cols;
        return Wrap(spacing: 12, runSpacing: 12, children: [
          for (final t in topics)
            SizedBox(
              width: w,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => setState(() => _topic = _topic == t['slug'] ? null : '${t['slug']}'),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: _topic == t['slug'] ? (Theme.of(context).brightness == Brightness.light ? Neutral.c100 : Neutral.c800) : c.card, borderRadius: BorderRadius.circular(16)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(width: 36, height: 36, alignment: Alignment.center, decoration: BoxDecoration(color: c.bg, borderRadius: BorderRadius.circular(12)), child: Text('${t['badge'] ?? ''}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Brand.blueDark))),
                    const SizedBox(height: 12),
                    Text('${t['title']}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('${t['description'] ?? ''}', style: TextStyle(fontSize: 13, color: c.muted)),
                    const SizedBox(height: 10),
                    Text('${articles.where((a) => topicId(a) == t['id']).length} ${context.t('articles')}', style: TextStyle(fontSize: 12, color: c.faint)),
                  ]),
                ),
              ),
            ),
        ]);
      }),
      const SizedBox(height: 40),
      Text(active != null ? '${active['title']}' : context.t('Most helpful articles'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
      const SizedBox(height: 16),
      if (list.isEmpty) StateBox.empty(context.t('No articles yet.')) else Column(children: [
        for (final a in list)
          Padding(padding: const EdgeInsets.only(bottom: 10), child: Lnk(to: '/support/articles/${a['slug']}', child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${a['title']}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            const SizedBox(height: 4),
            Text('${a['summary']}', style: TextStyle(fontSize: 13, color: c.muted)),
            if (((a['helpful'] ?? 0) as num) > 0) Padding(padding: const EdgeInsets.only(top: 8), child: Text('${context.t('Helped')} ${a['helpful']}', style: TextStyle(fontSize: 12, color: c.faint))),
          ])))),
      ]),
      const SizedBox(height: 40),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(24)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(context.t('Still stuck?'), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w300, color: Colors.white)),
          const SizedBox(height: 8),
          Text(context.t('Tell us what is wrong. We first show the articles that fit your problem; if they do not solve it, your request goes to our support team, who answer within one working day.'), style: const TextStyle(fontSize: 14, height: 1.5, color: Neutral.c300)),
          const SizedBox(height: 16),
          Lnk(to: '/support/request', child: Container(height: 44, padding: const EdgeInsets.symmetric(horizontal: 24), alignment: Alignment.center, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(99)), child: Text(context.t('Contact support'), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Neutral.c900)))),
        ]),
      ),
    ]);
  }
}

class SupportArticlePage extends ConsumerWidget {
  const SupportArticlePage({super.key, required this.slug});
  final String slug;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    return ref.watch(_articleProvider(slug)).when(
          loading: () => const Padding(padding: EdgeInsets.all(64), child: StateBox.loading()),
          error: (e, _) => _wrap(context, [StateBox.error('$e')]),
          data: (a) {
            if (a == null) return _wrap(context, [StateBox.empty(context.t('This page could not be found.'))]);
            final blocks = ((a['blocks'] ?? const []) as List).whereType<Map>();
            return _wrap(max: 760, context, [
              InkWell(onTap: () => context.goL('/support'), child: Text('← ${context.t('Help center')}', style: TextStyle(fontSize: 13, color: c.muted))),
              const SizedBox(height: 16),
              Text('${a['title']}', style: _h1(context)),
              const SizedBox(height: 12),
              Muted('${a['summary']}', size: 16),
              const SizedBox(height: 24),
              for (final b in blocks) _block(c, Map<String, dynamic>.from(b)),
              const SizedBox(height: 24),
              _Helpful(slug: slug),
              const SizedBox(height: 16),
              CaCard(child: Wrap(children: [Text('${context.t('Did not solve it?')} '), Lnk(to: '/support/request', child: Text(context.t('Contact support'), style: const TextStyle(decoration: TextDecoration.underline)))])),
            ]);
          },
        );
  }

  Widget _block(CaColors c, Map<String, dynamic> b) {
    switch (b['blockType']) {
      case 'heading':
        return Padding(padding: const EdgeInsets.only(top: 20, bottom: 8), child: Text('${b['text']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)));
      case 'list':
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (final i in (b['items'] ?? const []) as List) Padding(padding: const EdgeInsets.only(bottom: 6, left: 8), child: Text('•  ${(i as Map)['text']}', style: TextStyle(fontSize: 15, height: 1.6, color: c.muted)))]));
      case 'code':
        return Container(width: double.infinity, margin: const EdgeInsets.symmetric(vertical: 8), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(12)), child: SelectableText('${b['code']}', style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12.5, color: Neutral.c100)));
      default:
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: Text('${b['text']}', style: TextStyle(fontSize: 15, height: 1.7, color: c.muted)));
    }
  }
}

class _Helpful extends ConsumerStatefulWidget {
  const _Helpful({required this.slug});
  final String slug;
  @override
  ConsumerState<_Helpful> createState() => _HelpfulState();
}

class _HelpfulState extends ConsumerState<_Helpful> {
  bool _done = false;
  @override
  Widget build(BuildContext context) => Row(children: [
        Text(context.t('Was this article helpful?')),
        const SizedBox(width: 12),
        CaButton(_done ? context.t('Thanks!') : context.t('Yes, it helped'), small: true, outlined: true, onPressed: _done ? null : () async {
          setState(() => _done = true);
          try { await ref.read(apiClientProvider).post('/api/ca/support/helpful', body: {'slug': widget.slug}); } catch (_) {}
        }),
      ]);
}

class SupportRequestPage extends ConsumerStatefulWidget {
  const SupportRequestPage({super.key});
  @override
  ConsumerState<SupportRequestPage> createState() => _SupportRequestPageState();
}

class _SupportRequestPageState extends ConsumerState<SupportRequestPage> {
  late final _email = TextEditingController(text: ref.read(authProvider).user?.email ?? '');
  final _subject = TextEditingController(), _message = TextEditingController();
  List<Map<String, dynamic>> _hits = [];
  Timer? _t;
  bool _busy = false, _sent = false;
  String? _error;

  void _suggest() {
    _t?.cancel();
    final q = '${_subject.text} ${_message.text}'.trim();
    if (q.length < 3) return setState(() => _hits = []);
    _t = Timer(const Duration(milliseconds: 400), () async {
      try {
        final r = await ref.read(apiClientProvider).get('/api/ca/support/suggest', query: {'q': q.length > 200 ? q.substring(0, 200) : q});
        if (mounted) setState(() => _hits = ((r['articles'] ?? const []) as List).take(3).map((e) => Map<String, dynamic>.from(e as Map)).toList());
      } catch (_) {}
    });
  }

  Future<void> _send() async {
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(apiClientProvider).post('/api/ca/support/request', body: {'subject': _subject.text, 'message': _message.text, 'email': _email.text});
      setState(() => _sent = true);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => _wrap(max: 680, context, [
        const Eyebrow('Help center'),
        const SizedBox(height: 12),
        Text(context.t('Contact support'), style: _h1(context)),
        const SizedBox(height: 12),
        Muted(context.t('Describe the problem. We first show articles that may solve it; if not, send the request. Our team answers within one working day.'), size: 15),
        const SizedBox(height: 24),
        if (_sent)
          CaCard(title: context.t('Request sent'), child: Text(context.t('Thank you. We will answer by email within one working day.')))
        else
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            CaField(controller: _subject, label: context.t('Subject')),
            const SizedBox(height: 16),
            TextField(controller: _message, minLines: 5, maxLines: 8, onChanged: (_) => _suggest(), decoration: InputDecoration(labelText: context.t('What is wrong?'))),
            if (_hits.isNotEmpty) Container(margin: const EdgeInsets.only(top: 12), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Brand.blue50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Brand.blue200)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(context.t('These articles may already solve it:'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Neutral.c900)),
              for (final h in _hits) Padding(padding: const EdgeInsets.only(top: 6), child: Lnk(to: '/support/articles/${h['slug']}', child: Text('${h['title']}', style: const TextStyle(fontSize: 14, color: Neutral.c900, decoration: TextDecoration.underline)))),
            ])),
            const SizedBox(height: 16),
            CaField(controller: _email, label: context.t('Your email'), keyboard: TextInputType.emailAddress),
            if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Brand.red, fontSize: 13))),
            const SizedBox(height: 20),
            CaButton(context.t('Send to the support team'), onPressed: _send, busy: _busy),
          ]),
      ]);
}
