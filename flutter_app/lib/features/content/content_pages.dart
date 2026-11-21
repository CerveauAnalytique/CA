import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/configuration/env.dart';
import '../../app/theme/colors.dart';
import '../../core/widgets/atoms.dart';
import '../../core/widgets/responsive.dart';

final _pagesProvider = FutureProvider<Map<String, List<Map<String, dynamic>>>>((ref) async {
  final raw = jsonDecode(await rootBundle.loadString('assets/data/pages.json')) as Map<String, dynamic>;
  return raw.map((k, v) => MapEntry(k, (v as List).map((e) => Map<String, dynamic>.from(e as Map)).toList()));
});

/// Legal pages (privacy, terms, cookies): text exported from the website pages with tool_export_pages.mjs.
class LegalPage extends ConsumerWidget {
  const LegalPage(this.name, {super.key});
  final String name;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.ca;
    return ref.watch(_pagesProvider).when(
          loading: () => const StateBox.loading(),
          error: (e, _) => StateBox.error('$e'),
          data: (pages) {
            final blocks = pages[name] ?? const [];
            return Container1280(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: context.isDesktop ? 64 : 48),
              child: Align(
                alignment: Alignment.topLeft,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 768),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    for (final b in blocks) switch (b['t']) {
                      'eyebrow' => Padding(padding: const EdgeInsets.only(bottom: 12), child: Eyebrow('${b['text']}')),
                      'title' => Padding(padding: const EdgeInsets.only(bottom: 12), child: Text('${b['text']}', style: TextStyle(fontSize: (context.width * .04).clamp(30.0, 44.0), fontWeight: FontWeight.w300, height: 1.25, letterSpacing: -1))),
                      'subtitle' => Padding(padding: const EdgeInsets.only(bottom: 32), child: Muted('${b['text']}', size: 15)),
                      'h2' || 'h3' => Padding(padding: const EdgeInsets.only(top: 32, bottom: 8), child: Text('${b['text']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600))),
                      'li' => Padding(padding: const EdgeInsets.only(left: 12, bottom: 6), child: Text('•  ${b['text']}', style: TextStyle(fontSize: 15, height: 1.7, color: c.muted))),
                      _ => Padding(padding: const EdgeInsets.only(bottom: 12), child: Text('${b['text']}', style: TextStyle(fontSize: 15, height: 1.7, color: c.muted))),
                    },
                  ]),
                ),
              ),
            );
          },
        );
  }
}

/// Pages that are not migrated yet. They stay available on the website; this screen says so and opens them.
class OnWebsitePage extends StatelessWidget {
  const OnWebsitePage({super.key, required this.path});
  final String path;
  @override
  Widget build(BuildContext context) => Container1280(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 64),
        child: Align(
          alignment: Alignment.topLeft,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 576),
            child: CaCard(title: 'This page is not in the app yet', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Muted('It is still part of the website and has not been migrated to Flutter. Open it there:', size: 14),
              const SizedBox(height: 16),
              CaButton('Open on the website', icon: Icons.open_in_new, onPressed: () => launchUrl(Uri.parse('${Env.api}$path'), webOnlyWindowName: '_self')),
            ])),
          ),
        ),
      );
}
