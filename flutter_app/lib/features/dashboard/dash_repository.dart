import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/providers.dart';

class DataSource {
  DataSource({required this.id, required this.name, required this.type, this.url, this.ingestToken, this.lastSyncAt, this.lastError, this.recordCount = 0});
  final String id, name, type;
  final String? url, ingestToken, lastSyncAt, lastError;
  final int recordCount;
  factory DataSource.fromJson(Map<String, dynamic> j) => DataSource(id: '${j['id']}', name: '${j['name']}', type: '${j['type']}', url: j['url'] as String?, ingestToken: j['ingestToken'] as String?, lastSyncAt: j['lastSyncAt'] as String?, lastError: j['lastError'] as String?, recordCount: (j['recordCount'] as num?)?.toInt() ?? 0);
}

class AutomationRule {
  AutomationRule({required this.id, required this.name, required this.sourceName, required this.field, required this.operator, this.threshold, required this.action, required this.target, required this.enabled, this.triggerCount = 0, this.lastTriggeredAt});
  final String id, name, sourceName, field, operator, action, target;
  final double? threshold;
  final bool enabled;
  final int triggerCount;
  final String? lastTriggeredAt;
  factory AutomationRule.fromJson(Map<String, dynamic> j) => AutomationRule(
        id: '${j['id']}', name: '${j['name']}', sourceName: j['source'] is Map ? '${j['source']['name']}' : '${j['source']}', field: '${j['field']}', operator: '${j['operator']}',
        threshold: (j['threshold'] as num?)?.toDouble(), action: '${j['action']}', target: '${j['target']}', enabled: j['enabled'] == true, triggerCount: (j['triggerCount'] as num?)?.toInt() ?? 0, lastTriggeredAt: j['lastTriggeredAt'] as String?,
      );
}

class PlatformService {
  PlatformService({required this.id, required this.name, required this.role, required this.text, required this.env, required this.defaultUrl, this.url, required this.status});
  final String id, name, role, text, env, defaultUrl, status;
  final String? url;
  factory PlatformService.fromJson(Map<String, dynamic> j) => PlatformService(id: '${j['id']}', name: '${j['name']}', role: '${j['role']}', text: '${j['text']}', env: '${j['env']}', defaultUrl: '${j['defaultUrl']}', url: j['url'] as String?, status: '${j['status']}');
}

/// Calls of the dashboard to the existing backend (Payload REST + /api/ca/*).
class DashRepository {
  DashRepository(this.api);
  final ApiClient api;

  Future<List<DataSource>> sources() async => ((await api.get('/api/data-sources', query: {'limit': 100, 'sort': '-createdAt', 'depth': 0}))['docs'] as List).map((d) => DataSource.fromJson(Map<String, dynamic>.from(d as Map))).toList();
  Future<void> createSource(Map<String, dynamic> body) => api.post('/api/data-sources', body: body);
  Future<void> deleteSource(String id) => api.delete('/api/data-sources/$id');
  Future<Map> syncSource(String id) async => (await api.post('/api/ca/sources/$id/sync')) as Map;
  Future<Map> uploadCsv(String id, String csv) async => (await api.post('/api/ca/sources/$id/csv', text: csv)) as Map;

  Future<List<Map<String, dynamic>>> records(String sourceId) async => ((await api.get('/api/data-records', query: {'where[source][equals]': sourceId, 'sort': '-recordedAt', 'limit': 1000, 'depth': 0}))['docs'] as List).reversed.map((d) => Map<String, dynamic>.from((d as Map)['data'] as Map)).toList();

  Future<List<AutomationRule>> automations() async => ((await api.get('/api/automations', query: {'limit': 100, 'sort': '-createdAt', 'depth': 1}))['docs'] as List).map((d) => AutomationRule.fromJson(Map<String, dynamic>.from(d as Map))).toList();
  Future<void> createAutomation(Map<String, dynamic> body) => api.post('/api/automations', body: body);
  Future<void> patchAutomation(String id, Map<String, dynamic> body) => api.patch('/api/automations/$id', body: body);
  Future<void> deleteAutomation(String id) => api.delete('/api/automations/$id');

  Future<int> count(String collection) async => ((await api.get('/api/$collection', query: {'limit': 0, 'depth': 0}))['totalDocs'] as num).toInt();

  Future<String> createKey() async => (await api.post('/api/ca/key'))['apiKey'] as String;
  Future<void> disableKey() => api.delete('/api/ca/key');

  Future<String> checkout(String plan) async => (await api.post('/api/ca/billing/checkout', body: {'plan': plan}))['url'] as String;
  Future<String> portal() async => (await api.post('/api/ca/billing/portal'))['url'] as String;

  Future<List<PlatformService>> platform() async => ((await api.get('/api/ca/platform'))['services'] as List).map((s) => PlatformService.fromJson(Map<String, dynamic>.from(s as Map))).toList();

  Future<Map<String, dynamic>> updateProfile(String id, Map<String, dynamic> data) async => Map<String, dynamic>.from(((await api.patch('/api/users/$id', body: data)) as Map)['doc'] as Map);

  Future<dynamic> export(List<String> collections) => api.get('/api/ca/export', query: collections.isEmpty ? null : {'collections': collections.join(',')});
}

final dashRepoProvider = Provider((ref) => DashRepository(ref.watch(apiClientProvider)));
final sourcesProvider = FutureProvider.autoDispose((ref) => ref.watch(dashRepoProvider).sources());
final automationsProvider = FutureProvider.autoDispose((ref) => ref.watch(dashRepoProvider).automations());
