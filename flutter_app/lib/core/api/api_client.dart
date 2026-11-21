import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../app/configuration/env.dart';
import '../errors/app_exception.dart';

/// One place for every call to the existing CA7 backend. Auth: `Authorization: JWT <token>` (Payload).
class ApiClient {
  ApiClient({http.Client? client, String? base}) : _http = client ?? http.Client(), base = base ?? Env.api;

  final http.Client _http;
  final String base;
  String? token;

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        if (token != null) 'Authorization': 'JWT $token',
      };

  Uri uri(String path, [Map<String, dynamic>? query]) {
    final q = query?.map((k, v) => MapEntry(k, v.toString()));
    return Uri.parse('$base$path').replace(queryParameters: q == null || q.isEmpty ? null : q);
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) => _send('GET', path, query: query);
  Future<dynamic> post(String path, {Object? body, String? text}) => _send('POST', path, body: body, text: text);
  Future<dynamic> patch(String path, {Object? body}) => _send('PATCH', path, body: body);
  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<dynamic> _send(String method, String path, {Map<String, dynamic>? query, Object? body, String? text}) async {
    final req = http.Request(method, uri(path, query));
    req.headers.addAll(_headers);
    if (text != null) {
      req.headers['Content-Type'] = 'text/plain';
      req.body = text;
    } else if (body != null) {
      req.headers['Content-Type'] = 'application/json';
      req.body = jsonEncode(body);
    }
    http.Response res;
    try {
      res = await http.Response.fromStream(await _http.send(req).timeout(const Duration(seconds: 30)));
    } on TimeoutException {
      throw AppException('The server did not answer in time.');
    } catch (_) {
      throw AppException('Could not reach CA7. Check your connection.');
    }
    dynamic json;
    if (res.body.isNotEmpty) {
      try {
        json = jsonDecode(utf8.decode(res.bodyBytes));
      } catch (_) {}
    }
    if (res.statusCode >= 400) throw AppException(_message(json) ?? 'Error ${res.statusCode}', status: res.statusCode);
    return json;
  }

  /// Same error texts the website shows: Payload `errors[].message` or our `error`.
  static String? _message(dynamic json) {
    if (json is Map) {
      final errs = json['errors'];
      if (errs is List && errs.isNotEmpty && errs.first is Map) {
        final first = errs.first as Map;
        final inner = first['data']?['errors'];
        if (inner is List && inner.isNotEmpty && inner.first is Map && inner.first['message'] != null) return inner.first['message'].toString();
        if (first['message'] != null) return first['message'].toString();
      }
      if (json['error'] != null) return json['error'].toString();
    }
    return null;
  }

  /// POST JSON to another server (the "send to my server" tool of the export page). No CA7 token is sent.
  Future<int> postRaw(String url, String json) async {
    final res = await _http.post(Uri.parse(url), headers: {'Content-Type': 'application/json'}, body: json).timeout(const Duration(seconds: 30));
    return res.statusCode;
  }

  /// Streams plain text (the chat answer from /api/ca/chat).
  Stream<String> streamText(String path, Object body) async* {
    final req = http.Request('POST', uri(path))
      ..headers.addAll(_headers)
      ..headers['Content-Type'] = 'application/json'
      ..body = jsonEncode(body);
    http.StreamedResponse res;
    try {
      res = await _http.send(req).timeout(const Duration(seconds: 60));
    } catch (_) {
      throw AppException('Could not reach CA7. Check your connection.');
    }
    if (res.statusCode >= 400) {
      final text = await res.stream.bytesToString();
      String? m;
      try {
        m = _message(jsonDecode(text));
      } catch (_) {}
      throw AppException(m ?? 'Error ${res.statusCode}', status: res.statusCode);
    }
    yield* res.stream.transform(utf8.decoder);
  }
}
