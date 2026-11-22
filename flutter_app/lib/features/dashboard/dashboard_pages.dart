import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/configuration/env.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/lnk.dart';
import '../../core/widgets/responsive.dart';
import '../ai/ai_pages.dart';
import 'dash_repository.dart';
import 'intelligence.dart';
import 'limits.dart';

String _err(Object e) => e.toString();
String _fmt(num n) => n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},');

void _toast(BuildContext c, String m) => ScaffoldMessenger.of(c).showSnackBar(SnackBar(content: Text(m), behavior: SnackBarBehavior.floating));

/// Dark code box used for curl examples.
class CodeBox extends StatelessWidget {
  const CodeBox(this.code, {super.key});
  final String code;
  @override
  Widget build(BuildContext context) => Container(width: double.infinity, padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Neutral.c900, borderRadius: BorderRadius.circular(12)), child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: SelectableText(code, style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12, height: 1.6, color: Neutral.c200))));
}

class CopyField extends StatelessWidget {
  const CopyField(this.value, {super.key});
  final String value;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsetsDirectional.fromSTEB(12, 4, 4, 4),
        decoration: BoxDecoration(color: context.ca.bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: Neutral.c200)),
        child: Row(children: [
          Expanded(child: SelectableText(value, style: const TextStyle(fontFamily: 'GeistMono', fontSize: 12))),
          IconButton(tooltip: 'Copy', icon: const Icon(Icons.copy, size: 14), onPressed: () { Clipboard.setData(ClipboardData(text: value)); _toast(context, 'Copied'); }),
        ]),
      );
}

// ---- Overview ----------------------------------------------------------------------------------------------

const _collections = [('ai-models', 'AI models'), ('datasets', 'Datasets'), ('data-sources', 'Data sources'), ('data-records', 'Data records'), ('automations', 'Automations'), ('products', 'Products'), ('orders', 'Orders'), ('carts', 'Carts'), ('addresses', 'Addresses'), ('transactions', 'Transactions'), ('posts', 'Posts'), ('pages', 'Pages'), ('categories', 'Categories'), ('media', 'Media'), ('form-submissions', 'Form submissions')];

final _countsProvider = FutureProvider.autoDispose<Map<String, int>>((ref) async {
  final repo = ref.watch(dashRepoProvider);
  final out = <String, int>{};
  await Future.wait(_collections.map((c) async {
    try {
      out[c.$1] = await repo.count(c.$1);
    } catch (_) {
      out[c.$1] = 0;
    }
  }));
  return out;
});

class OverviewPage extends ConsumerWidget {
  const OverviewPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final user = ref.watch(authProvider).user!;
    final counts = ref.watch(_countsProvider);
    final keyOn = user.apiKeyEnabled;
    final left = Column(children: [
      CaCard(title: 'Workspace', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Muted('Your data hub. Connect cameras, sensors and apps, then read everything through one API.', size: 12),
        const SizedBox(height: 16),
        const Text('API endpoint', style: TextStyle(fontSize: 11, color: Neutral.c400)),
        const SizedBox(height: 4),
        CopyField('${Env.shown}/api/ca/export'),
        const SizedBox(height: 16),
        const Text('API key', style: TextStyle(fontSize: 11, color: Neutral.c400)),
        Wrap(children: [Text('${keyOn ? 'Active' : 'Not created yet'} · ', style: const TextStyle(fontSize: 12)), Lnk(to: '/dashboard/api', child: const Text('manage', style: TextStyle(fontSize: 12, decoration: TextDecoration.underline)))]),
      ])),
      const SizedBox(height: 16),
      CaCard(title: 'Quick start', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        for (final s in [('Create an API key', '/dashboard/api'), ('Call the API from your app or server', null), ('Or use the sync tool to send your data to your own server', '/dashboard/export')].indexed)
          Padding(padding: const EdgeInsets.only(bottom: 6), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('${s.$1 + 1}. ', style: TextStyle(fontSize: 12, color: c.muted)), Expanded(child: s.$2.$2 == null ? Text(s.$2.$1, style: TextStyle(fontSize: 12, color: c.muted)) : Lnk(to: s.$2.$2!, child: Text(s.$2.$1, style: TextStyle(fontSize: 12, color: c.muted, decoration: TextDecoration.underline))))])),
      ])),
    ]);

    final right = counts.when(
      loading: () => const StateBox.loading(),
      error: (e, _) => StateBox.error(_err(e)),
      data: (m) {
        final total = m.values.fold<int>(0, (a, b) => a + b);
        Widget stat(String l, Object v) => Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: c.card, borderRadius: BorderRadius.circular(16)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(l, style: const TextStyle(fontSize: 11, color: Neutral.c400)), const SizedBox(height: 4), Text('$v', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600, letterSpacing: -.5))]));
        return Column(children: [
          LayoutBuilder(builder: (_, box) {
            final n = box.maxWidth >= 560 ? 4 : 2;
            return Wrap(spacing: 12, runSpacing: 12, children: [for (final s in [('Records', total), ('Data sources', m.values.where((v) => v > 0).length), ('Collections', _collections.length), ('API key', keyOn ? 'On' : 'Off')]) SizedBox(width: (box.maxWidth - 12 * (n - 1)) / n, child: stat(s.$1, s.$2))]);
          }),
          const SizedBox(height: 16),
          CaCard(
            title: 'Data sources',
            action: Lnk(to: '/dashboard/export', child: const Text('Export', style: TextStyle(fontSize: 12, decoration: TextDecoration.underline))),
            child: FullTable(table: DataTable(
              headingTextStyle: const TextStyle(fontSize: 11, color: Neutral.c400),
              dataTextStyle: TextStyle(fontSize: 13, color: c.fg),
              columns: const [DataColumn(label: Text('Collection')), DataColumn(label: Text('Records')), DataColumn(label: Text('API'))],
              rows: [for (final col in _collections) DataRow(cells: [DataCell(Text(col.$2, style: const TextStyle(fontWeight: FontWeight.w500))), DataCell(Text('${m[col.$1] ?? 0}')), DataCell(Text('?collections=${col.$1}', style: const TextStyle(fontFamily: 'GeistMono', fontSize: 11)))])],
            )),
          ),
        ]);
      },
    );
    final body = context.width >= Bp.lg ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [SizedBox(width: 300, child: left), const SizedBox(width: 16), Expanded(child: right)]) : Column(children: [left, const SizedBox(height: 16), right]);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const RunningLowCard(), body]);
  }
}

