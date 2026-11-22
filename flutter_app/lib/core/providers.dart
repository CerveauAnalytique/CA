import 'package:flutter/material.dart' show ThemeMode;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'api/api_client.dart';
import 'auth/auth_controller.dart';
import 'i18n/i18n.dart';
import 'storage/token_storage.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());
final i18nProvider = ChangeNotifierProvider<I18n>((ref) => I18n());
final authProvider = ChangeNotifierProvider<AuthController>(
  (ref) => AuthController(ref.watch(apiClientProvider), ref.watch(tokenStorageProvider)),
);

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);
