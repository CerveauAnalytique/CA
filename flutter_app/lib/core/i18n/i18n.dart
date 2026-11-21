import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class Language {
  const Language(this.code, this.name, this.flag, {this.rtl = false});
  final String code, name, flag;
  final bool rtl;
}

/// Same seven languages as the website (src/i18n/config.ts).
const languages = [
  Language('en', 'English', '🇬🇧'),
  Language('nl', 'Nederlands', '🇳🇱'),
  Language('de', 'Deutsch', '🇩🇪'),
  Language('fr', 'Français', '🇫🇷'),
  Language('es', 'Español', '🇪🇸'),
  Language('pl', 'Polski', '🇵🇱'),
  Language('ar', 'العربية', '🇸🇦', rtl: true),
];

bool isLang(String? c) => languages.any((l) => l.code == c);

/// Texts are keyed by the English text, exactly like the website (assets/i18n/*.json are exported from
/// src/i18n/translations/*.ts with tool_export_translations.mjs). Unknown texts show in English.
class I18n extends ChangeNotifier {
  I18n({this.loader}) ;
  final Future<String> Function(String code)? loader;
  String _lang = 'en';
  Map<String, String> _map = const {};
  final Map<String, Map<String, String>> _cache = {};

  String get lang => _lang;
  bool get rtl => languages.firstWhere((l) => l.code == _lang).rtl;

  Future<void> setLang(String code) async {
    if (!isLang(code) || code == _lang && (_map.isNotEmpty || code == 'en')) return;
    if (code == 'en') {
      _map = const {};
    } else {
      _map = _cache[code] ??= await _load(code);
    }
    _lang = code;
    notifyListeners();
  }

  Future<Map<String, String>> _load(String code) async {
    try {
      final raw = await (loader?.call(code) ?? rootBundle.loadString('assets/i18n/$code.json'));
      return (jsonDecode(raw) as Map).map((k, v) => MapEntry(k as String, v as String));
    } catch (_) {
      return const {};
    }
  }

  String t(String text, [Map<String, String>? vars]) {
    var out = _map[text] ?? text;
    vars?.forEach((k, v) => out = out.replaceAll('{$k}', v));
    return out;
  }
}

class I18nScope extends InheritedNotifier<I18n> {
  const I18nScope({super.key, required I18n super.notifier, required super.child});
  static I18n of(BuildContext c) => c.dependOnInheritedWidgetOfExactType<I18nScope>()!.notifier!;
}

extension I18nX on BuildContext {
  String t(String text, [Map<String, String>? vars]) => I18nScope.of(this).t(text, vars);
  String get lang => I18nScope.of(this).lang;
}