// ---- Profile -----------------------------------------------------------------------------------------------

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});
  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  late final TextEditingController _name, _username, _email, _pw, _pw2;
  late String _lang;
  late bool _consent = ref.read(authProvider).user!.aiConsent;
  bool _busy = false;
  String? _msg;
  bool _ok = false;

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user!;
    _name = TextEditingController(text: u.name ?? '');
    _username = TextEditingController(text: u.username ?? '');
    _email = TextEditingController(text: u.email);
    _pw = TextEditingController();
    _pw2 = TextEditingController();
    _lang = u.language;
  }

  Future<void> _save() async {
    if (_pw.text.isNotEmpty && _pw.text != _pw2.text) return setState(() { _msg = 'The passwords do not match.'; _ok = false; });
    setState(() { _busy = true; _msg = null; });
    final data = <String, dynamic>{'name': _name.text, 'email': _email.text, 'language': _lang, 'username': _username.text.trim().isEmpty ? null : _username.text.trim().toLowerCase(), if (_pw.text.isNotEmpty) 'password': _pw.text};
    try {
      await ref.read(dashRepoProvider).updateProfile(ref.read(authProvider).user!.id, data);
      await ref.read(authProvider).refresh();
      _pw.clear(); _pw2.clear();
      setState(() { _msg = 'Saved.'; _ok = true; });
    } catch (e) {
      setState(() { _msg = _err(e); _ok = false; });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 576),
        child: CaCard(title: 'Profile', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          CaField(controller: _name, label: 'Name'),
          const SizedBox(height: 16),
          CaField(controller: _username, label: 'Username', hint: '3-30 letters, numbers, - or _'),
          const SizedBox(height: 16),
          CaField(controller: _email, label: 'E-mail', keyboard: TextInputType.emailAddress),
          const SizedBox(height: 16),
          const Text('Language', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Neutral.c500)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(initialValue: _lang, items: [for (final l in languages) DropdownMenuItem(value: l.code, child: Text('${l.flag} ${l.name}'))], onChanged: (v) => setState(() => _lang = v ?? _lang), decoration: const InputDecoration()),
          const SizedBox(height: 16),
          CaField(controller: _pw, label: 'New password (optional)', obscure: true),
          const SizedBox(height: 16),
          CaField(controller: _pw2, label: 'Repeat password', obscure: true),
          const SizedBox(height: 20),
          Row(children: [CaButton('Save', onPressed: _save, busy: _busy), const SizedBox(width: 12), if (_msg != null) Flexible(child: Text(_msg!, style: TextStyle(fontSize: 12, color: _ok ? Colors.green.shade700 : Brand.red)))]),
          if (ref.read(authProvider).user!.isAdmin) ...[
            const Divider(height: 40),
            CaButton('Open admin panel', outlined: true, icon: Icons.open_in_new, onPressed: () async {
              try {
                final r = await ref.read(apiClientProvider).get('/api/ca/admin-link');
                await launchUrl(Uri.parse('${Env.shown}${r['path']}'), webOnlyWindowName: '_blank');
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
              }
            }),
          ],
          const Divider(height: 40),
          const Text('Personal AI suggestions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          const Muted('Let CA7 use your own order history for suggestions and "running low?" reminders. Without this you only get general suggestions.', size: 12),
          SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('I allow this', style: TextStyle(fontSize: 14)), value: _consent, onChanged: (v) async {
            setState(() => _consent = v);
            try { await ref.read(apiClientProvider).post('/api/ca/ai/consent', body: {'consent': v}); await ref.read(authProvider).refresh(); } catch (_) { if (mounted) setState(() => _consent = !v); }
          }),
        ])),
      );
}

// ---- Data Connect --------------------------------------------------------------------------------------------

