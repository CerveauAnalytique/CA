/// Build-time configuration: flutter run --dart-define=CA7_API=https://cloud.ca7.io
class Env {
  /// Base URL of the existing CA7 backend (Next.js + Payload). The Flutter app only calls its /api routes.
  static const api = String.fromEnvironment('CA7_API', defaultValue: 'http://localhost:3000');

  /// Domains that only show the chat (the rest opens on the cloud domain).
  static const _chat = String.fromEnvironment('CA7_CHAT_HOSTS', defaultValue: 'ca7.io,ca7.nl,ca7.be');
  static List<String> get chatHosts => _chat.split(',').map((h) => h.trim()).where((h) => h.isNotEmpty).toList();
  static const cloudHost = String.fromEnvironment('CA7_CLOUD_HOST', defaultValue: 'cloud.ca7.io');
}
