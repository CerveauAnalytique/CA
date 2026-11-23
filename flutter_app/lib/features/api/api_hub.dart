import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show Clipboard, ClipboardData;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/theme/colors.dart';
import '../../core/api/api_client.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';

// ---- model + repository of the Payload collection `api-listings` ---------------------------------------------

const apiCategories = {'data': 'Data', 'ai': 'AI', 'iot': 'IoT and sensors', 'finance': 'Finance', 'commerce': 'Commerce', 'communication': 'Communication', 'other': 'Other'};
const apiAuth = {'none': 'No key', 'apiKey': 'API key', 'bearer': 'Bearer token', 'oauth2': 'OAuth 2'};
const apiPricing = {'free': 'Free', 'freemium': 'Free and paid', 'paid': 'Paid'};

/// Colors of the categories (same palette as the BAPI artwork).
const categoryColors = {
  'data': Color(0xFF3A4BF0),
  'ai': Color(0xFF8B3FE0),
  'iot': Color(0xFF0E8A5A),
  'finance': Color(0xFFE0A800),
  'commerce': Color(0xFFE04FB5),
  'communication': Color(0xFF4F8BFF),
  'other': Neutral.c500,
};

class ApiListing {
  ApiListing({required this.id, required this.slug, required this.name, required this.summary, required this.category, required this.baseUrl, this.publisher, this.docsUrl, this.auth = 'apiKey', this.pricing = 'free', this.openapi, this.endpointCount = 0, this.status = 'published', this.reviewNote, this.ownerId});
  final String id, slug, name, summary, category, baseUrl, auth, pricing, status;
  final String? publisher, docsUrl, openapi, reviewNote, ownerId;
  final int endpointCount;

  factory ApiListing.fromJson(Map<String, dynamic> j) {
    final owner = j['owner'];
    String? s(dynamic v) => v == null || '$v'.isEmpty ? null : '$v';
    return ApiListing(
      id: '${j['id']}', slug: '${j['slug'] ?? ''}', name: '${j['name'] ?? ''}', summary: '${j['summary'] ?? ''}',
      category: '${j['category'] ?? 'other'}', baseUrl: '${j['baseUrl'] ?? ''}', publisher: s(j['publisher']), docsUrl: s(j['docsUrl']),
      auth: '${j['auth'] ?? 'apiKey'}', pricing: '${j['pricing'] ?? 'free'}', openapi: s(j['openapi']),
      endpointCount: j['endpointCount'] is num ? (j['endpointCount'] as num).toInt() : 0,
      status: '${j['status'] ?? 'pending'}', reviewNote: s(j['reviewNote']),
      ownerId: owner is Map ? '${owner['id']}' : s(owner),
    );
  }
}

class ApiHubRepository {
  ApiHubRepository(this.api);
  final ApiClient api;

  List<ApiListing> _docs(dynamic res) => ((res['docs'] ?? const []) as List).map((d) => ApiListing.fromJson(Map<String, dynamic>.from(d as Map))).toList();

  /// Published listings (without the large OpenAPI file).
  Future<List<ApiListing>> published({String search = '', String? category, int limit = 60}) async => _docs(await api.get('/api/api-listings', query: {
        'limit': limit,
        'depth': 0,
        'sort': '-updatedAt',
        'select[openapi]': 'false',
        'where[and][0][status][equals]': 'published',
        if (category != null) 'where[and][1][category][equals]': category,
        if (search.trim().isNotEmpty) ...{
          'where[and][2][or][0][name][like]': search.trim(),
          'where[and][2][or][1][summary][like]': search.trim(),
        },
      }));

  Future<List<ApiListing>> mine(String userId) async => _docs(await api.get('/api/api-listings', query: {'limit': 50, 'depth': 0, 'sort': '-updatedAt', 'select[openapi]': 'false', 'where[owner][equals]': userId}));

  Future<ApiListing?> bySlug(String slug) async {
    final docs = _docs(await api.get('/api/api-listings', query: {'limit': 1, 'depth': 0, 'where[slug][equals]': slug}));
    return docs.isEmpty ? null : docs.first;
  }

  Future<ApiListing> save(Map<String, dynamic> body, {String? id}) async {
    final res = id == null ? await api.post('/api/api-listings', body: body) : await api.patch('/api/api-listings/$id', body: body);
    return ApiListing.fromJson(Map<String, dynamic>.from((res['doc'] ?? res) as Map));
  }

  Future<void> remove(String id) => api.delete('/api/api-listings/$id');
}

