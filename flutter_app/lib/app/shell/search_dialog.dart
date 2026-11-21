import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/lnk.dart';
import '../theme/colors.dart';

/// ⌘K search: same endpoint as the website (/api/search?q=) with products, docs and research.
Future<void> openSearch(BuildContext context) => showDialog(context: context, barrierColor: Colors.black38, builder: (_) => const _SearchDialog());

class _SearchDialog extends ConsumerStatefulWidget {
  const _SearchDialog();
  @override
  ConsumerState<_SearchDialog> createState() => _SearchDialogState();
}

class _SearchDialogState extends ConsumerState<_SearchDialog> {
  final _c = TextEditingController();
  Timer? _debounce;
  Map<String, List<Map<String, dynamic>>> _res = {};
  bool _busy = false;
  String _q = '';

  void _onChanged(String v) {
    _debounce?.cancel();
    _q = v.trim();
    if (_q.length < 2) return setState(() => _res = {});
    _debounce = Timer(const Duration(milliseconds: 250), () async {
      setState(() => _busy = true);
      try {
        final j = await ref.read(apiClientProvider).get('/api/search', query: {'q': _q});
        _res = {
          for (final k in ['products', 'docs', 'research']) k: ((j[k] ?? const []) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
        };
      } catch (_) {
        _res = {};
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
    final any = _res.values.any((l) => l.isNotEmpty);
    const sections = {'products': 'Products', 'docs': 'Documentation', 'research': 'Research'};
    return Align(
      alignment: const Alignment(0, -.6),
      child: Material(
        color: c.bg,
        borderRadius: BorderRadius.circular(16),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560, maxHeight: 520),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(controller: _c, autofocus: true, onChanged: _onChanged, decoration: InputDecoration(prefixIcon: const Icon(Icons.search, size: 18), hintText: context.t('Search docs, research, products…'))),
            ),
            if (_busy) const LinearProgressIndicator(minHeight: 2),
            if (_q.length >= 2 && !_busy && !any)
              Padding(padding: const EdgeInsets.all(24), child: Text('${context.t('No results found for')} "$_q"', style: TextStyle(color: c.muted, fontSize: 13))),
            if (any)
              Flexible(
                child: ListView(shrinkWrap: true, padding: const EdgeInsets.fromLTRB(12, 0, 12, 12), children: [
                  for (final e in sections.entries)
                    if ((_res[e.key] ?? []).isNotEmpty) ...[
                      Padding(padding: const EdgeInsets.fromLTRB(4, 12, 4, 4), child: Text('${e.value} (${_res[e.key]!.length})', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: c.faint))),
                      for (final it in _res[e.key]!)
                        InkWell(
                          borderRadius: BorderRadius.circular(8),
                          onTap: () {
                            Navigator.of(context).pop();
                            context.goL('${it['href']}');
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                              Flexible(child: Text('${it['title']}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
                              if (it['priceInUSD'] is num) Text('\$${(it['priceInUSD'] as num).toStringAsFixed(2)}', style: TextStyle(fontSize: 12, color: c.muted, fontFamily: 'GeistMono')),
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
