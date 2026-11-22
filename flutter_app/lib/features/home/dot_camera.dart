import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';

const _radius = 180.0, _spring = .045, _damping = .86;
const _turnY = 18.0, _turnX = 11.0, _parallaxX = 46.0, _parallaxY = 30.0, _follow = .07;

/// The camera made of dots (port of DotCameraCanvas.tsx): idle twinkle, scatter near the pointer and a
/// tilt + depth parallax that follows the pointer anywhere on the page.
class DotCamera extends StatefulWidget {
  const DotCamera({super.key});
  @override
  State<DotCamera> createState() => _DotCameraState();
}

class _DotCameraState extends State<DotCamera> with SingleTickerProviderStateMixin {
  late final Ticker _ticker;
  _Dots? _d;
  final _time = ValueNotifier<double>(0);
  Offset? _pointerLocal; // in source pixels
  Offset _lookTarget = Offset.zero, _look = Offset.zero;
  bool _reduce = false;

  @override
  void initState() {
    super.initState();
    rootBundle.loadString('assets/data/camera-dots.json').then((s) {
      if (mounted) setState(() => _d = _Dots.parse(jsonDecode(s) as Map<String, dynamic>));
    });
    _ticker = createTicker((e) {
      _time.value = e.inMicroseconds / 1e6;
      _look = Offset(_look.dx + (_lookTarget.dx - _look.dx) * _follow, _look.dy + (_lookTarget.dy - _look.dy) * _follow);
      _d?.step(_pointerLocal, _reduce);
    })..start();
    GestureBinding.instance.pointerRouter.addGlobalRoute(_onPointer);
  }

  void _onPointer(PointerEvent e) {
    if (e is! PointerHoverEvent && e is! PointerMoveEvent && e is! PointerDownEvent) return;
    final view = View.of(context).physicalSize / View.of(context).devicePixelRatio;
    _lookTarget = Offset(((e.position.dx / view.width - .5) * 2).clamp(-1, 1), ((e.position.dy / view.height - .5) * 2).clamp(-1, 1));
    final box = context.findRenderObject() as RenderBox?;
    if (box != null && box.hasSize && _d != null) {
      final p = box.globalToLocal(e.position);
      _pointerLocal = Offset(p.dx / box.size.width * _d!.w, p.dy / box.size.height * _d!.h);
    }
  }

  @override
  void dispose() {
    GestureBinding.instance.pointerRouter.removeGlobalRoute(_onPointer);
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _reduce = MediaQuery.of(context).disableAnimations;
    final d = _d;
    if (d == null) return const AspectRatio(aspectRatio: 1536 / 1024);
    return AspectRatio(
      aspectRatio: d.w / d.h,
      child: AnimatedBuilder(
        animation: _time,
        builder: (_, __) => Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 1 / 1100)
            ..rotateY(_look.dx * _turnY * math.pi / 180)
            ..rotateX(-_look.dy * _turnX * math.pi / 180),
          child: CustomPaint(painter: _CameraPainter(d, _time.value, _look, _reduce), size: Size.infinite),
        ),
      ),
    );
  }
}

class _Dots {
  _Dots(this.w, this.h, this.palette, this.n)
      : hx = Float32List(n), hy = Float32List(n), px = Float32List(n), py = Float32List(n), vx = Float32List(n), vy = Float32List(n),
        rad = Float32List(n), col = Uint8List(n), depth = Float32List(n), phase = Float32List(n), speed = Float32List(n);
  final double w, h;
  final List<Color> palette;
  final int n;
  final Float32List hx, hy, px, py, vx, vy, rad, depth, phase, speed;
  final Uint8List col;

  static _Dots parse(Map<String, dynamic> j) {
    final dots = (j['dots'] as List).cast<num>();
    final palette = (j['palette'] as List).map((c) => Color(int.parse((c as String).substring(1), radix: 16) | 0xFF000000)).toList();
    final n = dots.length ~/ 4;
    final d = _Dots((j['w'] as num).toDouble(), (j['h'] as num).toDouble(), palette, n);
    final rnd = math.Random(7);
    double rMin = double.infinity, rMax = -double.infinity;
    for (var i = 0; i < n; i++) {
      d.hx[i] = d.px[i] = dots[i * 4].toDouble();
      d.hy[i] = d.py[i] = dots[i * 4 + 1].toDouble();
      d.rad[i] = dots[i * 4 + 2] / 10;
      d.col[i] = dots[i * 4 + 3].toInt();
      d.phase[i] = (d.hx[i] * .004 + d.hy[i] * .006) * 2 + rnd.nextDouble() * 2.2;
      d.speed[i] = .7 + rnd.nextDouble() * .9;
      rMin = math.min(rMin, d.rad[i]);
      rMax = math.max(rMax, d.rad[i]);
    }
    for (var i = 0; i < n; i++) {
      d.depth[i] = (d.rad[i] - rMin) / ((rMax - rMin) == 0 ? 1 : (rMax - rMin)) - .5;
    }
    return d;
  }

  /// One physics step: scatter from the pointer, spring back home.
  void step(Offset? pointer, bool reduce) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      if (pointer != null) {
        final dx = px[i] - pointer.dx, dy = py[i] - pointer.dy;
        final d2 = dx * dx + dy * dy;
        if (d2 < _radius * _radius) {
          final d = math.sqrt(d2) == 0 ? 1 : math.sqrt(d2);
          final f = math.pow(1 - d / _radius, 2) * 12;
          vx[i] += (dx / d) * f + (-dy / d) * f * .25;
          vy[i] += (dy / d) * f + (dx / d) * f * .25;
        }
      }
      vx[i] += (hx[i] - px[i]) * _spring;
      vy[i] += (hy[i] - py[i]) * _spring;
      vx[i] *= _damping;
      vy[i] *= _damping;
      px[i] += vx[i];
      py[i] += vy[i];
    }
  }
}

class _CameraPainter extends CustomPainter {
  _CameraPainter(this.d, this.time, this.look, this.reduce);
  final _Dots d;
  final double time;
  final Offset look;
  final bool reduce;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / d.w;
    canvas.scale(s);
    final paint = Paint();
    for (var i = 0; i < d.n; i++) {
      var a = 1.0;
      if (!reduce) {
        final wave = math.sin(time * 1.7 * d.speed[i] + d.phase[i]);
        a = .12 + .88 * (wave * 1.6 + .55).clamp(0.0, 1.0);
        final away = math.min(1.0, math.sqrt(math.pow(d.px[i] - d.hx[i], 2) + math.pow(d.py[i] - d.hy[i], 2)) / 40);
        a = a + (1 - a) * away;
      }
      paint.color = d.palette[d.col[i]].withValues(alpha: a);
      canvas.drawCircle(Offset(d.px[i] + look.dx * d.depth[i] * _parallaxX, d.py[i] + look.dy * d.depth[i] * _parallaxY), d.rad[i], paint);
    }
  }

  @override
  bool shouldRepaint(covariant _CameraPainter old) => true;
}
