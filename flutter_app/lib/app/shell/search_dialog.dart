import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/lnk.dart';
import '../theme/colors.dart';

/// ⌘K smart search over the database: /api/search?q= (products, pages, docs, research, blog, AI models, datasets).
Future<void> openSearch(BuildContext context) => showDialog(context: context, barrierColor: Colors.black38, builder: (_) => const _SearchDialog());

class _SearchDialog extends ConsumerStatefulWidget {
  const _SearchDialog();
  @override
  ConsumerState<_SearchDialog> createState() => _SearchDialogState();
}

class _SearchDialogState extends ConsumerState<_SearchDialog> {
  final _c = TextEditingController();
  Timer? _debounce;
  List<Map<String, dynamic>> _res = [];
  String? _suggestion;
  bool _busy = false;
  String _q = '';

  void _onChanged(String v) {
    _debounce?.cancel();
    _q = v.trim();
    if (_q.length < 2) return setState(() { _res = []; _suggestion = null; });
    _debounce = Timer(const Duration(milliseconds: 250), () async {
      setState(() => _busy = true);
      try {
        final j = await ref.read(apiClientProvider).get('/api/search', query: {'q': _q});
        _res = ((j['results'] ?? const []) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _suggestion = j['suggestion'] as String?;
      } catch (_) {
        _res = [];
      }
      if (mounted) setState(() => _busy = false);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ca;
    final groups = <String, List<Map<String, dynamic>>>{};
    for (final h in _res) {
      groups.putIfAbsent('${h['category']}', () => []).add(h);
    }
    return Align(
      alignment: const Alignment(0, -.6),
      child: Material(
        color: c.bg,
        borderRadius: BorderRadius.circular(16),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560, maxHeight: 560),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(controller: _c, autofocus: true, onChanged: _onChanged, decoration: InputDecoration(prefixIcon: const Icon(Icons.search, size: 18), hintText: context.t('Search docs, research, products…'))),
            ),
            if (_busy) const LinearProgressIndicator(minHeight: 2),
            if (_q.length >= 2 && !_busy && _res.isEmpty)
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${context.t('No results found for')} "$_q"', style: TextStyle(color: c.muted, fontSize: 13)),
                  if (_suggestion != null) TextButton(onPressed: () { _c.text = _suggestion!; _onChanged(_suggestion!); }, child: Text('${context.t('Did you mean')} "$_suggestion"?')),
                ]),
              ),
            if (_res.isNotEmpty)
              Flexible(
                child: ListView(shrinkWrap: true, padding: const EdgeInsets.fromLTRB(12, 0, 12, 12), children: [
                  for (final e in groups.entries) ...[
                    Padding(padding: const EdgeInsets.fromLTRB(4, 12, 4, 4), child: Text('${e.key} (${e.value.length})', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: c.faint))),
                    for (final it in e.value)
                      InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () {
                          Navigator.of(context).pop();
                          context.goL('${it['href']}');
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            Flexible(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('${it['title']}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                                if (it['description'] != null) Text('${it['description']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: c.muted)),
                              ]),
                            ),
                            if (it['priceInUSD'] is num) Text('\$${((it['priceInUSD'] as num) / 100).toStringAsFixed(2)}', style: TextStyle(fontSize: 12, color: c.muted, fontFamily: 'GeistMono')),
                          ]),
                        ),
                      ),
                  ],
                ]),
              ),
          ]),
        ),
      ),
    );
  }
}
