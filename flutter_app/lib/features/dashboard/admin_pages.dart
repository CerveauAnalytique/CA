import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/colors.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';
import '../ai/ai_pages.dart';

/// Security dashboard and AI Control Center (admins only): the same data and actions as the backend routes
/// /api/ca/security and /api/ca/ai/admin, which check the admin role themselves.
final _securityProvider = FutureProvider.autoDispose((ref) async => Map<String, dynamic>.from(await ref.watch(apiClientProvider).get('/api/ca/security') as Map));
final _aiProvider = FutureProvider.autoDispose((ref) async => Map<String, dynamic>.from(await ref.watch(apiClientProvider).get('/api/ca/ai/admin') as Map));

const _levelColor = {'LOW': Neutral.c200, 'MEDIUM': Color(0xFFFEF3C7), 'HIGH': Color(0xFFFED7AA), 'CRITICAL': Color(0xFFFECACA)};
List<Map<String, dynamic>> _list(dynamic v) => ((v ?? const []) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();

Widget _chip(String text, Color bg) => Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)), child: Text(text, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Neutral.c900)));

class SecurityPage extends ConsumerWidget {
  const SecurityPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null || !user.isAdmin) return const StateBox.empty('Only admins can see the security dashboard.');
    final api = ref.watch(apiClientProvider);
    Future<void> act(Map<String, dynamic> body) async {
      try { await api.post('/api/ca/security', body: body); } catch (e) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'))); }
      ref.invalidate(_securityProvider);
    }
    return ref.watch(_securityProvider).when(
          loading: () => const StateBox.loading(),
          error: (e, _) => StateBox.error('$e'),
          data: (d) {
            final lv = Map<String, dynamic>.from(d['level24h'] as Map);
            final alerts = _list(d['alerts']), blocks = _list(d['blocks']), events = _list(d['events']), suspended = _list(d['suspended']), rules = _list(d['rules']);
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Padding(padding: EdgeInsets.only(bottom: 16), child: Muted('Every activity is checked against fixed block rules, 24/7, without an AI service. LOW is logged, MEDIUM flagged, HIGH restricted for a while with an alert, CRITICAL blocked and sessions ended. Accounts are never deleted and money is never touched automatically.', size: 14)),
              Wrap(spacing: 12, runSpacing: 12, children: [for (final l in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) SizedBox(width: 160, child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_chip(l, _levelColor[l]!), const SizedBox(height: 8), Text('${lv[l] ?? 0}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600)), const Text('last 24 hours', style: TextStyle(fontSize: 11, color: Neutral.c400))])))]),
              const SizedBox(height: 16),
              CaCard(title: 'Open alerts (${alerts.length})', child: alerts.isEmpty ? const Muted('No open alerts.', size: 14) : Column(children: [
                for (final a in alerts)
                  Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Wrap(spacing: 8, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
                    _chip('${a['level']}', _levelColor[a['level']] ?? Neutral.c200),
                    Text('${a['summary']}', style: const TextStyle(fontSize: 13)),
                    CaButton('Confirm', small: true, outlined: true, onPressed: () => act({'action': 'review', 'id': a['id'], 'decision': 'confirmed'})),
                    CaButton('False positive (lift blocks)', small: true, outlined: true, onPressed: () => act({'action': 'review', 'id': a['id'], 'decision': 'false_positive'})),
                    if (a['userId'] != null) CaButton('Suspend user', small: true, outlined: true, onPressed: () => act({'action': 'suspend', 'id': a['userId'], 'reason': a['summary']})),
                    if (a['userId'] != null) CaButton('Log out everywhere', small: true, outlined: true, onPressed: () => act({'action': 'logout', 'id': a['userId']})),
                  ])),
              ])),
              const SizedBox(height: 16),
              LayoutBuilder(builder: (_, box) {
                final two = box.maxWidth >= 800;
                final b = CaCard(title: 'Active blocks (${blocks.length})', child: Column(children: [for (final x in blocks) ListTile(dense: true, contentPadding: EdgeInsets.zero, title: Text('${x['subjectType']} · ${x['reason']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)), trailing: CaButton('Lift', small: true, outlined: true, onPressed: () => act({'action': 'lift_block', 'id': x['id']})))]));
                final s = CaCard(title: 'Suspended accounts (${suspended.length})', child: Column(children: [for (final u in suspended) ListTile(dense: true, contentPadding: EdgeInsets.zero, title: Text('${u['email']}', style: const TextStyle(fontSize: 13)), trailing: CaButton('Restore', small: true, outlined: true, onPressed: () => act({'action': 'restore', 'id': u['id']})))]));
                return two ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: b), const SizedBox(width: 16), Expanded(child: s)]) : Column(children: [b, const SizedBox(height: 16), s]);
              }),
              const SizedBox(height: 16),
              CaCard(
                title: 'Activity log',
                action: CaButton('Copy CSV', small: true, outlined: true, onPressed: () async {
                  final csv = ['time,category,level,score,user,network,rules', for (final e in events) '${e['createdAt']},${e['category']},${e['level']},${e['score']},${e['userId'] ?? ''},${e['ipMasked'] ?? ''},${e['rules'] ?? ''}'].join('\n');
                  await Clipboard.setData(ClipboardData(text: csv));
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied. The full export is GET /api/ca/security/export.')));
                }),
                child: FullTable(table: DataTable(
                  headingTextStyle: const TextStyle(fontSize: 11, color: Neutral.c400),
                  dataTextStyle: TextStyle(fontSize: 12.5, color: context.ca.fg),
                  columns: [for (final h in ['Time', 'Activity', 'Level', 'Score', 'User', 'Network', 'Rules']) DataColumn(label: Text(h))],
                  rows: [for (final e in events) DataRow(cells: [DataCell(Text('${e['createdAt']}'.replaceFirst('T', ' ').substring(0, 16))), DataCell(Text('${e['category']}')), DataCell(_chip('${e['level']}', _levelColor[e['level']] ?? Neutral.c200)), DataCell(Text('${e['score']}')), DataCell(Text('${e['userId'] ?? ''}')), DataCell(Text('${e['ipMasked'] ?? ''}')), DataCell(Text('${e['rules'] ?? ''}'))])],
                )),
              ),
              const SizedBox(height: 16),
              CaCard(title: 'Rules', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Muted('Change score, threshold or window, or switch a rule off, in the admin panel under Security > Rules.', size: 12),
                const SizedBox(height: 8),
                for (final r in rules) Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Text('${r['key']} · ${r['label']} · ${r['threshold']} in ${r['windowMinutes']} min · score ${r['score']}${(r['override'] is Map && r['override']['enabled'] == false) ? ' · off' : ''}', style: const TextStyle(fontSize: 12.5))),
              ])),
            ]);
          },
        );
  }
}

