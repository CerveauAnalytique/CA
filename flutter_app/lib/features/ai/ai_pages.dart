import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import '../shop/shop_data.dart';

/// CA7 Intelligence in the app. Everything the AI shows was checked by the backend's Compliance Engine against the real prices and stock.
final aiStatusProvider = FutureProvider.autoDispose((ref) async {
  try {
    return Map<String, dynamic>.from(await ref.watch(apiClientProvider).get('/api/ca/ai/status') as Map);
  } catch (_) {
    return <String, dynamic>{'mode': 'catalog'};
  }
});

class Rec {
  Rec(this.id, this.slug, this.title, this.price, this.reason, this.sponsored);
  final String id, slug, title, reason;
  final int? price;
  final bool sponsored;
}

final _recProvider = FutureProvider.autoDispose.family<List<Rec>, String>((ref, products) async {
  try {
    final j = await ref.watch(apiClientProvider).get('/api/ca/ai/recommend', query: {if (products.isNotEmpty) 'products': products});
    return ((j['items'] ?? const []) as List).map((e) => Rec('${e['id']}', '${e['slug'] ?? e['id']}', '${e['title']}', (e['price'] as num?)?.toInt(), '${e['reason']}', e['sponsored'] == true)).toList();
  } catch (_) {
    return const []; // suggestions are optional: the page works without them
  }
});

/// A row of suggested products with the reason. [productIds] = comma separated ids the suggestions go with.
class RecommendationStrip extends ConsumerWidget {
  const RecommendationStrip({super.key, this.productIds = '', this.title = 'Recommended for you'});
  final String productIds, title;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final items = ref.watch(_recProvider(productIds)).value ?? const <Rec>[];
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(context.t(title), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Wrap(spacing: 12, runSpacing: 12, children: [
          for (final r in items)
            SizedBox(
              width: 220,
              child: Lnk(
                to: '/products/${r.slug}',
                child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  if (r.sponsored) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(context.t('Sponsored'), style: TextStyle(fontSize: 11, color: c.faint, fontWeight: FontWeight.w600))),
                  Text(r.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 4),
                  Text(money(r.price), style: TextStyle(fontSize: 13, color: c.muted)),
                  const SizedBox(height: 6),
                  Text(r.reason, style: TextStyle(fontSize: 11, color: c.faint)),
                ])),
              ),
            ),
        ]),
      ]),
    );
  }
}

/// "Running low?": things you bought repeatedly that are due again (needs your consent in Profile).
class RunningLowCard extends ConsumerWidget {
  const RunningLowCard({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const SizedBox.shrink();
    return FutureBuilder<dynamic>(
      future: ref.read(apiClientProvider).get('/api/ca/ai/running-low').catchError((_) => <String, dynamic>{'items': []}),
      builder: (_, s) {
        final d = s.data is Map ? Map<String, dynamic>.from(s.data as Map) : const <String, dynamic>{};
        final items = ((d['items'] ?? const []) as List).whereType<Map>().toList();
        if (d['needsConsent'] == true) {
          return CaCard(title: context.t('Running low?'), child: Wrap(children: [Text('${context.t('Allow personal AI suggestions in your profile to get reminders.')} '), Lnk(to: '/dashboard/settings', child: Text(context.t('Profile'), style: const TextStyle(decoration: TextDecoration.underline)))]));
        }
        if (items.isEmpty) return const SizedBox.shrink();
        return CaCard(title: context.t('Running low?'), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          for (final i in items) Padding(padding: const EdgeInsets.only(bottom: 6), child: Lnk(to: '/products/${i['slug'] ?? i['id']}', child: Text('${i['title']} · ${money(i['price'] as num?)} · ${context.t('last bought {n} days ago', {'n': '${i['daysSince']}'})}', style: const TextStyle(fontSize: 13, decoration: TextDecoration.underline)))),
        ]));
      },
    );
  }
}

class _Msg {
  _Msg(this.role, this.text);
  final String role;
  final String text;
}

class AssistantPage extends ConsumerStatefulWidget {
  const AssistantPage({super.key});
  @override
  ConsumerState<AssistantPage> createState() => _AssistantPageState();
}

class _AssistantPageState extends ConsumerState<AssistantPage> {
  final _msgs = <_Msg>[];
  final _input = TextEditingController();
  bool _busy = false;

  Future<void> _send(String text) async {
    final q = text.trim();
    if (q.isEmpty || _busy) return;
    setState(() { _msgs.add(_Msg('user', q)); _input.clear(); _busy = true; });
    try {
      final r = await ref.read(apiClientProvider).post('/api/ca/ai/assistant', body: {'messages': [for (final m in _msgs) {'role': m.role, 'content': m.text}]});
      setState(() => _msgs.add(_Msg('assistant', '${r['text']}')));
    } catch (e) {
      setState(() => _msgs.add(_Msg('assistant', '$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final status = ref.watch(aiStatusProvider).value;
    final model = status?['mode'] == 'model';
    return Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 48 : 24),
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(context.t('AI shopping assistant'), style: TextStyle(fontSize: (context.width * .04).clamp(28.0, 40.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
            const SizedBox(height: 8),
            Muted(context.t('Ask about products, prices and stock. Every answer is checked against the real shop data before you see it.'), size: 15),
            const SizedBox(height: 8),
            Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3), decoration: BoxDecoration(color: model ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(99)), child: Text(model ? context.t('AI model online') : context.t('AI model not installed: answering from the product catalog'), style: const TextStyle(fontSize: 11, color: Neutral.c900))),
            const SizedBox(height: 24),
            for (final m in _msgs)
              Align(
                alignment: m.role == 'user' ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  constraints: BoxConstraints(maxWidth: context.width * .8),
                  decoration: BoxDecoration(color: m.role == 'user' ? (Theme.of(context).brightness == Brightness.light ? Neutral.c100 : Neutral.c800) : c.card, borderRadius: BorderRadius.circular(18)),
                  child: SelectableText(m.text, style: const TextStyle(fontSize: 15, height: 1.5)),
                ),
              ),
            if (_busy) const Padding(padding: EdgeInsets.all(8), child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
            if (_msgs.isEmpty) Wrap(spacing: 8, runSpacing: 8, children: [for (final s in ['How much is the sensor kit?', 'What is in stock?', 'Do you have a camera module?']) ActionChip(label: Text(context.t(s)), onPressed: () => _send(context.t(s)), shape: const StadiumBorder())]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextField(controller: _input, onSubmitted: _send, decoration: InputDecoration(hintText: context.t('Ask CA7 anything…')))),
              const SizedBox(width: 8),
              IconButton.filled(onPressed: _busy ? null : () => _send(_input.text), icon: const Icon(Icons.arrow_upward, size: 18), style: IconButton.styleFrom(backgroundColor: c.primaryBg, foregroundColor: c.primaryFg)),
            ]),
            const RecommendationStrip(),
          ]),
        ),
      ),
    );
  }
}