final apiHubRepoProvider = Provider((ref) => ApiHubRepository(ref.watch(apiClientProvider)));
final _hubQuery = StateProvider.autoDispose<({String search, String? category})>((_) => (search: '', category: null));
final _hubProvider = FutureProvider.autoDispose((ref) {
  final q = ref.watch(_hubQuery);
  return ref.watch(apiHubRepoProvider).published(search: q.search, category: q.category);
});
final latestApisProvider = FutureProvider.autoDispose((ref) => ref.watch(apiHubRepoProvider).published(limit: 5));
final _mineProvider = FutureProvider.autoDispose.family<List<ApiListing>, String>((ref, uid) => ref.watch(apiHubRepoProvider).mine(uid));
final _listingProvider = FutureProvider.autoDispose.family<ApiListing?, String>((ref, slug) => ref.watch(apiHubRepoProvider).bySlug(slug));

// ---- shared pieces ------------------------------------------------------------------------------------------------

/// `——— Label` eyebrow with a colored line (the style of the API page).
class LineEyebrow extends StatelessWidget {
  const LineEyebrow(this.text, {super.key, this.color = Brand.dot});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 72, height: 1.5, color: color),
        const SizedBox(width: 10),
        Flexible(child: Text(text, style: TextStyle(fontSize: 18, color: context.ca.muted))),
      ]);
}

class _Chip extends StatelessWidget {
  const _Chip(this.text, this.color);
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: color.withValues(alpha: .12), borderRadius: BorderRadius.circular(99)),
        child: Text(text, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: color)),
      );
}

/// One API in the hub: color bar of its category, name, publisher, summary and facts.
class ApiCard extends StatefulWidget {
  const ApiCard({super.key, required this.name, required this.summary, required this.category, required this.to, this.publisher, this.facts = const [], this.badge});
  final String name, summary, category, to;
  final String? publisher;
  final List<String> facts;
  final Widget? badge;

  factory ApiCard.of(BuildContext context, ApiListing a, {Widget? badge}) => ApiCard(
        name: a.name,
        summary: a.summary,
        category: a.category,
        to: '/api/hub/${a.slug}',
        publisher: a.publisher,
        badge: badge,
        facts: [context.t(apiAuth[a.auth] ?? a.auth), context.t(apiPricing[a.pricing] ?? a.pricing), if (a.endpointCount > 0) context.t('{n} endpoints').replaceAll('{n}', '${a.endpointCount}')],
      );

  @override
  State<ApiCard> createState() => _ApiCardState();
}

class _ApiCardState extends State<ApiCard> {
  bool _hover = false;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final col = categoryColors[widget.category] ?? Neutral.c500;
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: Lnk(
        to: widget.to,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(color: c.bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: _hover ? col.withValues(alpha: .5) : c.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Container(height: 6, decoration: BoxDecoration(gradient: LinearGradient(colors: [col, col.withValues(alpha: .25)]))),
            Padding(
              padding: const EdgeInsets.all(22),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  _Chip(context.t(apiCategories[widget.category] ?? widget.category), col),
                  const Spacer(),
                  if (widget.badge != null) widget.badge!,
                  const SizedBox(width: 6),
                  Icon(Directionality.of(context) == TextDirection.rtl ? Icons.north_west : Icons.north_east, size: 16, color: _hover ? col : c.faint),
                ]),
                const SizedBox(height: 16),
                Text(widget.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, letterSpacing: -.2, color: c.fg)),
                if (widget.publisher != null) Padding(padding: const EdgeInsets.only(top: 2), child: Text('${context.t('by')} ${widget.publisher}', style: TextStyle(fontSize: 12.5, color: c.faint))),
                const SizedBox(height: 10),
                SizedBox(height: 62, child: Text(widget.summary, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13.5, height: 1.5, color: c.muted))),
                const SizedBox(height: 14),
                Text(widget.facts.join('  ·  '), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontFamily: 'GeistMono', fontSize: 11, color: c.faint)),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

/// CA7's own API, always first in the hub (it exists: see /docs and the API keys in the dashboard).
ApiCard ca7ApiCard(BuildContext context) => ApiCard(
      name: 'CA7 Data API',
      summary: context.t('Read your connected data, push records from devices and scripts, and use CA7 from your own apps.'),
      category: 'data',
      to: '/docs',
      publisher: 'CA7',
      facts: [context.t('API key'), context.t('Included in every pack')],
      badge: _Chip(context.t('Official'), Brand.dot),
    );

