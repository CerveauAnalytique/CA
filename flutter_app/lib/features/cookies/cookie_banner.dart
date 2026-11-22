import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../app/theme/colors.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/atoms.dart';

/// The cookie choice. Necessary cookies are always on. A visitor's choice is kept on the device;
/// once logged in it is saved on the account (and an earlier account choice wins on a new device).
class CookieChoice {
  const CookieChoice({this.decided = false, this.analytics = false, this.marketing = false});
  final bool decided, analytics, marketing;
}

class CookieController extends ChangeNotifier {
  CookieController(this.ref);
  final Ref ref;
  CookieChoice local = const CookieChoice();
  bool loaded = false;
  static const _key = 'ca7.cookies';

  Future<void> load() async {
    try {
      final raw = (await SharedPreferences.getInstance()).getString(_key);
      if (raw != null) {
        final m = jsonDecode(raw) as Map;
        local = CookieChoice(decided: true, analytics: m['analytics'] == true, marketing: m['marketing'] == true);
      }
    } catch (_) {}
    loaded = true;
    notifyListeners();
  }

  /// The choice that counts now: the account's when it has one, else the device's.
  CookieChoice get effective {
    final u = ref.read(authProvider).user;
    if (u != null && u.cookiesDecided) return CookieChoice(decided: true, analytics: u.cookieAnalytics, marketing: u.cookieMarketing);
    return local;
  }

  Future<void> save({required bool analytics, required bool marketing}) async {
    local = CookieChoice(decided: true, analytics: analytics, marketing: marketing);
    try {
      await (await SharedPreferences.getInstance()).setString(_key, jsonEncode({'analytics': analytics, 'marketing': marketing}));
    } catch (_) {}
    notifyListeners();
    await pushToAccount();
  }

  /// Saves the device's choice on the account when the account has none yet.
  Future<void> pushToAccount() async {
    final auth = ref.read(authProvider);
    if (auth.user == null || auth.user!.cookiesDecided || !local.decided) return;
    try {
      await ref.read(apiClientProvider).post('/api/ca/cookies', body: {'analytics': local.analytics, 'marketing': local.marketing});
      await auth.refresh();
    } catch (_) {}
    notifyListeners();
  }
}

final cookieProvider = ChangeNotifierProvider<CookieController>((ref) {
  final c = CookieController(ref)..load();
  ref.listen(authProvider, (_, __) => c.pushToAccount());
  return c;
});

class CookieBanner extends ConsumerStatefulWidget {
  const CookieBanner({super.key});
  @override
  ConsumerState<CookieBanner> createState() => _CookieBannerState();
}

class _CookieBannerState extends ConsumerState<CookieBanner> {
  bool _custom = false, _analytics = false, _marketing = false;

  @override
  Widget build(BuildContext context) {
    final cookies = ref.watch(cookieProvider);
    ref.watch(authProvider);
    if (!cookies.loaded || cookies.effective.decided) return const SizedBox.shrink();
    final c = context.ca;
    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          constraints: const BoxConstraints(maxWidth: 560),
          decoration: BoxDecoration(color: c.bg, border: Border.all(color: c.border), borderRadius: BorderRadius.circular(16), boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 24, offset: Offset(0, 8))]),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(context.t('Cookies'), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text(context.t('We use necessary cookies to make the site work. Statistics and marketing cookies are only used if you allow them. You can change this any time in Settings.'), style: TextStyle(fontSize: 13, color: c.muted, height: 1.45)),
            if (_custom) ...[
              const SizedBox(height: 8),
              const SwitchListTile(contentPadding: EdgeInsets.zero, dense: true, title: Text('Necessary', style: TextStyle(fontSize: 13)), value: true, onChanged: null),
              SwitchListTile(contentPadding: EdgeInsets.zero, dense: true, title: Text(context.t('Statistics'), style: const TextStyle(fontSize: 13)), value: _analytics, onChanged: (v) => setState(() => _analytics = v)),
              SwitchListTile(contentPadding: EdgeInsets.zero, dense: true, title: Text(context.t('Marketing'), style: const TextStyle(fontSize: 13)), value: _marketing, onChanged: (v) => setState(() => _marketing = v)),
            ],
            const SizedBox(height: 14),
            Wrap(spacing: 8, runSpacing: 8, children: [
              CaButton(context.t('Accept all'), small: true, onPressed: () => cookies.save(analytics: true, marketing: true)),
              CaButton(context.t('Only necessary'), small: true, outlined: true, onPressed: () => cookies.save(analytics: false, marketing: false)),
              if (!_custom) CaButton(context.t('Choose'), small: true, outlined: true, onPressed: () => setState(() => _custom = true)) else CaButton(context.t('Save choice'), small: true, outlined: true, onPressed: () => cookies.save(analytics: _analytics, marketing: _marketing)),
            ]),
          ]),
        ),
      ),
    );
  }
}

/// Settings card: change the choice (saved on the account).
class CookieSettings extends ConsumerWidget {
  const CookieSettings({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cookies = ref.watch(cookieProvider);
    ref.watch(authProvider);
    final e = cookies.effective;
    Future<void> set(bool a, bool m) async {
      final auth = ref.read(authProvider);
      cookies.local = CookieChoice(decided: true, analytics: a, marketing: m);
      try {
        await ref.read(apiClientProvider).post('/api/ca/cookies', body: {'analytics': a, 'marketing': m});
        await auth.refresh();
      } catch (_) {}
      await cookies.save(analytics: a, marketing: m);
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Cookies', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      const SizedBox(height: 6),
      const Muted('Necessary cookies are always on. Your choice is saved on your account and follows you to other devices.', size: 12),
      const SwitchListTile(contentPadding: EdgeInsets.zero, title: Text('Necessary', style: TextStyle(fontSize: 14)), value: true, onChanged: null),
      SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Statistics', style: TextStyle(fontSize: 14)), value: e.analytics, onChanged: (v) => set(v, e.marketing)),
      SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Marketing', style: TextStyle(fontSize: 14)), value: e.marketing, onChanged: (v) => set(e.analytics, v)),
    ]);
  }
}
