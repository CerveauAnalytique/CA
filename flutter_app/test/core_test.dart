import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ca7_app/core/api/api_client.dart';
import 'package:ca7_app/core/auth/auth_controller.dart';
import 'package:ca7_app/core/errors/app_exception.dart';
import 'package:ca7_app/core/i18n/i18n.dart';
import 'package:ca7_app/core/storage/token_storage.dart';
import 'package:ca7_app/features/dashboard/intelligence.dart';
import 'package:ca7_app/features/dashboard/limits.dart';
import 'package:ca7_app/features/pricing/plans.dart';

class _MemStorage extends TokenStorage {
  String? v;
  @override
  Future<String?> read() async => v;
  @override
  Future<void> write(String token) async => v = token;
  @override
  Future<void> clear() async => v = null;
}

void main() {
  group('ApiClient', () {
    test('sends the JWT and decodes Payload errors like the website', () async {
      late http.BaseRequest seen;
      final api = ApiClient(base: 'http://x', client: MockClient((req) async {
        seen = req;
        return http.Response(jsonEncode({'errors': [{'message': 'The following field is invalid: Username', 'data': {'errors': [{'message': 'This username is reserved.'}]}}]}), 400);
      }));
      api.token = 'abc';
      await expectLater(api.get('/api/users/1'), throwsA(isA<AppException>().having((e) => e.message, 'message', 'This username is reserved.')));
      expect(seen.headers['Authorization'], 'JWT abc');
    });

    test('402 means a pack limit', () async {
      final api = ApiClient(base: 'http://x', client: MockClient((_) async => http.Response(jsonEncode({'error': 'Your pack allows 3 data sources.'}), 402)));
      try {
        await api.post('/api/data-sources', body: {});
        fail('should throw');
      } on AppException catch (e) {
        expect(e.limitReached, isTrue);
        expect(e.message, contains('3 data sources'));
      }
    });
  });

  group('AuthController', () {
    test('login stores the token and restore brings the user back', () async {
      final store = _MemStorage();
      final client = MockClient((req) async {
        if (req.url.path == '/api/users/login') return http.Response(jsonEncode({'token': 't1', 'user': {'id': 7, 'email': 'a@b.nl', 'name': 'Anna', 'plan': 'pro', 'language': 'nl', 'roles': ['customer']}}), 200);
        if (req.url.path == '/api/users/me') return http.Response(jsonEncode({'user': req.headers['Authorization'] == 'JWT t1' ? {'id': 7, 'email': 'a@b.nl', 'plan': 'pro'} : null}), 200);
        return http.Response('{}', 200);
      });
      final auth = AuthController(ApiClient(base: 'http://x', client: client), store);
      final user = await auth.login('a@b.nl', 'pw');
      expect(user.plan, 'pro');
      expect(user.language, 'nl');
      expect(store.v, 't1');

      final again = AuthController(ApiClient(base: 'http://x', client: client), store);
      await again.restore();
      expect(again.ready, isTrue);
      expect(again.user?.email, 'a@b.nl');

      await again.logout();
      expect(again.user, isNull);
      expect(store.v, isNull);
    });
  });

  group('I18n', () {
    test('translates by English text, keeps placeholders, falls back to English', () async {
      final i = I18n(loader: (code) async => jsonEncode({'Pricing': 'Prijzen', '{n} rows': '{n} rijen'}));
      await i.setLang('nl');
      expect(i.t('Pricing'), 'Prijzen');
      expect(i.t('{n} rows', {'n': '5'}), '5 rijen');
      expect(i.t('Unknown text'), 'Unknown text');
      await i.setLang('en');
      expect(i.t('Pricing'), 'Pricing');
      await i.setLang('ar');
      expect(i.rtl, isTrue);
    });
  });

  group('business rules (mirror of the backend)', () {
    test('five packs with the prices of the website', () {
      expect(plans.map((p) => p.id), ['free', 'hobby', 'pro', 'business', 'enterprise']);
      expect(plans.map((p) => p.price), [0, 20, 99, 500, 1500]);
      expect(plans.where((p) => p.highlight).single.id, 'pro');
      expect(formatPrice(1500), '1,500');
    });

    test('limits per pack', () {
      expect(limitsFor('free').sources, 3);
      expect(limitsFor('free').automation, isFalse);
      expect(limitsFor('business').automation, isTrue);
      expect(limitsFor('free', admin: true).apiCalls, double.infinity);
    });

    test('analyze finds an unusual value only when allowed', () {
      final rows = [for (var i = 0; i < 40; i++) {'t': 20}, {'t': 20.5}, {'t': 200}];
      expect(analyze(rows, detectAnomalies: true).single.anomalies, 1);
      expect(analyze(rows, detectAnomalies: false).single.anomalies, 0);
      expect(analyze(rows, detectAnomalies: true).single.trend, isNotEmpty);
    });
  });
}
