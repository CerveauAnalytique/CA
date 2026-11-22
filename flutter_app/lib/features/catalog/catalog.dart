import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/theme/colors.dart';
import '../../core/api/api_client.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';

// ---- typed models of the Payload collections `ai-models` and `datasets` -----------------------------

String? _s(dynamic v) => v == null ? null : v.toString();
int? _i(dynamic v) => v is num ? v.toInt() : null;
List<String> _tags(dynamic v) => v is List ? v.map((e) => e is Map ? '${e['tag'] ?? e}' : '$e').toList() : const [];

class CatalogItem {
  CatalogItem({required this.id, required this.slug, required this.name, required this.summary, this.publisher, this.version, this.license, this.sizeBytes, this.downloads, this.downloadUrl, this.card, this.tags = const [], this.pills = const [], this.facts = const {}});
  final String id, slug, name, summary;
  final String? publisher, version, license, downloadUrl, card;
  final int? sizeBytes, downloads;
  final List<String> tags, pills;
  final Map<String, String?> facts; // label -> value (already English labels)
}

class AiModel extends CatalogItem {
  AiModel({required super.id, required super.slug, required super.name, required super.summary, super.publisher, super.version, super.license, super.sizeBytes, super.downloads, super.downloadUrl, super.card, super.tags, super.pills, super.facts, this.installCommand, this.metrics = const []});
  final String? installCommand;
  final List<(String, String)> metrics;

  factory AiModel.fromJson(Map<String, dynamic> j) => AiModel(
        id: '${j['id']}', slug: '${j['slug']}', name: '${j['name']}', summary: '${j['summary'] ?? ''}',
        publisher: _s(j['publisher']), version: _s(j['version']), license: _s(j['license']), sizeBytes: _i(j['sizeBytes']), downloads: _i(j['downloads']),
        downloadUrl: _s(j['downloadUrl']), card: _s(j['modelCard']), tags: _tags(j['tags']),
        pills: [if (j['framework'] != null) '${j['framework']}', if (j['task'] != null) '${j['task']}'.replaceAll('-', ' '), if (j['stage'] != null) '${j['stage']}'],
        facts: {'Framework': _s(j['framework']), 'Base model': _s(j['baseModel']), 'Version': _s(j['version']), 'Stage': _s(j['stage']), 'License': _s(j['license'])},
        installCommand: _s(j['installCommand']),
        metrics: ((j['metrics'] ?? const []) as List).map((m) => ('${m['name']}', '${m['value']}')).toList(),
      );
}

class Dataset extends CatalogItem {
  Dataset({required super.id, required super.slug, required super.name, required super.summary, super.publisher, super.version, super.license, super.sizeBytes, super.downloads, super.downloadUrl, super.card, super.tags, super.pills, super.facts, this.rows, this.columns = const []});
  final int? rows;
  final List<(String, String, String)> columns;

  factory Dataset.fromJson(Map<String, dynamic> j) => Dataset(
        id: '${j['id']}', slug: '${j['slug']}', name: '${j['name']}', summary: '${j['summary'] ?? ''}',
        publisher: _s(j['publisher']), version: _s(j['version']), license: _s(j['license']), sizeBytes: _i(j['sizeBytes']), downloads: _i(j['downloads']),
        downloadUrl: _s(j['downloadUrl']), card: _s(j['datasetCard']), tags: _tags(j['tags']), rows: _i(j['rowCount']),
        pills: [if (j['format'] != null) '${j['format']}', if (j['source'] != null && j['source'] != 'other') '${j['source']}'],
        facts: {'Format': _s(j['format']), 'Version': _s(j['version']), 'License': _s(j['license']), 'Rows': _num(_i(j['rowCount'])), 'Columns': _num(_i(j['columnCount']))},
        columns: ((j['schemaColumns'] ?? const []) as List).map((c) => ('${c['column']}', '${c['type']}', '${c['description'] ?? ''}')).toList(),
      );
}

