import 'package:flutter/foundation.dart';
import '../api/api_client.dart';
import '../storage/token_storage.dart';
import 'user.dart';

/// Login state. Uses the existing endpoints of the website: /api/users/login, /me, /create, /forgot-password.
class AuthController extends ChangeNotifier {
  AuthController(this.api, this.storage);
  final ApiClient api;
  final TokenStorage storage;

  CaUser? user;
  bool ready = false;

  /// Restores the session from the stored token.
  Future<void> restore() async {
    final token = await storage.read();
    if (token != null) {
      api.token = token;
      try {
        await refresh();
      } catch (_) {
        await _drop();
      }
    }
    ready = true;
    notifyListeners();
  }

  Future<void> refresh() async {
    final res = await api.get('/api/users/me');
    final u = res is Map ? res['user'] : null;
    if (u == null) {
      await _drop();
    } else {
      user = CaUser.fromJson(Map<String, dynamic>.from(u as Map));
    }
    notifyListeners();
  }

  Future<CaUser> login(String email, String password) async {
    final res = await api.post('/api/users/login', body: {'email': email, 'password': password});
    api.token = res['token'] as String?;
    if (api.token == null) throw Exception('Login failed');
    await storage.write(api.token!);
    user = CaUser.fromJson(Map<String, dynamic>.from(res['user'] as Map));
    notifyListeners();
    return user!;
  }

  Future<CaUser> signup({required String email, required String password, String? name, String language = 'en'}) async {
    await api.post('/api/users', body: {'email': email, 'password': password, 'name': name, 'language': language});
    return login(email, password);
  }

  Future<void> forgotPassword(String email) => api.post('/api/users/forgot-password', body: {'email': email});

  Future<void> logout() async {
    try {
      await api.post('/api/users/logout');
    } catch (_) {}
    await _drop();
    notifyListeners();
  }

  Future<void> _drop() async {
    api.token = null;
    user = null;
    await storage.clear();
  }
}