/// Responsive grid of cards: 3 columns on desktop, 2 on tablets, 1 on phones.
Widget cardGrid(List<Widget> cards) => LayoutBuilder(builder: (_, box) {
      final cols = box.maxWidth >= 960 ? 3 : (box.maxWidth >= 600 ? 2 : 1);
      final w = (box.maxWidth - 20 * (cols - 1)) / cols;
      return Wrap(spacing: 20, runSpacing: 20, children: [for (final c in cards) SizedBox(width: w, child: c)]);
    });

Widget _pill(BuildContext context, String label, String to, {bool dark = true}) {
  final c = context.ca;
  return Lnk(
    to: to,
    child: Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 22),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: dark ? c.primaryBg : Colors.transparent, border: dark ? null : Border.all(color: c.border), borderRadius: BorderRadius.circular(99)),
      child: Text(context.t(label), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: dark ? c.primaryFg : c.fg)),
    ),
  );
}

Widget hubPill(BuildContext context, String label, String to, {bool dark = true}) => _pill(context, label, to, dark: dark);

// ---- /api/hub ---------------------------------------------------------------------------------------------------

class ApiHubPage extends ConsumerStatefulWidget {
  const ApiHubPage({super.key});
  @override
  ConsumerState<ApiHubPage> createState() => _ApiHubPageState();
}

class _ApiHubPageState extends ConsumerState<ApiHubPage> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final q = ref.watch(_hubQuery);
    final list = ref.watch(_hubProvider);
    final user = ref.watch(authProvider).user;
    final fs = (context.width * .036).clamp(32.0, 50.0);
    Widget chip(String? key, String label) {
      final on = q.category == key;
      final col = key == null ? c.fg : categoryColors[key]!;
      return InkWell(
        borderRadius: BorderRadius.circular(99),
        onTap: () => ref.read(_hubQuery.notifier).state = (search: q.search, category: key),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(color: on ? col.withValues(alpha: .12) : Colors.transparent, border: Border.all(color: on ? col.withValues(alpha: .5) : c.border), borderRadius: BorderRadius.circular(99)),
          child: Text(context.t(label), style: TextStyle(fontSize: 13, fontWeight: on ? FontWeight.w600 : FontWeight.w400, color: on ? col : c.muted)),
        ),
      );
    }

    return Container(
      width: double.infinity,
      color: c.bg,
      child: Container1280(
        padding: EdgeInsets.fromLTRB(24, context.isDesktop ? 72 : 40, 24, 96),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          LineEyebrow(context.t('API Hub')),
          const SizedBox(height: 28),
          Wrap(spacing: 24, runSpacing: 20, crossAxisAlignment: WrapCrossAlignment.end, alignment: WrapAlignment.spaceBetween, children: [
            ConstrainedBox(constraints: const BoxConstraints(maxWidth: 640), child: Text(context.t('Find an API or publish your own'), style: TextStyle(fontSize: fs, fontWeight: FontWeight.w500, height: 1.15, letterSpacing: -fs * .03, color: c.fg))),
            _pill(context, 'Publish your API', '/api/hub/new'),
          ]),
          const SizedBox(height: 32),
          TextField(
            controller: _search,
            onSubmitted: (v) => ref.read(_hubQuery.notifier).state = (search: v, category: q.category),
            decoration: InputDecoration(prefixIcon: const Icon(Icons.search, size: 18), hintText: context.t('Search APIs'), suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward, size: 18), onPressed: () => ref.read(_hubQuery.notifier).state = (search: _search.text, category: q.category))),
          ),
          const SizedBox(height: 16),
          Wrap(spacing: 8, runSpacing: 8, children: [chip(null, 'All'), for (final e in apiCategories.entries) chip(e.key, e.value)]),
          const SizedBox(height: 32),
          if (user != null) _Mine(user.id),
          list.when(
            loading: () => const Padding(padding: EdgeInsets.all(48), child: StateBox.loading()),
            error: (e, _) => StateBox.error('$e'),
            data: (items) {
              final showOfficial = q.search.isEmpty && (q.category == null || q.category == 'data');
              final cards = [if (showOfficial) ca7ApiCard(context), for (final a in items) ApiCard.of(context, a)];
              if (cards.isEmpty) return StateBox.empty(context.t('No APIs found. Try another search or category.'));
              return cardGrid(cards);
            },
          ),
        ]),
      ),
    );
  }
}

