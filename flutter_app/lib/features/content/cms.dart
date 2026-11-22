import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/configuration/env.dart';
import '../../app/theme/colors.dart';
import '../../core/api/api_client.dart';
import '../../core/errors/app_exception.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';

/// Content pages come from the database (Payload): collection `site-pages` (about, docs, privacy, cookies, ...),
/// `pages` (the CMS pages with layout blocks) and `posts` (blog).
class CmsRepository {
  CmsRepository(this.api);
  final ApiClient api;

  Future<Map<String, dynamic>?> _first(String collection, String slug, {int depth = 1}) async {
    final res = await api.get('/api/$collection', query: {'limit': 1, 'depth': depth, 'where[slug][equals]': slug});
    final docs = res['docs'] as List;
    return docs.isEmpty ? null : Map<String, dynamic>.from(docs.first as Map);
  }

  Future<Map<String, dynamic>?> sitePage(String slug) => _first('site-pages', slug);
  Future<Map<String, dynamic>?> cmsPage(String slug) => _first('pages', slug, depth: 2);
  Future<Map<String, dynamic>?> post(String slug) => _first('posts', slug);
  Future<List<Map<String, dynamic>>> posts() async => ((await api.get('/api/posts', query: {'limit': 50, 'depth': 1, 'sort': '-publishedAt'}))['docs'] as List).map((d) => Map<String, dynamic>.from(d as Map)).toList();
  Future<List<Map<String, dynamic>>> sectionPages(String section) async => ((await api.get('/api/site-pages', query: {'limit': 50, 'depth': 0, 'where[section][equals]': section, 'sort': 'slug'}))['docs'] as List).map((d) => Map<String, dynamic>.from(d as Map)).toList();
}

final cmsRepoProvider = Provider((ref) => CmsRepository(ref.watch(apiClientProvider)));
final _siteProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>((ref, slug) => ref.watch(cmsRepoProvider).sitePage(slug));
final _cmsPageProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>((ref, slug) => ref.watch(cmsRepoProvider).cmsPage(slug));
final _postProvider = FutureProvider.autoDispose.family<Map<String, dynamic>?, String>((ref, slug) => ref.watch(cmsRepoProvider).post(slug));
final _postsProvider = FutureProvider.autoDispose((ref) => ref.watch(cmsRepoProvider).posts());

Widget _wrap(BuildContext context, List<Widget> children) => Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 64 : 48),
      child: Align(alignment: Alignment.topLeft, child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 820), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children))),
    );

TextStyle _title(BuildContext c) => TextStyle(fontSize: (c.width * .04).clamp(30.0, 44.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1);

/// A page of the `site-pages` collection; when there is none, the CMS page with that slug; else "not found".
class CmsPage extends ConsumerWidget {
  const CmsPage(this.slug, {super.key});
  final String slug;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final site = ref.watch(_siteProvider(slug));
    return site.when(
      loading: () => const Padding(padding: EdgeInsets.all(64), child: StateBox.loading()),
      error: (e, _) => _wrap(context, [StateBox.error('$e')]),
      data: (d) {
        if (d != null) return _SitePageView(d);
        final cms = ref.watch(_cmsPageProvider(slug));
        return cms.when(
          loading: () => const Padding(padding: EdgeInsets.all(64), child: StateBox.loading()),
          error: (e, _) => _wrap(context, [StateBox.error('$e')]),
          data: (p) => p == null ? NotFoundPage(path: '/$slug') : _CmsPageView(p),
        );
      },
    );
  }
}

class NotFoundPage extends StatelessWidget {
  const NotFoundPage({super.key, required this.path});
  final String path;
  @override
  Widget build(BuildContext context) => _wrap(context, [
        Text('404', style: _title(context)),
        const SizedBox(height: 12),
        Muted(context.t('This page could not be found.'), size: 15),
        const SizedBox(height: 16),
        Lnk(to: '/', child: CaButton(context.t('Home'), outlined: true, link: true)),
      ]);
}

