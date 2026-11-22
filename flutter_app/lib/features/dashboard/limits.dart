/// Mirror of src/lib/limits.ts. The backend enforces these; the app only shows them.
class Limits {
  const Limits({required this.sources, required this.apiCalls, required this.records, required this.anomaly, required this.automation});
  final double sources, apiCalls, records;
  final bool anomaly, automation;
}

const _inf = double.infinity;
const limits = {
  'free': Limits(sources: 3, apiCalls: 1000, records: 10000, anomaly: false, automation: false),
  'hobby': Limits(sources: 10, apiCalls: 50000, records: 500000, anomaly: false, automation: false),
  'pro': Limits(sources: 50, apiCalls: 500000, records: 5000000, anomaly: true, automation: false),
  'business': Limits(sources: _inf, apiCalls: 5000000, records: 50000000, anomaly: true, automation: true),
  'enterprise': Limits(sources: _inf, apiCalls: _inf, records: _inf, anomaly: true, automation: true),
};

Limits limitsFor(String plan, {bool admin = false}) => admin ? limits['enterprise']! : (limits[plan] ?? limits['free']!);