const _typeLabels = {'rest': 'REST API', 'csv': 'CSV file', 'push': 'Push (IoT, MQTT bridge, scripts)', 'camera': 'Camera (desktop agent)', 'openremote': 'OpenRemote (Enterprise)', 'thingsboard': 'ThingsBoard (Enterprise)'};

class ConnectPage extends ConsumerStatefulWidget {
  const ConnectPage({super.key});
  @override
  ConsumerState<ConnectPage> createState() => _ConnectPageState();
}

class _ConnectPageState extends ConsumerState<ConnectPage> {
  final _name = TextEditingController(), _url = TextEditingController(), _path = TextEditingController(), _headers = TextEditingController();
  final _realm = TextEditingController(text: 'master'), _clientId = TextEditingController(), _assetId = TextEditingController(), _secret = TextEditingController();
  String _type = 'rest';
  String? _msg;
  bool _busy = false, _typeFromUrl = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_typeFromUrl) return;
    _typeFromUrl = true;
    final t = GoRouterState.of(context).uri.queryParameters['type'];
    if (t != null && _typeLabels.containsKey(t)) _type = t;
  }

  Future<void> _run(Future<Object?> Function() fn, [String? ok]) async {
    setState(() { _busy = true; _msg = null; });
    try {
      final r = await fn();
      _msg = ok ?? (r is Map && r['stored'] != null ? '${r['stored']} records saved.' : 'Done.');
      ref.invalidate(sourcesProvider);
    } catch (e) {
      _msg = _err(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _create() async {
    Object? headers;
    if (_headers.text.trim().isNotEmpty) {
      try {
        headers = (await Future.value(_decode(_headers.text)));
      } catch (_) {
        return setState(() => _msg = 'Headers must be JSON, e.g. {"Authorization":"Bearer ..."}');
      }
    }
    await _run(() async {
      await ref.read(dashRepoProvider).createSource({'name': _name.text, 'type': _type, if (_url.text.isNotEmpty) 'url': _url.text, if (headers != null) 'headers': headers, if (_path.text.isNotEmpty) 'recordsPath': _path.text, if (_type == 'openremote' || _type == 'thingsboard') ...{if (_type == 'openremote') 'realm': _realm.text, 'clientId': _clientId.text, if (_assetId.text.isNotEmpty) 'assetId': _assetId.text, 'secret': _secret.text}});
      _name.clear(); _url.clear(); _path.clear(); _headers.clear();
      return null;
    }, 'Data source added.');
  }

  @override
  Widget build(BuildContext context) {
    final sources = ref.watch(sourcesProvider);
    final form = CaCard(title: 'Add a data source', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      DropdownButtonFormField<String>(initialValue: _type, items: [for (final e in _typeLabels.entries) DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontSize: 14)))], onChanged: (v) => setState(() => _type = v ?? 'rest'), decoration: const InputDecoration()),
      const SizedBox(height: 12),
      CaField(controller: _name, hint: 'Name, e.g. Warehouse sensors'),
      if (_type == 'rest') ...[
        const SizedBox(height: 12),
        CaField(controller: _url, hint: 'https://api.example.com/readings', keyboard: TextInputType.url),
        const SizedBox(height: 12),
        CaField(controller: _path, hint: 'Where the list is, e.g. data.items (optional)'),
        const SizedBox(height: 12),
        CaField(controller: _headers, hint: 'Headers as JSON (optional)'),
      ],
      if (_type == 'openremote' || _type == 'thingsboard') ...[
        if (_type == 'openremote') ...[const SizedBox(height: 12), CaField(controller: _realm, hint: 'Realm, e.g. master')],
        const SizedBox(height: 12),
        CaField(controller: _clientId, hint: _type == 'openremote' ? 'Service user (client id)' : 'ThingsBoard user name'),
        const SizedBox(height: 12),
        CaField(controller: _secret, hint: _type == 'openremote' ? 'Client secret' : 'Password', obscure: true),
        const SizedBox(height: 12),
        CaField(controller: _assetId, hint: _type == 'openremote' ? 'Asset id (empty = all assets)' : 'Device id'),
        const Padding(padding: EdgeInsets.only(top: 8), child: Muted('The address of the tool is set on the server. The password is stored encrypted and never shown again.', size: 12)),
      ],
      const SizedBox(height: 16),
      CaButton('Add source', onPressed: _create, busy: _busy),
      if (_msg != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_msg!, style: const TextStyle(fontSize: 12))),
    ]));

    final list = sources.when(
      loading: () => const StateBox.loading(),
      error: (e, _) => StateBox.error(_err(e)),
      data: (items) => items.isEmpty
          ? const StateBox.empty('No data sources yet. Add your first one.')
          : Column(children: [for (final s in items) Padding(padding: const EdgeInsets.only(bottom: 12), child: _SourceCard(s: s, busy: _busy, run: _run))]),
    );
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(padding: EdgeInsets.only(bottom: 16), child: Muted('Connect a REST API, upload a CSV file, or push data from IoT devices, an MQTT bridge or scripts. SQL databases and direct MQTT are not available yet.', size: 14)),
      context.width >= Bp.lg ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [SizedBox(width: 360, child: form), const SizedBox(width: 16), Expanded(child: list)]) : Column(children: [form, const SizedBox(height: 16), list]),
    ]);
  }
}