String? _num(int? n) => n == null ? null : n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},');
String? formatBytes(int? b) {
  if (b == null) return null;
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  var v = b.toDouble(), i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return '${v.toStringAsFixed(i == 0 || v >= 10 ? 0 : 1)} ${u[i]}';
}

// ---- repository ----------------------------------------------------------------------------------------

class CatalogRepository {
  CatalogRepository(this.api);
  final ApiClient api;

  Future<List<T>> list<T>(String collection, T Function(Map<String, dynamic>) parse, {String q = '', String? filterField, String? filterValue, required List<String> searchFields}) async {
    final query = <String, dynamic>{'limit': 60, 'sort': '-downloads', 'depth': 0};
    var n = 0;
    if (filterValue != null && filterValue != 'all') query['where[and][${n++}][$filterField][equals]'] = filterValue;
    if (q.isNotEmpty) {
      for (var i = 0; i < searchFields.length; i++) {
        query['where[and][$n][or][$i][${searchFields[i]}][like]'] = q;
      }
    }
    final res = await api.get('/api/$collection', query: query);
    return ((res['docs'] ?? const []) as List).map((d) => parse(Map<String, dynamic>.from(d as Map))).toList();
  }

  Future<T?> bySlug<T>(String collection, String slug, T Function(Map<String, dynamic>) parse) async {
    final res = await api.get('/api/$collection', query: {'limit': 1, 'depth': 0, 'where[slug][equals]': slug});
    final docs = (res['docs'] ?? const []) as List;
    return docs.isEmpty ? null : parse(Map<String, dynamic>.from(docs.first as Map));
  }
}

final catalogRepoProvider = Provider((ref) => CatalogRepository(ref.watch(apiClientProvider)));

typedef _ListArgs = ({String q, String filter});
final modelsProvider = FutureProvider.autoDispose.family<List<AiModel>, _ListArgs>((ref, a) =>
    ref.watch(catalogRepoProvider).list('ai-models', AiModel.fromJson, q: a.q, filterField: 'framework', filterValue: a.filter, searchFields: ['name', 'summary', 'publisher']));
final datasetsProvider = FutureProvider.autoDispose.family<List<Dataset>, _ListArgs>((ref, a) =>
    ref.watch(catalogRepoProvider).list('datasets', Dataset.fromJson, q: a.q, filterField: 'source', filterValue: a.filter, searchFields: ['name', 'summary', 'publisher']));
final modelProvider = FutureProvider.autoDispose.family<AiModel?, String>((ref, s) => ref.watch(catalogRepoProvider).bySlug('ai-models', s, AiModel.fromJson));
final datasetProvider = FutureProvider.autoDispose.family<Dataset?, String>((ref, s) => ref.watch(catalogRepoProvider).bySlug('datasets', s, Dataset.fromJson));

// ---- pages ---------------------------------------------------------------------------------------------

class _Pill extends StatelessWidget {
  const _Pill(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: Theme.of(context).brightness == Brightness.light ? Neutral.c100 : Neutral.c800, borderRadius: BorderRadius.circular(99)), child: Text(text, style: TextStyle(fontSize: 11, color: context.ca.muted)));
}

class CatalogListPage extends ConsumerStatefulWidget {
  const CatalogListPage({super.key, required this.models});
  final bool models;
  @override
  ConsumerState<CatalogListPage> createState() => _CatalogListPageState();
}

class _CatalogListPageState extends ConsumerState<CatalogListPage> {
  final _q = TextEditingController();
  String _query = '', _filter = 'all';

