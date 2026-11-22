import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/i18n/i18n.dart';
import '../../core/providers.dart';
import '../../core/widgets/lnk.dart';

class BannerData {
  BannerData({required this.text, this.linkLabel, this.linkUrl, this.color = 'blue', this.dismissible = true});
  final String text, color;
  final String? linkLabel, linkUrl;
  final bool dismissible;
  factory BannerData.fromJson(Map<String, dynamic> j) => BannerData(text: '${j['text']}', linkLabel: j['linkLabel'] as String?, linkUrl: j['linkUrl'] as String?, color: '${j['color'] ?? 'blue'}', dismissible: j['dismissible'] != false);
}

/// The banner of the admin panel (global `banner`); null when switched off.
final bannerProvider = FutureProvider<BannerData?>((ref) async {
  try {
    final j = Map<String, dynamic>.from(await ref.watch(apiClientProvider).get('/api/globals/banner') as Map);
    if (j['enabled'] != true || '${j['text'] ?? ''}'.isEmpty) return null;
    return BannerData.fromJson(j);
  } catch (_) {
    return null; // a banner that cannot be loaded is simply not shown
  }
});

/// Text that was closed by the visitor (until the app restarts).
final bannerClosedProvider = StateProvider<String?>((ref) => null);

const _colors = {'blue': Color(0xFF2563EB), 'black': Color(0xFF171717), 'green': Color(0xFF059669), 'orange': Color(0xFFF97316)};

class MarketingBanner extends ConsumerWidget {
  const MarketingBanner({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final b = ref.watch(bannerProvider).value;
    if (b == null || ref.watch(bannerClosedProvider) == b.text) return const SizedBox.shrink();
    final external = (b.linkUrl ?? '').startsWith('http');
    final link = Text('${b.linkLabel ?? ''} →', style: const TextStyle(fontWeight: FontWeight.w500, decoration: TextDecoration.underline, color: Colors.white, fontSize: 13));
    return Material(
      color: _colors[b.color] ?? _colors['blue'],
      child: SizedBox(
        height: 40,
        width: double.infinity,
        child: Stack(alignment: Alignment.center, children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 44),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Flexible(child: Text(b.text, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 13))),
              if ((b.linkLabel ?? '').isNotEmpty && (b.linkUrl ?? '').isNotEmpty) ...[
                const SizedBox(width: 8),
                external
                    ? GestureDetector(onTap: () => launchUrl(Uri.parse(b.linkUrl!), mode: LaunchMode.externalApplication), child: MouseRegion(cursor: SystemMouseCursors.click, child: link))
                    : Lnk(to: b.linkUrl!, child: link),
              ],
            ]),
          ),
          if (b.dismissible)
            Positioned(right: 8, child: IconButton(tooltip: context.t('Close menu'), iconSize: 14, color: Colors.white, onPressed: () => ref.read(bannerClosedProvider.notifier).state = b.text, icon: const Icon(Icons.close))),
        ]),
      ),
    );
  }
}