dynamic _decode(String s) => jsonDecode(s);

class _SourceCard extends ConsumerWidget {
  const _SourceCard({required this.s, required this.busy, required this.run});
  final DataSource s;
  final bool busy;
  final Future<void> Function(Future<Object?> Function() fn, [String? ok]) run;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.read(dashRepoProvider);
    final c = context.ca;
    return CaCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Wrap(alignment: WrapAlignment.spaceBetween, crossAxisAlignment: WrapCrossAlignment.center, runSpacing: 8, spacing: 8, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            Text('${_typeLabels[s.type] ?? s.type} · ${s.recordCount} records${s.lastSyncAt != null ? ' · last data ${s.lastSyncAt!.substring(0, 16).replaceFirst('T', ' ')}' : ''}', style: TextStyle(fontSize: 12, color: c.muted)),
          ]),
          Wrap(spacing: 8, children: [
            if (s.type == 'rest' || s.type == 'openremote' || s.type == 'thingsboard') CaButton('Sync now', small: true, outlined: true, onPressed: busy ? null : () => run(() => repo.syncSource(s.id))),
            if (s.type == 'csv')
              CaButton('Upload CSV', small: true, outlined: true, onPressed: busy ? null : () async {
                final file = await FilePicker.pickFile(type: FileType.custom, allowedExtensions: ['csv']);
                if (file != null) {
                  final bytes = await file.readAsBytes();
                  await run(() => repo.uploadCsv(s.id, utf8.decode(bytes)));
                }
              }),
            CaButton('Delete', small: true, outlined: true, onPressed: busy ? null : () async {
              final ok = await showDialog<bool>(context: context, builder: (d) => AlertDialog(title: Text('Delete ${s.name}?'), actions: [TextButton(onPressed: () => Navigator.pop(d, false), child: const Text('Cancel')), TextButton(onPressed: () => Navigator.pop(d, true), child: const Text('Delete'))]));
              if (ok == true) await run(() => repo.deleteSource(s.id).then((_) => null), 'Deleted.');
            }),
          ]),
        ]),
        if (s.lastError != null && s.lastError!.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(s.lastError!, style: const TextStyle(fontSize: 12, color: Brand.red))),
        if ((s.type == 'push' || s.type == 'camera') && s.ingestToken != null)
          Padding(padding: const EdgeInsets.only(top: 12), child: CodeBox('curl -X POST ${Env.shown}/api/ca/ingest \\\n  -H "X-CA7-Token: ${s.ingestToken}" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"records":[{"temperature":21.5,"humidity":48}]}\'')),
      ]),
    );
  }
}

// ---- Data Intelligence ---------------------------------------------------------------------------------------

final _statsProvider = FutureProvider.autoDispose.family<List<FieldStats>, ({String id, bool detect})>((ref, a) async => analyze(await ref.watch(dashRepoProvider).records(a.id), detectAnomalies: a.detect));

class IntelligencePage extends ConsumerWidget {
  const IntelligencePage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user!;
    final detect = limitsFor(user.plan, admin: user.isAdmin).anomaly;
    final sources = ref.watch(sourcesProvider);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.only(bottom: 16), child: Muted('Statistics and trends per data field, based on the latest 1,000 records of each source.${detect ? ' Values that are more than 3 standard deviations away from the average are marked as unusual.' : ' Anomaly detection is part of the Pro pack.'}', size: 14)),
      if (!detect) Padding(padding: const EdgeInsets.only(bottom: 16), child: CaCard(color: const Color(0xFFFFFBEB), child: Wrap(children: [const Text('Unusual values are not marked on your pack. ', style: TextStyle(fontSize: 14, color: Color(0xFF92400E))), Lnk(to: '/pricing', child: const Text('See packs', style: TextStyle(fontSize: 14, color: Color(0xFF92400E), decoration: TextDecoration.underline)))]))),
      sources.when(
        loading: () => const StateBox.loading(),
        error: (e, _) => StateBox.error(_err(e)),
        data: (items) => items.isEmpty
            ? const StateBox.empty('Connect a data source first (Data Connect).')
            : Column(children: [for (final s in items) Padding(padding: const EdgeInsets.only(bottom: 16), child: _SourceStats(s: s, detect: detect))]),
      ),
    ]);
  }
}

class _SourceStats extends ConsumerWidget {
  const _SourceStats({required this.s, required this.detect});
  final DataSource s;
  final bool detect;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    final stats = ref.watch(_statsProvider((id: s.id, detect: detect)));
    String f(double n) => n.abs() >= 1000 ? n.toStringAsFixed(0) : (n == n.roundToDouble() ? n.toStringAsFixed(0) : n.toStringAsFixed(2));
    return CaCard(title: s.name, child: stats.when(
      loading: () => const StateBox.loading(),
      error: (e, _) => StateBox.error(_err(e)),
      data: (list) => list.isEmpty
          ? const Muted('No numeric data yet.', size: 14)
          : FullTable(table: DataTable(
              headingTextStyle: const TextStyle(fontSize: 11, color: Neutral.c400),
              dataTextStyle: TextStyle(fontSize: 13, color: c.fg),
              columns: [for (final h in ['Field', 'Values', 'Latest', 'Average', 'Min', 'Max', 'Trend', 'Unusual']) DataColumn(label: Text(h))],
              rows: [for (final x in list) DataRow(cells: [DataCell(Text(x.field, style: const TextStyle(fontWeight: FontWeight.w500))), DataCell(Text('${x.count}')), DataCell(Text(f(x.latest))), DataCell(Text(f(x.mean))), DataCell(Text(f(x.min))), DataCell(Text(f(x.max))), DataCell(Text(x.trend == 'up' ? '↑ rising' : x.trend == 'down' ? '↓ falling' : '→ stable')), DataCell(detect ? (x.anomalies > 0 ? Text('${x.anomalies}', style: const TextStyle(color: Brand.red)) : const Text('0')) : const Text('–'))])],
            )),
    ));
  }
}