  List<(String, String)> get _filters => widget.models
      ? const [('all', 'All'), ('ollama', 'Ollama'), ('pytorch', 'PyTorch'), ('tensorflow', 'TensorFlow'), ('sklearn', 'scikit-learn'), ('xgboost', 'XGBoost'), ('onnx', 'ONNX')]
      : const [('all', 'All'), ('cameras', 'Cameras'), ('sensors', 'Sensors'), ('logs', 'Logs'), ('business', 'Business')];

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final args = (q: _query, filter: _filter);
    final AsyncValue<List<CatalogItem>> async = widget.models ? ref.watch(modelsProvider(args)) : ref.watch(datasetsProvider(args));
    final w = context.width;
    final cols = w >= Bp.lg ? 3 : (w >= Bp.sm ? 2 : 1);
    return Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 64 : 48),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Eyebrow(context.t(widget.models ? 'AI Models' : 'Datasets')),
        const SizedBox(height: 12),
        Text(context.t(widget.models ? 'AI models for your data' : 'Datasets for your IoT and company data'), style: TextStyle(fontSize: (w * .04).clamp(30.0, 44.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
        const SizedBox(height: 12),
        ConstrainedBox(constraints: const BoxConstraints(maxWidth: 640), child: Muted(context.t(widget.models ? 'Ready-to-run models for IoT, sensors and analytics. Pick one, or build your own, and connect it to CA7.' : 'Real data from IoT devices, sensors, logs and business systems, ready to use with your models.'), size: 15)),
        const SizedBox(height: 24),
        ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420), child: TextField(controller: _q, onSubmitted: (v) => setState(() => _query = v.trim()), decoration: InputDecoration(prefixIcon: const Icon(Icons.search, size: 16), hintText: context.t('Search…')))),
        const SizedBox(height: 16),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final f in _filters)
            ChoiceChip(label: Text(context.t(f.$2), style: const TextStyle(fontSize: 13)), selected: _filter == f.$1, onSelected: (_) => setState(() => _filter = f.$1), shape: const StadiumBorder(), showCheckmark: false),
        ]),
        const SizedBox(height: 32),
        async.when(
          loading: () => const StateBox.loading(),
          error: (e, _) => StateBox.error('$e'),
          data: (items) => items.isEmpty
              ? Center(child: Padding(padding: const EdgeInsets.all(40), child: Text(context.t(widget.models ? 'No models found.' : 'No datasets found.'), style: TextStyle(color: c.muted))))
              : LayoutBuilder(builder: (_, box) {
                  final cw = (box.maxWidth - 16 * (cols - 1)) / cols;
                  return Wrap(spacing: 16, runSpacing: 16, children: [for (final it in items) SizedBox(width: cw, child: _Card(it, widget.models))]);
                }),
        ),
      ]),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card(this.it, this.models);
  final CatalogItem it;
  final bool models;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    return Lnk(
      to: '/${models ? 'models' : 'datasets'}/${it.slug}',
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Wrap(spacing: 6, runSpacing: 6, children: [for (final p in it.pills) _Pill(p)]),
          const SizedBox(height: 16),
          Text(it.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, letterSpacing: -.2)),
          const SizedBox(height: 2),
          Text('${it.publisher ?? ''} · ${it.version ?? ''}', style: TextStyle(fontSize: 12, color: c.faint)),
          const SizedBox(height: 12),
          Text(it.summary, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, height: 1.6, color: c.muted)),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(models ? (it.license ?? '') : (it is Dataset && (it as Dataset).rows != null ? context.t('{n} rows', {'n': _num((it as Dataset).rows)!}) : (formatBytes(it.sizeBytes) ?? it.license ?? '')), style: TextStyle(fontSize: 12, color: c.muted)),
            if (models) Row(children: [Icon(Icons.download, size: 13, color: c.muted), const SizedBox(width: 4), Text(_num(it.downloads ?? 0)!, style: TextStyle(fontSize: 12, color: c.muted))]),
          ]),
        ]),
      ),
    );
  }
}

