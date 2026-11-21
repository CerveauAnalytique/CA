/// Build-time configuration: flutter run --dart-define=CA7_API=https://cloud.ca7.io
class Env {
  /// Base URL of the existing CA7 backend (Next.js + Payload). The Flutter app only calls its /api routes.
  static const api = String.fromEnvironment('CA7_API', defaultValue: 'http://localhost:3000');
}
