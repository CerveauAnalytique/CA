import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Keeps the login token in secure storage (Keychain / Keystore; on the web an encrypted browser store).
class TokenStorage {
  TokenStorage([FlutterSecureStorage? s]) : _s = s ?? const FlutterSecureStorage();
  final FlutterSecureStorage _s;
  static const _key = 'ca7_token';

  Future<String?> read() async {
    try {
      return await _s.read(key: _key);
    } catch (_) {
      return null;
    }
  }

  Future<void> write(String token) => _s.write(key: _key, value: token);
  Future<void> clear() => _s.delete(key: _key);
}
