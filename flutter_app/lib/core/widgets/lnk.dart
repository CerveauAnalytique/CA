import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../i18n/i18n.dart';

extension NavX on BuildContext {
  /// Go to a page of the website, with the current language code in front (/nl/pricing).
  void goL(String path) => go(localized(path));
  void pushL(String path) => push(localized(path));
  String localized(String path) {
    if (path.startsWith('http')) return path;
    final l = lang;
    return path == '/' ? '/$l' : '/$l${path.startsWith('/') ? path : '/$path'}';
  }
}

/// A tappable piece of text or widget that goes to a page.
class Lnk extends StatelessWidget {
  const Lnk({super.key, required this.to, required this.child, this.onTap});
  final String to;
  final Widget child;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(behavior: HitTestBehavior.opaque, onTap: () { onTap?.call(); context.goL(to); }, child: child),
      );
}