class _SitePageView extends StatelessWidget {
  const _SitePageView(this.d);
  final Map<String, dynamic> d;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final blocks = ((d['blocks'] ?? const []) as List).whereType<Map>();
    return _wrap(context, [
      if ('${d['eyebrow'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 12), child: Eyebrow('${d['eyebrow']}')),
      Text('${d['title']}', style: _title(context)),
      if ('${d['subtitle'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Muted('${d['subtitle']}', size: 16)),
      const SizedBox(height: 24),
      for (final b in blocks) _block(context, Map<String, dynamic>.from(b), c),
    ]);
  }

  Widget _block(BuildContext context, Map<String, dynamic> b, CaColors c) {
    switch (b['blockType']) {
      case 'heading':
        return Padding(padding: EdgeInsets.only(top: b['level'] == '3' ? 20 : 32, bottom: 8), child: Text('${b['text']}', style: TextStyle(fontSize: b['level'] == '3' ? 17 : 22, fontWeight: FontWeight.w600)));
      case 'list':
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (final i in (b['items'] ?? const []) as List) Padding(padding: const EdgeInsets.only(bottom: 6, left: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('•  ', style: TextStyle(color: c.muted)), Expanded(child: _Linked('${(i as Map)['text']}', TextStyle(fontSize: 15, height: 1.7, color: c.muted)))]))]));
      case 'code':
        return Container(width: double.infinity, margin: const EdgeInsets.symmetric(vertical: 12), padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(12)), child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: SelectableText('${b['code']}', style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12.5, height: 1.6, color: Neutral.c100))));
      case 'callout':
        return Container(width: double.infinity, margin: const EdgeInsets.symmetric(vertical: 12), padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFDE68A))), child: Text('${b['text']}', style: const TextStyle(fontSize: 14, height: 1.6, color: Color(0xFF92400E))));
      case 'cards':
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: LayoutBuilder(builder: (_, box) {
            final cols = box.maxWidth >= 640 ? 2 : 1;
            final w = (box.maxWidth - 16 * (cols - 1)) / cols;
            return Wrap(spacing: 16, runSpacing: 16, children: [
              for (final i in (b['items'] ?? const []) as List)
                SizedBox(width: w, child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${(i as Map)['title']}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  if ('${i['text'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text('${i['text']}', style: TextStyle(fontSize: 13, height: 1.6, color: c.muted))),
                  if ('${i['meta'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text('${i['meta']}', style: TextStyle(fontSize: 12, color: c.faint))),
                ]))),
            ]);
          }),
        );
      default:
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: _Linked('${b['text']}', TextStyle(fontSize: 15, height: 1.7, color: c.muted)));
    }
  }
}

/// Text where e-mail addresses and web addresses can be tapped.
class _Linked extends StatelessWidget {
  const _Linked(this.text, this.style);
  final String text;
  final TextStyle style;
  @override
  Widget build(BuildContext context) {
    final re = RegExp(r'([\w.+-]+@[\w-]+\.[\w.-]+|https?://[^\s)]+)');
    final spans = <InlineSpan>[];
    var i = 0;
    for (final m in re.allMatches(text)) {
      if (m.start > i) spans.add(TextSpan(text: text.substring(i, m.start)));
      final t = m.group(0)!;
      spans.add(WidgetSpan(alignment: PlaceholderAlignment.baseline, baseline: TextBaseline.alphabetic, child: GestureDetector(onTap: () => launchUrl(Uri.parse(t.contains('@') && !t.startsWith('http') ? 'mailto:$t' : t)), child: Text(t, style: style.copyWith(color: Brand.blue, decoration: TextDecoration.underline)))));
      i = m.end;
    }
    if (i < text.length) spans.add(TextSpan(text: text.substring(i)));
    return SelectableText.rich(TextSpan(style: style, children: spans));
  }
}

