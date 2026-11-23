import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Light / dark switch drawn as a little sky: by day a blue sky with clouds and a sun, by night a dark sky with
/// stars and a moon. Switching slides the sun across, turns it into the moon, the clouds sink away and the
/// stars twinkle in.
class DayNightSwitch extends StatelessWidget {
  const DayNightSwitch({super.key, required this.dark, required this.onChanged, this.width = 64, this.label});
  final bool dark;
  final ValueChanged<bool> onChanged;
  final double width;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final h = width * .53;
    final reduce = MediaQuery.of(context).disableAnimations;
    return Semantics(
      toggled: dark,
      button: true,
      label: label,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: () => onChanged(!dark),
          child: TweenAnimationBuilder<double>(
            tween: Tween(end: dark ? 1 : 0),
            duration: reduce ? Duration.zero : const Duration(milliseconds: 650),
            curve: Curves.easeInOutCubic,
            builder: (_, t, __) => CustomPaint(size: Size(width, h), painter: _SkyPainter(t)),
          ),
        ),
      ),
    );
  }
}

class _SkyPainter extends CustomPainter {
  _SkyPainter(this.t);
  final double t; // 0 = day, 1 = night

  static const _stars = [(.14, .28, 1.1), (.27, .62, .8), (.38, .24, .9), (.2, .45, .6), (.46, .7, .7), (.33, .82, .5), (.09, .7, .7)];

  @override
  void paint(Canvas canvas, Size s) {
    final w = s.width, h = s.height, r = h / 2;
    final track = RRect.fromRectAndRadius(Offset.zero & s, Radius.circular(r));
    canvas.save();
    canvas.clipRRect(track);

    // sky
    canvas.drawRRect(
      track,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color.lerp(const Color(0xFF8ED1F7), const Color(0xFF1E2254), t)!, Color.lerp(const Color(0xFF3F9BE0), const Color(0xFF080A24), t)!],
        ).createShader(Offset.zero & s),
    );

    // stars twinkle in at night (left side, where the sun was)
    final star = Paint();
    for (var i = 0; i < _stars.length; i++) {
      final (x, y, size) = _stars[i];
      final a = ((t - .35 - i * .04) / .5).clamp(0.0, 1.0);
      if (a == 0) continue;
      star.color = Colors.white.withValues(alpha: a);
      final c = Offset(x * w, y * h);
      final k = size * h * .07 * (.6 + .4 * a);
      canvas.drawCircle(c, k, star);
      if (size >= .9) {
        // a little sparkle
        final p = Paint()
          ..color = Colors.white.withValues(alpha: a * .7)
          ..strokeWidth = .8;
        canvas.drawLine(c.translate(-k * 2.4, 0), c.translate(k * 2.4, 0), p);
        canvas.drawLine(c.translate(0, -k * 2.4), c.translate(0, k * 2.4), p);
      }
    }

    // clouds by day (right side), sinking away and fading at night
    final cloud = Paint()..color = Colors.white.withValues(alpha: (1 - t * 1.6).clamp(0.0, 1.0) * .95);
    final drop = t * h * .8;
    void puff(double x, double y, double k) {
      final o = Offset(x * w, y * h + drop);
      canvas.drawCircle(o, k * h, cloud);
      canvas.drawCircle(o.translate(k * h * .9, k * h * .25), k * h * .8, cloud);
      canvas.drawCircle(o.translate(-k * h * .9, k * h * .3), k * h * .7, cloud);
    }

    puff(.7, .78, .2);
    puff(.88, .62, .16);
    puff(.6, .95, .18);

    // knob: the sun on the left by day, the moon on the right at night
    final pad = h * .1, kr = r - pad;
    final cx = pad + kr + (w - 2 * (pad + kr)) * t, cy = r;
    final c = Offset(cx, cy);

    // glow
    canvas.drawCircle(c, kr * 1.55, Paint()..color = Color.lerp(const Color(0x55FFE27A), const Color(0x22D8DCFF), t)!);
    canvas.drawCircle(c, kr * 1.25, Paint()..color = Color.lerp(const Color(0x66FFE27A), const Color(0x33D8DCFF), t)!);

    // sun rays turn and shrink away
    if (t < .6) {
      final ray = Paint()
        ..color = const Color(0xFFFFD34E).withValues(alpha: 1 - t / .6)
        ..strokeWidth = h * .05
        ..strokeCap = StrokeCap.round;
      for (var i = 0; i < 8; i++) {
        final a = i * math.pi / 4 + t * math.pi;
        final d = Offset(math.cos(a), math.sin(a));
        canvas.drawLine(c + d * kr * 1.12, c + d * kr * (1.32 - t * .3), ray);
      }
    }

    canvas.drawCircle(
      c,
      kr,
      Paint()
        ..shader = RadialGradient(
          center: const Alignment(-.3, -.3),
          colors: [Color.lerp(const Color(0xFFFFE58A), const Color(0xFFF4F4FA), t)!, Color.lerp(const Color(0xFFFFB81F), const Color(0xFFC9CCDB), t)!],
        ).createShader(Rect.fromCircle(center: c, radius: kr)),
    );

    // moon craters appear
    if (t > .4) {
      final a = ((t - .4) / .6).clamp(0.0, 1.0);
      final crater = Paint()..color = const Color(0xFFA9ADC2).withValues(alpha: a * .8);
      canvas.drawCircle(c.translate(-kr * .3, -kr * .25), kr * .22, crater);
      canvas.drawCircle(c.translate(kr * .32, kr * .1), kr * .15, crater);
      canvas.drawCircle(c.translate(-kr * .05, kr * .42), kr * .12, crater);
    }
    canvas.restore();

    // thin inner border so it also reads on a white page
    canvas.drawRRect(track.deflate(.5), Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = Colors.black.withValues(alpha: .08));
  }

  @override
  bool shouldRepaint(covariant _SkyPainter old) => old.t != t;
}
