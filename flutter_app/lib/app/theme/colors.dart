import 'package:flutter/material.dart';

/// Colors of the CA7 website (Tailwind neutral scale + blue accent), copied from the Next.js app.
class Neutral {
  static const c50 = Color(0xFFFAFAFA);
  static const c100 = Color(0xFFF5F5F5);
  static const c200 = Color(0xFFE5E5E5);
  static const c300 = Color(0xFFD4D4D4);
  static const c400 = Color(0xFFA3A3A3);
  static const c500 = Color(0xFF737373);
  static const c600 = Color(0xFF525252);
  static const c700 = Color(0xFF404040);
  static const c800 = Color(0xFF262626);
  static const c900 = Color(0xFF171717);
  static const c950 = Color(0xFF0A0A0A);
}

class Brand {
  static const blue = Color(0xFF2563EB); // blue-600
  static const blueDark = Color(0xFF1D4ED8); // blue-700
  static const blue50 = Color(0xFFEFF6FF);
  static const blue200 = Color(0xFFBFDBFE);
  static const dot = Color(0xFF1A3DF0); // the dotted art
  static const red = Color(0xFFDC2626);
  static const green = Color(0xFF22C55E);
}

/// Semantic colors that change with light / dark mode (the website uses `dark:` variants for the same pairs).
@immutable
class CaColors extends ThemeExtension<CaColors> {
  const CaColors({
    required this.bg,
    required this.fg,
    required this.muted,
    required this.faint,
    required this.card,
    required this.border,
    required this.header,
    required this.footer,
    required this.inputBg,
    required this.primaryBg,
    required this.primaryFg,
  });

  final Color bg, fg, muted, faint, card, border, header, footer, inputBg, primaryBg, primaryFg;

  static const light = CaColors(
    bg: Colors.white,
    fg: Neutral.c900,
    muted: Neutral.c500,
    faint: Neutral.c400,
    card: Neutral.c50,
    border: Color(0x1A000000),
    header: Color(0xF0FFFFFF), // rgba(255,255,255,.94)
    footer: Color(0xFFF7F7F7),
    inputBg: Color(0x0A000000),
    primaryBg: Color(0xFF111111),
    primaryFg: Colors.white,
  );

  static const dark = CaColors(
    bg: Neutral.c950,
    fg: Colors.white,
    muted: Neutral.c400,
    faint: Neutral.c500,
    card: Neutral.c900,
    border: Color(0x1AFFFFFF),
    header: Color(0xEB0A0A0A),
    footer: Neutral.c950,
    inputBg: Color(0x0DFFFFFF),
    primaryBg: Colors.white,
    primaryFg: Color(0xFF111111),
  );

  @override
  CaColors copyWith() => this;

  @override
  CaColors lerp(ThemeExtension<CaColors>? other, double t) => t < .5 ? this : (other as CaColors? ?? this);
}

extension CaColorsX on BuildContext {
  CaColors get ca => Theme.of(this).extension<CaColors>()!;
}