class AiCenterPage extends ConsumerWidget {
  const AiCenterPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null || !user.isAdmin) return const StateBox.empty('Only admins can open the AI Control Center.');
    final api = ref.watch(apiClientProvider);
    Future<void> act(Map<String, dynamic> body) async {
      try { await api.post('/api/ca/ai/admin', body: body); } catch (_) {}
      ref.invalidate(_aiProvider);
    }
    const flags = {'assistant': 'AI shopping assistant', 'recommendations': 'Recommendations', 'offers': 'Personal offers', 'runningLow': '"Running low?" suggestions', 'smartSearch': 'Smart search'};
    return ref.watch(_aiProvider).when(
          loading: () => const StateBox.loading(),
          error: (e, _) => StateBox.error('$e'),
          data: (d) {
            final kpi = Map<String, dynamic>.from(d['kpi'] as Map), fl = Map<String, dynamic>.from(d['flags'] as Map), job = Map<String, dynamic>.from(d['job'] as Map);
            final versions = _list(d['versions']), policy = _list(d['policy']), decisions = _list(d['decisions']);
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Padding(padding: EdgeInsets.only(bottom: 16), child: Muted('The Compliance Engine checks everything the AI wants to show against the real prices, stock, discounts and the customer\'s consent, and blocks or corrects what does not match. Personal data is only used after the customer opts in.', size: 14)),
              CaCard(title: 'Language model', child: Text(ref.watch(aiStatusProvider).value?['mode'] == 'model' ? 'Online: the assistant answers with the model (checked by the Compliance Engine).' : 'Not installed or not reachable. The assistant answers from the product catalog with plain code. Install it with ai/ca7/build.sh (docs/ai/DEPLOYMENT.md).', style: const TextStyle(fontSize: 13))),
              const SizedBox(height: 12),
              Wrap(spacing: 12, runSpacing: 12, children: [for (final e in {'Checked (7 days)': kpi['total'], 'Allowed': kpi['allowed'], 'Corrected': kpi['corrected'], 'Blocked': kpi['blocked']}.entries) SizedBox(width: 170, child: CaCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(e.key, style: const TextStyle(fontSize: 11, color: Neutral.c400)), const SizedBox(height: 4), Text('${e.value}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600))])))]),
              const SizedBox(height: 16),
              LayoutBuilder(builder: (_, box) {
                final two = box.maxWidth >= 800;
                final f = CaCard(title: 'Feature flags', child: Column(children: [for (final e in flags.entries) SwitchListTile(dense: true, contentPadding: EdgeInsets.zero, title: Text(e.value, style: const TextStyle(fontSize: 13)), value: fl[e.key] != false, onChanged: (v) => act({'action': 'flag', 'name': e.key, 'value': v}))]));
                final v = CaCard(title: 'Ranking model versions', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  for (final x in versions) ListTile(dense: true, contentPadding: EdgeInsets.zero, title: Text('${x['version']} ${x['note'] ?? ''}', style: const TextStyle(fontSize: 13)), subtitle: Text('popularity ${x['popularity']}, together ${x['coPurchase']}, personal ${x['personal']}', style: const TextStyle(fontSize: 11)), trailing: d['activeVersion'] == x['version'] ? const Text('Active', style: TextStyle(fontSize: 12, color: Brand.green)) : CaButton('Switch / roll back', small: true, outlined: true, onPressed: () => act({'action': 'version', 'version': x['version']}))),
                  const Muted('Add a version in the admin panel (Globals > AI settings), then switch to it here.', size: 12),
                ]));
                return two ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Expanded(child: f), const SizedBox(width: 16), Expanded(child: v)]) : Column(children: [f, const SizedBox(height: 16), v]);
              }),
              const SizedBox(height: 16),
              CaCard(title: 'Recommendation job', action: CaButton('Run now', small: true, outlined: true, onPressed: () => act({'action': 'job'})), child: Text(job['at'] != null ? 'Last run ${job['at']}: ${job['status']}' : 'Not run yet.', style: const TextStyle(fontSize: 13))),
              const SizedBox(height: 16),
              CaCard(title: 'Policy rules', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (final p in policy) Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Text('${p['key']} · ${p['enabled'] == true ? p['action'] : 'off'}${p['value'] != null ? ' · ${p['value']}' : ''}', style: const TextStyle(fontSize: 12.5))), const SizedBox(height: 8), const Muted('Change them in the admin panel under AI Control Center > Policy rules.', size: 12)])),
              const SizedBox(height: 16),
              CaCard(title: 'Compliance decisions and traces', child: FullTable(table: DataTable(
                headingTextStyle: const TextStyle(fontSize: 11, color: Neutral.c400),
                dataTextStyle: TextStyle(fontSize: 12.5, color: context.ca.fg),
                columns: [for (final h in ['Time', 'Feature', 'Decision', 'Violations']) DataColumn(label: Text(h))],
                rows: [for (final x in decisions) DataRow(cells: [DataCell(Text('${x['createdAt']}'.replaceFirst('T', ' ').substring(0, 16))), DataCell(Text('${x['feature']}')), DataCell(Text('${x['decision']}')), DataCell(Text('${x['violations']}'))])],
              ))),
            ]);
          },
        );
  }
}