// ---- Automation -----------------------------------------------------------------------------------------------

class AutomationPage extends ConsumerStatefulWidget {
  const AutomationPage({super.key});
  @override
  ConsumerState<AutomationPage> createState() => _AutomationPageState();
}

class _AutomationPageState extends ConsumerState<AutomationPage> {
  final _name = TextEditingController(), _field = TextEditingController(), _threshold = TextEditingController(), _target = TextEditingController();
  String? _source;
  String _op = 'gt', _action = 'email';
  String? _msg;

  Future<void> _create() async {
    try {
      await ref.read(dashRepoProvider).createAutomation({'name': _name.text, 'source': int.tryParse(_source ?? '') ?? _source, 'field': _field.text, 'operator': _op, if (_op != 'anomaly' && _threshold.text.isNotEmpty) 'threshold': double.tryParse(_threshold.text), 'action': _action, 'target': _target.text});
      ref.invalidate(automationsProvider);
      setState(() => _msg = 'Automation added.');
    } catch (e) {
      setState(() => _msg = _err(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user!;
    final allowed = limitsFor(user.plan, admin: user.isAdmin).automation;
    final sources = ref.watch(sourcesProvider).value ?? const <DataSource>[];
    _source ??= sources.isNotEmpty ? sources.first.id : null;
    final rules = ref.watch(automationsProvider);
    final repo = ref.read(dashRepoProvider);
    const ops = {'gt': '>', 'lt': '<', 'eq': '=', 'anomaly': 'is unusual'};
    final form = CaCard(title: 'New automation', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (!allowed) Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(12)), child: Wrap(children: [const Text('Automation is part of the Business pack. ', style: TextStyle(fontSize: 12, color: Color(0xFF92400E))), Lnk(to: '/pricing', child: const Text('See packs', style: TextStyle(fontSize: 12, color: Color(0xFF92400E), decoration: TextDecoration.underline)))])),
      CaField(controller: _name, hint: 'Name, e.g. Freezer too warm'),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(initialValue: _source, items: [for (final s in sources) DropdownMenuItem(value: s.id, child: Text(s.name))], onChanged: (v) => setState(() => _source = v), decoration: const InputDecoration()),
      const SizedBox(height: 12),
      CaField(controller: _field, hint: 'Field, e.g. temperature'),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: DropdownButtonFormField<String>(initialValue: _op, items: const [DropdownMenuItem(value: 'gt', child: Text('greater than')), DropdownMenuItem(value: 'lt', child: Text('less than')), DropdownMenuItem(value: 'eq', child: Text('equals')), DropdownMenuItem(value: 'anomaly', child: Text('unusual value'))], onChanged: (v) => setState(() => _op = v ?? 'gt'), decoration: const InputDecoration())),
        if (_op != 'anomaly') ...[const SizedBox(width: 8), Expanded(child: CaField(controller: _threshold, hint: 'Value', keyboard: const TextInputType.numberWithOptions(decimal: true, signed: true)))],
      ]),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(initialValue: _action, items: const [DropdownMenuItem(value: 'email', child: Text('Send e-mail')), DropdownMenuItem(value: 'webhook', child: Text('Call a webhook'))], onChanged: (v) => setState(() => _action = v ?? 'email'), decoration: const InputDecoration()),
      const SizedBox(height: 12),
      CaField(controller: _target, hint: _action == 'email' ? 'name@company.com' : 'https://...'),
      const SizedBox(height: 16),
      CaButton('Add automation', onPressed: sources.isEmpty ? null : _create),
      if (sources.isEmpty) const Padding(padding: EdgeInsets.only(top: 8), child: Muted('Connect a data source first.', size: 12)),
      if (_msg != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_msg!, style: const TextStyle(fontSize: 12))),
    ]));
    final list = rules.when(
      loading: () => const StateBox.loading(),
      error: (e, _) => StateBox.error(_err(e)),
      data: (items) => items.isEmpty
          ? const StateBox.empty('No automations yet. They run when new data arrives.')
          : Column(children: [for (final r in items) Padding(padding: const EdgeInsets.only(bottom: 12), child: CaCard(child: Wrap(alignment: WrapAlignment.spaceBetween, crossAxisAlignment: WrapCrossAlignment.center, runSpacing: 8, children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(r.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                Text('When ${r.field} in ${r.sourceName} ${ops[r.operator]} ${r.operator != 'anomaly' ? (r.threshold ?? '') : ''} → ${r.action == 'email' ? 'e-mail' : 'webhook'} ${r.target}', style: const TextStyle(fontSize: 12, color: Neutral.c500)),
                Text('Triggered ${r.triggerCount} times${r.lastTriggeredAt != null ? ', last ${r.lastTriggeredAt!.substring(0, 16).replaceFirst('T', ' ')}' : ''}', style: const TextStyle(fontSize: 12, color: Neutral.c400)),
              ]),
              Wrap(spacing: 8, children: [
                CaButton(r.enabled ? 'Pause' : 'Resume', small: true, outlined: true, onPressed: () async { await repo.patchAutomation(r.id, {'enabled': !r.enabled}); ref.invalidate(automationsProvider); }),
                CaButton('Delete', small: true, outlined: true, onPressed: () async { await repo.deleteAutomation(r.id); ref.invalidate(automationsProvider); }),
              ]),
            ])))]),
    );
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Padding(padding: EdgeInsets.only(bottom: 16), child: Muted('Do something when new data arrives: send an e-mail or call a webhook when a value passes a limit or looks unusual.', size: 14)),
      context.width >= Bp.lg ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [SizedBox(width: 360, child: form), const SizedBox(width: 16), Expanded(child: list)]) : Column(children: [form, const SizedBox(height: 16), list]),
    ]);
  }
}

