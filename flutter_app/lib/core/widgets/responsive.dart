import 'package:flutter/material.dart';
import '../../app/theme/theme.dart';

/// Breakpoints of the website (Tailwind): sm 640, md 768, lg 1024, xl 1280.
class Bp {
  static const sm = 640.0, md = 768.0, lg = 1024.0, xl = 1280.0;
}

extension ResponsiveX on BuildContext {
  double get width => MediaQuery.sizeOf(this).width;
  bool get isMobile => width < Bp.md;
  bool get isDesktop => width >= Bp.md;
}

/// The `max-w-[1280px] mx-auto px-6` container.
class Container1280 extends StatelessWidget {
  const Container1280({super.key, required this.child, this.padding = const EdgeInsets.symmetric(horizontal: Ca7Theme.gutter)});
  final Widget child;
  final EdgeInsets padding;
  @override
  Widget build(BuildContext context) => Center(
        child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: Ca7Theme.maxWidth), child: SizedBox(width: double.infinity, child: Padding(padding: padding, child: child))),
      );
}

const ca7Max = 1280.0;
