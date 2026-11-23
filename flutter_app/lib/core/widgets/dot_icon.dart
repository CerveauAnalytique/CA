import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// The blue dot-style icons of the website (public/icons).
class DotIcon extends StatelessWidget {
  const DotIcon(this.name, {super.key, this.size = 40});
  final String name;
  final double size;
  @override
  Widget build(BuildContext context) => SvgPicture.asset('assets/icons/$name.svg', width: size, height: size);
}

/// CA7 wordmark in blue dots (72 x 32 on the website header).
class Ca7Logo extends StatelessWidget {
  const Ca7Logo({super.key, this.height = 32, this.white = false});
  final double height;
  final bool white;
  @override
  Widget build(BuildContext context) => Semantics(label: 'CA7', child: SvgPicture.asset(white ? 'assets/brand/ca7-wordmark-white.svg' : 'assets/brand/ca7-wordmark.svg', height: height));
}

/// Phylena wordmark in blue dots (same dot style as the old CA7 wordmark).
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.height = 32, this.white = false});
  final double height;
  final bool white;
  @override
  Widget build(BuildContext context) => Semantics(label: 'Phylena', child: SvgPicture.asset(white ? 'assets/brand/phylena-wordmark-white.svg' : 'assets/brand/phylena-wordmark.svg', height: height));
}