// ---- Camera Intelligence --------------------------------------------------------------------------------------

class CameraPage extends StatelessWidget {
  const CameraPage({super.key});
  @override
  Widget build(BuildContext context) {
    Widget bullets(List<String> l) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (final x in l) Padding(padding: const EdgeInsets.only(bottom: 4), child: Text('•  $x', style: const TextStyle(fontSize: 14, height: 1.5, color: Neutral.c600)))]);
    final a = CaCard(title: 'CA7 Camera Agent (preview)', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Camera Intelligence runs on your own computer, next to your cameras. The agent reads a snapshot from each camera on your network, measures movement and sends the result to your CA7 account as data. You then see it in Data Intelligence, ask CA7 Chat about it and use it in Automation.', style: TextStyle(fontSize: 14, height: 1.5, color: Neutral.c600)),
      const SizedBox(height: 12),
      Wrap(children: [const Text('1. Add a data source of type Camera in ', style: TextStyle(fontSize: 14)), Lnk(to: '/dashboard/connect?type=camera', child: const Text('Data Connect', style: TextStyle(fontSize: 14, decoration: TextDecoration.underline))), const Text(' and copy its token.', style: TextStyle(fontSize: 14))]),
      const SizedBox(height: 6),
      const Text('2. Install the agent: desktop/ca7-camera-agent in the project (needs Node 20).', style: TextStyle(fontSize: 14)),
      const SizedBox(height: 6),
      const Text('3. Run it with your camera snapshot address and the token (see its README).', style: TextStyle(fontSize: 14)),
    ]));
    final b = CaCard(title: 'What it does today', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      bullets(['Movement score per camera and per interval, sent as records (camera, motion).', 'Works with any camera that gives a JPEG snapshot over HTTP.']),
      const SizedBox(height: 12),
      const Text('Not available yet', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      bullets(['Recognising people, vehicles or objects.', 'RTSP video streams, a graphical app and installers for Windows and macOS.']),
    ]));
    return context.width >= Bp.lg ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: a), const SizedBox(width: 16), Expanded(child: b)]) : Column(children: [a, const SizedBox(height: 16), b]);
  }
}

// ---- API keys ----------------------------------------------------------------------------------------------------

class ApiKeysPage extends ConsumerStatefulWidget {
  const ApiKeysPage({super.key});
  @override
  ConsumerState<ApiKeysPage> createState() => _ApiKeysPageState();
}

class _ApiKeysPageState extends ConsumerState<ApiKeysPage> {
  String? _key, _error;
  bool _busy = false;
  bool? _enabled;

  Future<void> _call(bool create) async {
    setState(() { _busy = true; _error = null; });
    try {
      final repo = ref.read(dashRepoProvider);
      if (create) { _key = await repo.createKey(); _enabled = true; } else { await repo.disableKey(); _key = null; _enabled = false; }
      await ref.read(authProvider).refresh();
    } catch (e) {
      _error = _err(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final enabled = _enabled ?? ref.watch(authProvider).user!.apiKeyEnabled;
    final shown = _key ?? '<your-api-key>';
    return Column(children: [
      CaCard(
        title: 'API key',
        action: Wrap(spacing: 8, children: [if (enabled) CaButton('Disable', small: true, outlined: true, onPressed: _busy ? null : () => _call(false)), CaButton(enabled ? 'Regenerate' : 'Create API key', small: true, onPressed: _busy ? null : () => _call(true))]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text.rich(TextSpan(style: const TextStyle(fontSize: 12, color: Neutral.c500), children: [const TextSpan(text: 'Status: '), TextSpan(text: enabled ? 'Active' : 'Not created', style: TextStyle(fontWeight: FontWeight.w600, color: enabled ? const Color(0xFF059669) : Neutral.c400))])),
          if (_key != null) ...[const SizedBox(height: 12), const Text('Copy it now. For safety it is shown only once.', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFD97706))), const SizedBox(height: 8), CopyField(_key!)],
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(fontSize: 12, color: Brand.red))),
        ]),
      ),
      const SizedBox(height: 16),
      CaCard(title: 'Use the API', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Muted('Read all your data with one request:', size: 12),
        const SizedBox(height: 8),
        CodeBox('curl ${Env.shown}/api/ca/export \\\n  -H "Authorization: users API-Key $shown"'),
        const SizedBox(height: 16),
        const Muted('Only some collections:', size: 12),
        const SizedBox(height: 8),
        CodeBox('curl "${Env.shown}/api/ca/export?collections=orders,products" \\\n  -H "Authorization: users API-Key $shown"'),
        const SizedBox(height: 16),
        Muted('The same header works on the standard Payload REST API, for example ${Env.shown}/api/posts.', size: 12),
      ])),
    ]);
  }
}

