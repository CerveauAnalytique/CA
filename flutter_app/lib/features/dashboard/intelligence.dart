import 'dart:math' as math;

/// Port of src/lib/intelligence.ts: statistics, trend and unusual values (more than 3 standard deviations).
class FieldStats {
  FieldStats({required this.field, required this.count, required this.min, required this.max, required this.mean, required this.std, required this.latest, required this.trend, required this.anomalies});
  final String field, trend; // up | down | flat
  final int count, anomalies;
  final double min, max, mean, std, latest;
}

List<FieldStats> analyze(List<Map<String, dynamic>> records, {required bool detectAnomalies}) {
  final fields = <String, List<double>>{};
  for (final r in records) {
    r.forEach((k, v) {
      if (v is num && v.isFinite) fields.putIfAbsent(k, () => []).add(v.toDouble());
    });
  }
  final out = <FieldStats>[];
  fields.forEach((field, vals) {
    if (vals.length < 2) return;
    final mean = vals.reduce((a, b) => a + b) / vals.length;
    final std = math.sqrt(vals.map((v) => (v - mean) * (v - mean)).reduce((a, b) => a + b) / vals.length);
    final half = vals.length ~/ 2;
    final first = vals.take(half).fold<double>(0, (a, b) => a + b) / math.max(half, 1);
    final last = vals.skip(half).fold<double>(0, (a, b) => a + b) / math.max(vals.length - half, 1);
    final delta = std != 0 ? (last - first) / std : 0;
    final anomalies = detectAnomalies && std > 0 ? vals.where((v) => ((v - mean) / std).abs() > 3).length : 0;
    out.add(FieldStats(field: field, count: vals.length, min: vals.reduce(math.min), max: vals.reduce(math.max), mean: mean, std: std, latest: vals.last, trend: delta > .5 ? 'up' : (delta < -.5 ? 'down' : 'flat'), anomalies: math.min(anomalies, 10)));
  });
  return out;
}
