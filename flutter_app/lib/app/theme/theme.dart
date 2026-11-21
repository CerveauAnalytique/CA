import 'package:flutter/material.dart';
import 'colors.dart';

/// Central CA7 theme: Geist font, neutral palette, 10 px base radius (--radius: 0.625rem).
class Ca7Theme {
  static const radius = 10.0;
  static const maxWidth = 1280.0; // the website container
  static const gutter = 24.0;
  static const headerHeight = 56.0;

  static ThemeData light() => _build(Brightness.light, CaColors.light);
  static ThemeData dark() => _build(Brightness.dark, CaColors.dark);

  static ThemeData _build(Brightness b, CaColors c) {
    final base = ThemeData(brightness: b, useMaterial3: true, fontFamily: 'Geist');
    return base.copyWith(
      scaffoldBackgroundColor: c.bg,
      canvasColor: c.bg,
      colorScheme: ColorScheme.fromSeed(seedColor: Brand.blue, brightness: b).copyWith(
        surface: c.bg,
        primary: c.primaryBg,
        onPrimary: c.primaryFg,
        outline: c.border,
      ),
      textTheme: base.textTheme.apply(bodyColor: c.fg, displayColor: c.fg, fontFamily: 'Geist'),
      dividerColor: c.border,
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: b == Brightness.light ? const Color(0x0A000000) : const Color(0x0FFFFFFF),
      inputDecorationTheme: InputDecorationTheme(
        isDense: true,
        filled: true,
        fillColor: c.bg,
        hintStyle: TextStyle(color: c.faint, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: b == Brightness.light ? Neutral.c200 : Neutral.c700)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: b == Brightness.light ? Neutral.c200 : Neutral.c700)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: c.fg, width: 1)),
      ),
      extensions: [c],
    );
  }
}