// ---- Export & sync -------------------------------------------------------------------------------------------------

class ExportPage extends ConsumerStatefulWidget {
  const ExportPage({super.key});
  @override
  ConsumerState<ExportPage> createState() => _ExportPageState();
}

class _ExportPageState extends ConsumerState<ExportPage> {
  final _selected = <String>{};
  final _target = TextEditingController();
  String? _json, _msg;
  bool _busy = false;

  Future<void> _fetch() async {
    setState(() { _busy = true; _msg = null; });
    try {
      final data = await ref.read(dashRepoProvider).export(_selected.toList());
      _json = const JsonEncoder.withIndent('  ').convert(data);
      _msg = 'Fetched ${(data as Map).length} collections.';
    } catch (e) {
      _msg = _err(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _send() async {
    if (_json == null || _target.text.isEmpty) return;
    setState(() => _busy = true);
    try {
      final res = await ref.read(apiClientProvider).postRaw(_target.text.trim(), _json!);
      _msg = 'Your server answered $res.';
    } catch (e) {
      _msg = _err(e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 760),
        child: CaCard(title: 'Export & sync', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Muted('Fetch all your data through the API and copy it, or send it to your own server.', size: 14),
          const SizedBox(height: 16),
          const Text('Collections (none selected = all)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [for (final col in _collections) FilterChip(label: Text(col.$2, style: const TextStyle(fontSize: 12)), selected: _selected.contains(col.$1), onSelected: (v) => setState(() => v ? _selected.add(col.$1) : _selected.remove(col.$1)), showCheckmark: false, shape: const StadiumBorder())]),
          const SizedBox(height: 16),
          CaField(controller: _target, label: 'Your own server (optional)', hint: 'https://my-server.example/ingest', keyboard: TextInputType.url),
          const SizedBox(height: 4),
          const Muted('The data is sent there with POST as JSON. Your server must allow requests from this app (CORS).', size: 12),
          const SizedBox(height: 16),
          Wrap(spacing: 8, children: [
            CaButton('Fetch data', onPressed: _fetch, busy: _busy),
            if (_json != null) CaButton('Copy JSON', outlined: true, onPressed: () { Clipboard.setData(ClipboardData(text: _json!)); _toast(context, 'Copied'); }),
            if (_json != null && _target.text.isNotEmpty) CaButton('Send to my server', outlined: true, onPressed: _busy ? null : _send),
          ]),
          if (_msg != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_msg!, style: const TextStyle(fontSize: 12))),
          if (_json != null) Padding(padding: const EdgeInsets.only(top: 16), child: ConstrainedBox(constraints: const BoxConstraints(maxHeight: 260), child: SingleChildScrollView(child: CodeBox(_json!.length > 20000 ? '${_json!.substring(0, 20000)}\n…' : _json!)))),
        ])),
      );
}

// ---- Pack & billing -----------------------------------------------------------------------------------------------------

class PlanPage extends ConsumerWidget {
  const PlanPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user!;
    final lim = limitsFor(user.plan, admin: user.isAdmin);
    final usage = ref.watch(_usageProvider);
    final paid = GoRouterState.of(context).uri.queryParameters['paid'] != null;
    Future<void> go(Future<String> Function() f) async {
      try {
        await launchUrl(Uri.parse(await f()), webOnlyWindowName: '_self');
      } catch (e) {
        if (context.mounted) _toast(context, _err(e));
      }
    }

    Widget bar(String label, num used, double max) {
      final unlimited = max.isInfinite;
      final pct = unlimited ? 0.0 : (used / max).clamp(0.0, 1.0);
      return Padding(padding: const EdgeInsets.only(bottom: 16), child: Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(label, style: const TextStyle(fontSize: 12)), Text('${_fmt(used)} / ${unlimited ? 'unlimited' : _fmt(max.toInt())}', style: const TextStyle(fontSize: 12, color: Neutral.c500))]),
        const SizedBox(height: 4),
        ClipRRect(borderRadius: BorderRadius.circular(99), child: LinearProgressIndicator(value: pct, minHeight: 8, backgroundColor: Neutral.c200, color: pct > .9 ? Brand.red : Brand.blue)),
      ]));
    }

    final left = CaCard(title: 'Your pack: ${user.plan[0].toUpperCase()}${user.plan.substring(1)}', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (paid) Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(12)), child: const Text('Thank you! Your pack is updated as soon as the payment is confirmed.', style: TextStyle(fontSize: 14, color: Color(0xFF166534)))),
      Wrap(spacing: 8, runSpacing: 8, children: [
        if (user.plan == 'free') CaButton('Choose Hobby, €20/month', outlined: true, onPressed: () => go(() => ref.read(dashRepoProvider).checkout('hobby'))),
        if (user.plan == 'free' || user.plan == 'hobby') CaButton('Choose Pro, from €99/month', onPressed: () => go(() => ref.read(dashRepoProvider).checkout('pro'))),
        if (user.plan == 'hobby' || user.plan == 'pro') CaButton('Manage or cancel subscription', outlined: true, onPressed: () => go(() => ref.read(dashRepoProvider).portal())),
      ]),
      const SizedBox(height: 12),
      Wrap(children: [const Text('Business and Enterprise are by invoice. ', style: TextStyle(fontSize: 12, color: Neutral.c500)), Lnk(to: '/contact?plan=business', child: const Text('Talk to us', style: TextStyle(fontSize: 12, decoration: TextDecoration.underline))), const Text(' · ', style: TextStyle(fontSize: 12)), Lnk(to: '/pricing', child: const Text('Compare packs', style: TextStyle(fontSize: 12, decoration: TextDecoration.underline)))]),
    ]));
    final right = CaCard(title: 'Usage', child: usage.when(
      loading: () => const StateBox.loading(),
      error: (e, _) => StateBox.error(_err(e)),
      data: (u) => Column(children: [bar('Data sources', u.$1, lim.sources), bar('Stored records', u.$2, lim.records), const Align(alignment: Alignment.centerLeft, child: Muted('API calls per month are counted by the server and refused when the pack is used up.', size: 12))]),
    ));
    return context.width >= Bp.lg ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: left), const SizedBox(width: 16), Expanded(child: right)]) : Column(children: [left, const SizedBox(height: 16), right]);
  }
}

