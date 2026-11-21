/// The logged-in customer (fields of the Payload `users` collection that the app uses).
class CaUser {
  CaUser({required this.id, required this.email, this.name, this.username, this.language = 'en', this.plan = 'free', this.roles = const [], this.apiKeyEnabled = false});

  final String id;
  final String email;
  final String? name, username;
  final String language, plan;
  final List<String> roles;
  final bool apiKeyEnabled;

  bool get isAdmin => roles.contains('admin');

  /// Same rule as src/utilities/formatUserDisplayName.
  String get displayName => (name != null && name!.trim().isNotEmpty) ? name! : email.split('@').first;

  factory CaUser.fromJson(Map<String, dynamic> j) => CaUser(
        id: j['id'].toString(),
        email: (j['email'] ?? '') as String,
        name: j['name'] as String?,
        username: j['username'] as String?,
        language: (j['language'] ?? 'en') as String,
        plan: (j['plan'] ?? 'free') as String,
        roles: ((j['roles'] ?? const []) as List).map((e) => e.toString()).toList(),
        apiKeyEnabled: j['enableAPIKey'] == true,
      );
}