// ---- CMS pages (collection `pages`): hero + layout blocks with Lexical rich text --------------------------------------

class _CmsPageView extends StatelessWidget {
  const _CmsPageView(this.p);
  final Map<String, dynamic> p;
  @override
  Widget build(BuildContext context) {
    final hero = p['hero'] is Map ? Map<String, dynamic>.from(p['hero'] as Map) : const <String, dynamic>{};
    final layout = ((p['layout'] ?? const []) as List).whereType<Map>();
    return _wrap(context, [
      Text('${p['title']}', style: _title(context)),
      if (hero['richText'] != null) Padding(padding: const EdgeInsets.only(top: 12), child: Lexical(hero['richText'])),
      for (final b in layout) _layoutBlock(context, Map<String, dynamic>.from(b)),
    ]);
  }

  Widget _layoutBlock(BuildContext context, Map<String, dynamic> b) {
    switch (b['blockType']) {
      case 'content':
        return Padding(padding: const EdgeInsets.only(top: 24), child: Wrap(spacing: 24, runSpacing: 16, children: [for (final col in (b['columns'] ?? const []) as List) SizedBox(width: ((col as Map)['size'] == 'full' || (col['size'] == null)) ? 820 : 396, child: Lexical(col['richText']))]));
      case 'cta':
        return Padding(padding: const EdgeInsets.only(top: 24), child: CaCard(child: Lexical(b['richText'])));
      case 'banner':
        return Padding(padding: const EdgeInsets.only(top: 24), child: CaCard(color: const Color(0xFFFFFBEB), child: Lexical(b['content'])));
      case 'mediaBlock':
        final m = b['media'];
        final url = m is Map && m['url'] is String ? ((m['url'] as String).startsWith('http') ? m['url'] as String : '${Env.shown}${m['url']}') : null;
        return url == null ? const SizedBox() : Padding(padding: const EdgeInsets.only(top: 24), child: ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network(url, errorBuilder: (_, _, _) => const SizedBox())));
      default:
        return Padding(padding: const EdgeInsets.only(top: 24), child: Muted('(${b['blockType']}) ${context.t('This block is shown on the website.')}', size: 12));
    }
  }
}

/// Renders Lexical rich text (the editor of Payload): paragraphs, headings, lists, quotes, links, bold/italic/code.
class Lexical extends StatelessWidget {
  const Lexical(this.value, {super.key});
  final dynamic value;
  @override
  Widget build(BuildContext context) {
    final root = value is Map ? value['root'] : null;
    if (root is! Map) return const SizedBox();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (final n in (root['children'] ?? const []) as List) _node(context, n as Map)]);
  }

  InlineSpan _inline(BuildContext context, Map n, TextStyle base) {
    final kids = [for (final c in (n['children'] ?? const []) as List) _inline(context, c as Map, base)];
    switch (n['type']) {
      case 'text':
        final f = (n['format'] as int?) ?? 0;
        return TextSpan(text: '${n['text']}', style: base.copyWith(fontWeight: f & 1 != 0 ? FontWeight.w700 : null, fontStyle: f & 2 != 0 ? FontStyle.italic : null, decoration: f & 8 != 0 ? TextDecoration.underline : (f & 4 != 0 ? TextDecoration.lineThrough : null), fontFamily: f & 16 != 0 ? 'GeistMono' : null));
      case 'linebreak':
        return const TextSpan(text: '\n');
      case 'link':
      case 'autolink':
        final url = (n['fields'] is Map ? n['fields']['url'] : n['url']) as String?;
        return TextSpan(children: kids, style: base.copyWith(color: Brand.blue, decoration: TextDecoration.underline), recognizer: null, mouseCursor: SystemMouseCursors.click, semanticsLabel: url);
      default:
        return TextSpan(children: kids);
    }
  }

  Widget _node(BuildContext context, Map n) {
    final c = context.ca;
    final base = TextStyle(fontSize: 15, height: 1.7, color: c.muted);
    Widget rich(TextStyle s) => SelectableText.rich(TextSpan(children: [for (final k in (n['children'] ?? const []) as List) _inline(context, k as Map, s)]), style: s);
    switch (n['type']) {
      case 'heading':
        final sizes = {'h1': 32.0, 'h2': 24.0, 'h3': 19.0, 'h4': 17.0};
        return Padding(padding: const EdgeInsets.only(top: 20, bottom: 8), child: rich(TextStyle(fontSize: sizes[n['tag']] ?? 17, fontWeight: FontWeight.w600, color: c.fg, height: 1.3)));
      case 'list':
        final ordered = n['listType'] == 'number';
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (final (i, li) in ((n['children'] ?? const []) as List).indexed) Padding(padding: const EdgeInsets.only(bottom: 4, left: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(ordered ? '${i + 1}.  ' : '•  ', style: base), Expanded(child: SelectableText.rich(TextSpan(children: [for (final k in ((li as Map)['children'] ?? const []) as List) _inline(context, k as Map, base)]), style: base))]))]));
      case 'quote':
        return Container(margin: const EdgeInsets.symmetric(vertical: 12), padding: const EdgeInsets.only(left: 16), decoration: const BoxDecoration(border: Border(left: BorderSide(color: Neutral.c300, width: 3))), child: rich(base.copyWith(fontStyle: FontStyle.italic)));
      case 'paragraph':
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: rich(base));
      default:
        return const SizedBox();
    }
  }
}