/// The customer's own listings, also the ones waiting for review.
class _Mine extends ConsumerWidget {
  const _Mine(this.uid);
  final String uid;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mine = ref.watch(_mineProvider(uid)).value ?? const <ApiListing>[];
    if (mine.isEmpty) return const SizedBox.shrink();
    Widget badge(ApiListing a) => switch (a.status) {
          'published' => _Chip(context.t('Published'), Brand.green),
          'rejected' => _Chip(context.t('Rejected'), Brand.red),
          _ => _Chip(context.t('Waiting for review'), const Color(0xFFE0A800)),
        };
    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(context.t('Your APIs'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
        const SizedBox(height: 16),
        cardGrid([for (final a in mine) ApiCard.of(context, a, badge: badge(a))]),
      ]),
    );
  }
}

// ---- /api/hub/:slug ---------------------------------------------------------------------------------------------

class ApiListingPage extends ConsumerWidget {
  const ApiListingPage({super.key, required this.slug});
  final String slug;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final user = ref.watch(authProvider).user;
    return ref.watch(_listingProvider(slug)).when(
          loading: () => const Padding(padding: EdgeInsets.all(64), child: StateBox.loading()),
          error: (e, _) => Padding(padding: const EdgeInsets.all(24), child: StateBox.error('$e')),
          data: (a) {
            if (a == null) return Padding(padding: const EdgeInsets.all(48), child: StateBox.empty(context.t('This API could not be found.')));
            final col = categoryColors[a.category] ?? Neutral.c500;
            final own = user != null && (user.id == a.ownerId || user.isAdmin);
            final fs = (context.width * .034).clamp(30.0, 46.0);
            Widget fact(String k, String v) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    SizedBox(width: 140, child: Text(context.t(k), style: TextStyle(fontSize: 13, color: c.faint))),
                    Expanded(child: SelectableText(v, style: TextStyle(fontSize: 14, color: c.fg))),
                  ]),
                );
            return Container(
              width: double.infinity,
              color: c.bg,
              child: Container1280(
                padding: EdgeInsets.fromLTRB(24, context.isDesktop ? 64 : 40, 24, 96),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 860),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Lnk(to: '/api/hub', child: Text('← ${context.t('API Hub')}', style: TextStyle(fontSize: 13, color: c.muted))),
                    const SizedBox(height: 28),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      _Chip(context.t(apiCategories[a.category] ?? a.category), col),
                      if (a.status != 'published') _Chip(context.t(a.status == 'rejected' ? 'Rejected' : 'Waiting for review'), a.status == 'rejected' ? Brand.red : const Color(0xFFE0A800)),
                    ]),
                    const SizedBox(height: 16),
                    Text(a.name, style: TextStyle(fontSize: fs, fontWeight: FontWeight.w500, height: 1.15, letterSpacing: -fs * .03, color: c.fg)),
                    if (a.publisher != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text('${context.t('by')} ${a.publisher}', style: TextStyle(fontSize: 14, color: c.faint))),
                    const SizedBox(height: 20),
                    Text(a.summary, style: TextStyle(fontSize: 16, height: 1.6, color: c.muted)),
                    if (a.status == 'rejected' && a.reviewNote != null && own) Padding(padding: const EdgeInsets.only(top: 16), child: Text(a.reviewNote!, style: const TextStyle(fontSize: 13, color: Brand.red))),
                    const SizedBox(height: 28),
                    Wrap(spacing: 12, runSpacing: 12, children: [
                      if (a.docsUrl != null) CaButton(context.t('Open the documentation'), onPressed: () => launchUrl(Uri.parse(a.docsUrl!))),
                      CaButton(context.t('Copy base URL'), outlined: true, onPressed: () {
                        Clipboard.setData(ClipboardData(text: a.baseUrl));
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.t('Copied'))));
                      }),
                      if (own) Lnk(to: '/api/hub/${a.slug}/edit', child: CaButton(context.t('Edit'), outlined: true, link: true)),
                    ]),
                    const SizedBox(height: 40),
                    Container(height: 1, color: c.border),
                    const SizedBox(height: 28),
                    fact('Base URL', a.baseUrl),
                    fact('Authentication', context.t(apiAuth[a.auth] ?? a.auth)),
                    fact('Price', context.t(apiPricing[a.pricing] ?? a.pricing)),
                    if (a.endpointCount > 0) fact('Endpoints', '${a.endpointCount}'),
                    if (a.openapi != null) ...[
                      const SizedBox(height: 20),
                      Text(context.t('OpenAPI file'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      _SpecBox(a.openapi!),
                    ],
                    const SizedBox(height: 32),
                    Text(context.t('CA7 does not run or check this API. It is published by its owner; read the documentation before you use it.'), style: TextStyle(fontSize: 12.5, height: 1.5, color: c.faint)),
                  ]),
                ),
              ),
            );
          },
        );
  }
}