class CatalogDetailPage extends ConsumerWidget {
  const CatalogDetailPage({super.key, required this.slug, required this.models});
  final String slug;
  final bool models;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<CatalogItem?> async = models ? ref.watch(modelProvider(slug)) : ref.watch(datasetProvider(slug));
    return Container1280(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 64 : 48),
      child: async.when(
        loading: () => const StateBox.loading(),
        error: (e, _) => StateBox.error('$e'),
        data: (it) => it == null ? StateBox.empty(context.t(models ? 'No models found.' : 'No datasets found.')) : _Detail(it, models),
      ),
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail(this.it, this.models);
  final CatalogItem it;
  final bool models;
  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final m = it is AiModel ? it as AiModel : null;
    final d = it is Dataset ? it as Dataset : null;
    Widget h2(String t) => Padding(padding: const EdgeInsets.only(top: 40, bottom: 12), child: Text(context.t(t), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)));
    final main = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Wrap(spacing: 6, runSpacing: 6, children: [for (final p in it.pills) _Pill(p)]),
      const SizedBox(height: 16),
      Text(it.name, style: TextStyle(fontSize: (context.width * .04).clamp(30.0, 44.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1)),
      const SizedBox(height: 8),
      Text('${it.publisher ?? ''} · ${it.version ?? ''}', style: TextStyle(fontSize: 13, color: c.faint)),
      const SizedBox(height: 20),
      Text(it.summary, style: TextStyle(fontSize: 15, height: 1.6, color: c.muted)),
      if (m?.installCommand != null) ...[h2('Install'), Container(width: double.infinity, padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(12)), child: SelectableText(m!.installCommand!, style: const TextStyle(fontFamily: 'GeistMono', fontSize: 13, color: Neutral.c100)))],
      if (m != null && m.metrics.isNotEmpty) ...[h2('Metrics'), Wrap(spacing: 12, runSpacing: 12, children: [for (final x in m.metrics) Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(12)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(x.$1, style: TextStyle(fontSize: 11, color: c.faint)), const SizedBox(height: 4), Text(x.$2, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600))]))])],
      if (d != null && d.columns.isNotEmpty) ...[
        h2('Schema'),
        Container(
          decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(12)),
          child: FullTable(
            table: DataTable(
              headingTextStyle: TextStyle(fontSize: 12, color: c.faint),
              dataTextStyle: TextStyle(fontSize: 13, color: c.fg),
              columns: [DataColumn(label: Text(context.t('Column'))), DataColumn(label: Text(context.t('Type'))), DataColumn(label: Text(context.t('Description')))],
              rows: [for (final x in d.columns) DataRow(cells: [DataCell(Text(x.$1, style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12.5))), DataCell(Text(x.$2)), DataCell(Text(x.$3))])],
            ),
          ),
        ),
      ],
      if (it.card != null && it.card!.isNotEmpty) ...[h2(models ? 'Model card' : 'About this dataset'), SelectableText(it.card!, style: TextStyle(fontSize: 14, height: 1.7, color: c.muted))],
    ]);

    final facts = {...it.facts, 'Size': formatBytes(it.sizeBytes), 'Downloads': _num(it.downloads)}..removeWhere((_, v) => v == null || v.isEmpty);
    final side = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (it.downloadUrl != null && it.downloadUrl!.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 16), child: CaButton(context.t(models ? 'Get the model' : 'Get the data'), icon: Icons.open_in_new, onPressed: () => launchUrl(Uri.parse(it.downloadUrl!), mode: LaunchMode.externalApplication))),
      CaCard(child: Column(children: [for (final e in facts.entries) Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(context.t(e.key), style: TextStyle(fontSize: 13, color: c.muted)), Text(e.value!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))]))])),
      if (it.tags.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 16), child: Wrap(spacing: 6, runSpacing: 6, children: [for (final tg in it.tags) _Pill(tg)])),
    ]);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      InkWell(onTap: () => context.goL(models ? '/models' : '/datasets'), child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.arrow_back, size: 14, color: c.muted), const SizedBox(width: 6), Text(context.t(models ? 'All models' : 'All datasets'), style: TextStyle(fontSize: 13, color: c.muted))])),
      const SizedBox(height: 24),
      context.isDesktop ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(flex: 2, child: main), const SizedBox(width: 48), SizedBox(width: 320, child: side)]) : Column(children: [main, const SizedBox(height: 32), side]),
    ]);
  }
}