// ---- blog ----------------------------------------------------------------------------------------------------------------

class BlogPage extends ConsumerWidget {
  const BlogPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => _wrap(context, [
        Eyebrow('Blog'),
        const SizedBox(height: 12),
        Text(context.t('Stories'), style: _title(context)),
        const SizedBox(height: 24),
        ref.watch(_postsProvider).when(
              loading: () => const StateBox.loading(),
              error: (e, _) => StateBox.error('$e'),
              data: (list) => list.isEmpty
                  ? StateBox.empty(context.t('No posts yet.'))
                  : Column(children: [for (final p in list) Padding(padding: const EdgeInsets.only(bottom: 12), child: Lnk(to: '/blog/${p['slug']}', child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [if (p['category'] != null) Text('${p['category']}'.toUpperCase(), style: TextStyle(fontSize: 11, letterSpacing: 1.2, color: context.ca.faint)), const SizedBox(height: 6), Text('${p['title']}', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)), if (p['excerpt'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text('${p['excerpt']}', style: TextStyle(fontSize: 14, height: 1.6, color: context.ca.muted)))]))))]),
            ),
      ]);
}

class BlogPostPage extends ConsumerWidget {
  const BlogPostPage({super.key, required this.slug});
  final String slug;
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref.watch(_postProvider(slug)).when(
        loading: () => const Padding(padding: EdgeInsets.all(64), child: StateBox.loading()),
        error: (e, _) => _wrap(context, [StateBox.error('$e')]),
        data: (p) => p == null
            ? NotFoundPage(path: '/blog/$slug')
            : _wrap(context, [
                InkWell(onTap: () => context.goL('/blog'), child: Text('← Blog', style: TextStyle(fontSize: 13, color: context.ca.muted))),
                const SizedBox(height: 16),
                Text('${p['title']}', style: _title(context)),
                if (p['excerpt'] != null) Padding(padding: const EdgeInsets.only(top: 12), child: Muted('${p['excerpt']}', size: 16)),
                const SizedBox(height: 24),
                Lexical(p['content']),
              ]),
      );
}

/// Used by the router for paths with no screen of their own.
String? slugOf(GoRouterState s) {
  final segs = s.uri.pathSegments;
  return segs.length > 1 ? segs.skip(1).join('/') : null;
}

AppException? asApp(Object e) => e is AppException ? e : null;