/// The OpenAPI file in a dark code box, first 40 lines until "Show all".
class _SpecBox extends StatefulWidget {
  const _SpecBox(this.spec);
  final String spec;
  @override
  State<_SpecBox> createState() => _SpecBoxState();
}

class _SpecBoxState extends State<_SpecBox> {
  bool _all = false;
  @override
  Widget build(BuildContext context) {
    var text = widget.spec;
    try {
      text = const JsonEncoder.withIndent('  ').convert(jsonDecode(text));
    } catch (_) {}
    final lines = text.split('\n');
    final long = lines.length > 40;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(12)),
        child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: SelectableText(_all || !long ? text : '${lines.take(40).join('\n')}\n…', style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12, height: 1.6, color: Neutral.c200))),
      ),
      if (long) TextButton(onPressed: () => setState(() => _all = !_all), child: Text(context.t(_all ? 'Show less' : 'Show all'))),
    ]);
  }
}

// ---- /api/hub/new and /api/hub/:slug/edit ------------------------------------------------------------------------

class PublishApiPage extends ConsumerStatefulWidget {
  const PublishApiPage({super.key, this.slug});
  final String? slug;
  @override
  ConsumerState<PublishApiPage> createState() => _PublishApiPageState();
}

class _PublishApiPageState extends ConsumerState<PublishApiPage> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController(), _summary = TextEditingController(), _base = TextEditingController(), _docs = TextEditingController(), _spec = TextEditingController();
  String _category = 'data', _auth = 'apiKey', _pricing = 'free';
  String? _id, _error, _fileName;
  bool _busy = false, _loaded = false;

  @override
  void dispose() {
    for (final t in [_name, _summary, _base, _docs, _spec]) {
      t.dispose();
    }
    super.dispose();
  }

  void _fill(ApiListing a) {
    _loaded = true;
    _id = a.id;
    _name.text = a.name;
    _summary.text = a.summary;
    _base.text = a.baseUrl;
    _docs.text = a.docsUrl ?? '';
    _spec.text = a.openapi ?? '';
    _category = a.category;
    _auth = a.auth;
    _pricing = a.pricing;
  }

  Future<void> _pickSpec() async {
    final f = await FilePicker.pickFile(type: FileType.custom, allowedExtensions: ['json', 'yaml', 'yml']);
    if (f == null) return;
    final bytes = await f.readAsBytes();
    if (bytes.length > 300000) return setState(() => _error = context.t('The API file is too large (max 300 KB).'));
    setState(() {
      _spec.text = utf8.decode(bytes, allowMalformed: true);
      _fileName = f.name;
      _error = null;
    });
  }

  String? _https(String? v, {bool required = false}) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return required ? context.t('Required.') : null;
    final u = Uri.tryParse(s);
    return u == null || u.scheme != 'https' || u.host.isEmpty ? context.t('Use an https:// address.') : null;
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _busy = true; _error = null; });
    try {
      final saved = await ref.read(apiHubRepoProvider).save({
        'name': _name.text.trim(),
        'summary': _summary.text.trim(),
        'category': _category,
        'baseUrl': _base.text.trim(),
        'docsUrl': _docs.text.trim(),
        'auth': _auth,
        'pricing': _pricing,
        'openapi': _spec.text,
      }, id: _id);
      ref.invalidate(_mineProvider);
      ref.invalidate(_listingProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.t('Sent for review. Your API is public once it is approved.'))));
      context.goL('/api/hub/${saved.slug}');
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(context.t('Delete this API?')),
        actions: [TextButton(onPressed: () => Navigator.pop(d, false), child: Text(context.t('Cancel'))), TextButton(onPressed: () => Navigator.pop(d, true), child: Text(context.t('Delete')))],
      ),
    );
    if (ok != true || _id == null) return;
    await ref.read(apiHubRepoProvider).remove(_id!);
    ref.invalidate(_mineProvider);
    if (mounted) context.goL('/api/hub');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final user = ref.watch(authProvider).user;
    final path = widget.slug == null ? '/api/hub/new' : '/api/hub/${widget.slug}/edit';
    Widget shell(List<Widget> children) => Container(
          width: double.infinity,
          color: c.bg,
          child: Container1280(
            padding: EdgeInsets.fromLTRB(24, context.isDesktop ? 64 : 40, 24, 96),
            child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 680), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children)),
          ),
        );
    final head = [
      Align(alignment: AlignmentDirectional.centerStart, child: LineEyebrow(context.t('API Hub'))),
      const SizedBox(height: 24),
      Text(context.t(widget.slug == null ? 'Publish your API' : 'Edit your API'), style: TextStyle(fontSize: (context.width * .034).clamp(30.0, 44.0), fontWeight: FontWeight.w500, letterSpacing: -1, color: c.fg)),
      const SizedBox(height: 10),
      Text(context.t('Add your API to the hub so other companies can find it. We check every API before it is public.'), style: TextStyle(fontSize: 15, height: 1.6, color: c.muted)),
      const SizedBox(height: 32),
    ];
    if (user == null) {
      return shell([...head, Align(alignment: AlignmentDirectional.centerStart, child: _pill(context, 'Log in to publish', '/login?form=1&redirect=${Uri.encodeComponent(path)}'))]);
    }
    if (widget.slug != null && !_loaded) {
      final a = ref.watch(_listingProvider(widget.slug!));
      if (a.isLoading) return shell([...head, const StateBox.loading()]);
      final v = a.value;
      if (v == null || (v.ownerId != user.id && !user.isAdmin)) return shell([...head, StateBox.empty(context.t('This API could not be found.'))]);
      _fill(v);
    }
    Widget select(String label, String value, Map<String, String> options, ValueChanged<String> on) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(context.t(label), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: c.muted)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            initialValue: value,
            items: [for (final e in options.entries) DropdownMenuItem(value: e.key, child: Text(context.t(e.value)))],
            onChanged: (v) => setState(() => on(v!)),
          ),
        ]);
    final selects = [
      select('Category', _category, apiCategories, (v) => _category = v),
      select('Authentication', _auth, apiAuth, (v) => _auth = v),
      select('Price', _pricing, apiPricing, (v) => _pricing = v),
    ];
    return shell([
      ...head,
      Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 20), child: StateBox.error(_error!)),
          CaField(controller: _name, label: context.t('Name'), validator: (v) => (v ?? '').trim().isEmpty ? context.t('Required.') : null),
          const SizedBox(height: 20),
          CaField(controller: _summary, label: context.t('What does your API do?'), maxLines: 3, validator: (v) => (v ?? '').trim().isEmpty ? context.t('Required.') : ((v ?? '').length > 300 ? context.t('Use at most 300 characters.') : null)),
          const SizedBox(height: 20),
          CaField(controller: _base, label: context.t('Base URL'), hint: 'https://api.example.com/v1', keyboard: TextInputType.url, validator: (v) => _https(v, required: true)),
          const SizedBox(height: 20),
          CaField(controller: _docs, label: context.t('Documentation (optional)'), hint: 'https://docs.example.com', keyboard: TextInputType.url, validator: _https),
          const SizedBox(height: 20),
          context.isDesktop
              ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [for (var i = 0; i < 3; i++) ...[if (i > 0) const SizedBox(width: 16), Expanded(child: selects[i])]])
              : Column(children: [for (final s in selects) Padding(padding: const EdgeInsets.only(bottom: 16), child: s)]),
          const SizedBox(height: 28),
          Text(context.t('OpenAPI file (optional)'), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: c.muted)),
          const SizedBox(height: 8),
          InkWell(
            onTap: _pickSpec,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)),
              child: Row(children: [
                Icon(Icons.upload_file_outlined, color: Brand.dot),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_fileName ?? (_spec.text.isNotEmpty ? context.t('OpenAPI file added') : context.t('Upload an OpenAPI or Swagger file')), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(context.t('JSON or YAML, up to 300 KB. We count the endpoints and show the file on your API page.'), style: TextStyle(fontSize: 12.5, color: c.muted)),
                ])),
                if (_spec.text.isNotEmpty) IconButton(tooltip: context.t('Remove'), icon: const Icon(Icons.close, size: 18), onPressed: () => setState(() { _spec.clear(); _fileName = null; })),
              ]),
            ),
          ),
          const SizedBox(height: 32),
          Row(children: [
            CaButton(_busy ? context.t('Processing') : context.t(_id == null ? 'Send for review' : 'Save and send for review'), onPressed: _submit, busy: _busy),
            const Spacer(),
            if (_id != null) TextButton(onPressed: _delete, child: Text(context.t('Delete'), style: const TextStyle(color: Brand.red))),
          ]),
        ]),
      ),
    ]);
  }
}