final _usageProvider = FutureProvider.autoDispose<(int, int)>((ref) async {
  final repo = ref.watch(dashRepoProvider);
  return (await repo.count('data-sources'), await repo.count('data-records'));
});

// ---- Platform ---------------------------------------------------------------------------------------------------------------

final _platformProvider = FutureProvider.autoDispose((ref) => ref.watch(dashRepoProvider).platform());

class PlatformPage extends ConsumerWidget {
  const PlatformPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user!;
    if (!user.isAdmin && user.plan != 'enterprise') {
      return ConstrainedBox(constraints: const BoxConstraints(maxWidth: 576), child: CaCard(title: 'Private environment', child: Wrap(children: [const Text('The platform tools (OpenRemote, Dify, Airbyte, ThingsBoard) are part of the Enterprise pack, with your own private environment. ', style: TextStyle(fontSize: 14, height: 1.5)), Lnk(to: '/contact?plan=enterprise', child: const Text('Contact sales', style: TextStyle(fontSize: 14, decoration: TextDecoration.underline)))])));
    }
    const dot = {'online': Brand.green, 'offline': Brand.red, 'not-connected': Neutral.c400};
    const label = {'online': 'Online', 'offline': 'Not reachable', 'not-connected': 'Not connected'};
    return ref.watch(_platformProvider).when(
          loading: () => const StateBox.loading(),
          error: (e, _) => StateBox.error(_err(e)),
          data: (list) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Padding(padding: EdgeInsets.only(bottom: 16), child: Muted('The tools CA7 runs next to this site. CA7 is the front: your account, API, branding and billing. These tools do the work behind it. Install them with platform/install.sh.', size: 14)),
            LayoutBuilder(builder: (_, box) {
              final cols = box.maxWidth >= 700 ? 2 : 1;
              return Wrap(spacing: 16, runSpacing: 16, children: [for (final s in list) SizedBox(width: (box.maxWidth - 16 * (cols - 1)) / cols, child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(s.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)), Row(children: [Container(width: 8, height: 8, decoration: BoxDecoration(color: dot[s.status], shape: BoxShape.circle)), const SizedBox(width: 6), Text(label[s.status] ?? s.status, style: const TextStyle(fontSize: 12, color: Neutral.c500))])]),
                Text(s.role, style: const TextStyle(fontSize: 12, color: Neutral.c400)),
                const SizedBox(height: 8),
                Text(s.text, style: const TextStyle(fontSize: 14, height: 1.5, color: Neutral.c600)),
                const SizedBox(height: 16),
                s.url != null ? CaButton('Open ${s.name}', small: true, onPressed: () => launchUrl(Uri.parse(s.url!), mode: LaunchMode.externalApplication)) : Text('Set ${s.env} (for example ${s.defaultUrl})', style: const TextStyle(fontSize: 12, color: Neutral.c500)),
              ])))]);
            }),
            const SizedBox(height: 16),
            const Muted('The tools have their own logins and are not yet signed in through your CA7 account (single sign-on is not built).', size: 12),
          ]),
        );
  }
}
