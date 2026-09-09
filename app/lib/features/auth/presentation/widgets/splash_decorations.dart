import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

/// Custom painter for the organic concentric ripple rings in the corners.
class ConcentricRingsPainter extends CustomPainter {
  final double animationProgress;

  const ConcentricRingsPainter({this.animationProgress = 1.0});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = 0.95 + (0.05 * animationProgress);

    // Top-Right concentric ripple cluster
    final trCenter = Offset(size.width * 0.82, size.height * 0.02);
    _drawRippleCluster(
      canvas: canvas,
      center: trCenter,
      scale: scale,
      radii: [16, 32, 50, 70, 92, 118, 146, 178, 214, 254],
      widths: [2.5, 3.5, 4.0, 5.0, 3.8, 6.0, 4.5, 7.0, 5.0, 6.5],
      isLight: [true, false, true, false, true, false, true, false, true, false],
    );

    // Bottom-Left concentric ripple cluster
    final blCenter = Offset(size.width * -0.02, size.height * 0.98);
    _drawRippleCluster(
      canvas: canvas,
      center: blCenter,
      scale: scale,
      radii: [24, 45, 68, 94, 124, 158, 196, 238],
      widths: [3.0, 4.2, 5.0, 4.0, 6.0, 4.8, 6.5, 5.5],
      isLight: [false, true, false, true, false, true, false, true],
    );
  }

  void _drawRippleCluster({
    required Canvas canvas,
    required Offset center,
    required double scale,
    required List<double> radii,
    required List<double> widths,
    required List<bool> isLight,
  }) {
    for (int i = 0; i < radii.length; i++) {
      final radius = radii[i] * scale;
      final strokeWidth = widths[i];
      final light = isLight[i];

      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..isAntiAlias = true
        ..color = light ? AppColors.splashRingsLight : AppColors.splashRingsDark;

      canvas.drawCircle(center, radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant ConcentricRingsPainter oldDelegate) {
    return oldDelegate.animationProgress != animationProgress;
  }
}

/// Custom painter for the central "Swasthya Setu" community emblem.
class SwasthyaSetuEmblemPainter extends CustomPainter {
  final double animationProgress;

  const SwasthyaSetuEmblemPainter({this.animationProgress = 1.0});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;

    // The emblem design coordinates are normalized to an 200x160 canvas
    canvas.save();
    final scale = (w / 200) * (0.92 + 0.08 * animationProgress);
    canvas.translate(cx, h / 2);
    canvas.scale(scale);
    canvas.translate(-100, -80);

    // --- 1. Draw Lower Overlapping Petal/Body Shapes with smooth bezier curves ---
    // Left shape (Dark Olive)
    final pathLeft = Path()
      ..moveTo(56, 60)
      ..cubicTo(56, 92, 42, 116, 68, 118)
      ..cubicTo(88, 120, 96, 92, 98, 66)
      ..cubicTo(82, 56, 68, 54, 56, 60)
      ..close();

    final paintLeft = Paint()
      ..style = PaintingStyle.fill
      ..color = AppColors.splashBodyDark.withValues(alpha: 0.94)
      ..isAntiAlias = true;
    canvas.drawPath(pathLeft, paintLeft);

    // Amber / Terracotta shape (Center-Left)
    final pathAmber = Path()
      ..moveTo(82, 60)
      ..cubicTo(80, 88, 76, 118, 98, 118)
      ..cubicTo(118, 118, 126, 92, 112, 62)
      ..cubicTo(100, 56, 90, 56, 82, 60)
      ..close();

    final paintAmber = Paint()
      ..style = PaintingStyle.fill
      ..color = AppColors.splashBodyAmber.withValues(alpha: 0.88)
      ..isAntiAlias = true;
    canvas.drawPath(pathAmber, paintAmber);

    // Cream / Ivory shape (Center-Right)
    final pathCream = Path()
      ..moveTo(96, 64)
      ..cubicTo(108, 92, 118, 118, 132, 116)
      ..cubicTo(148, 114, 150, 88, 140, 60)
      ..cubicTo(124, 54, 110, 56, 96, 64)
      ..close();

    final paintCream = Paint()
      ..style = PaintingStyle.fill
      ..color = AppColors.splashBodyCream.withValues(alpha: 0.90)
      ..isAntiAlias = true;
    canvas.drawPath(pathCream, paintCream);

    // Right shape (Teal / Emerald)
    final pathRight = Path()
      ..moveTo(126, 64)
      ..cubicTo(134, 88, 138, 118, 158, 118)
      ..cubicTo(176, 118, 178, 88, 168, 60)
      ..cubicTo(154, 56, 140, 58, 126, 64)
      ..close();

    final paintRight = Paint()
      ..style = PaintingStyle.fill
      ..color = AppColors.splashBodyTeal.withValues(alpha: 0.92)
      ..isAntiAlias = true;
    canvas.drawPath(pathRight, paintRight);

    // --- 2. Three Circular Heads ---
    // Left Head (Dark Charcoal Green)
    final paintHeadLeft = Paint()
      ..style = PaintingStyle.fill
      ..color = AppColors.splashHeadLeft
      ..isAntiAlias = true;
    canvas.drawCircle(const Offset(62, 42), 14.5, paintHeadLeft);

    // Center Head (Pale Ivory)
    final paintHeadCenter = Paint()
      ..style = PaintingStyle.fill
      ..color = AppColors.splashHeadCenter
      ..isAntiAlias = true;
    canvas.drawCircle(const Offset(102, 40), 15.0, paintHeadCenter);

    // Right Head (Lush Sea Green)
    final paintHeadRight = Paint()
      ..style = PaintingStyle.fill
      ..color = AppColors.splashHeadRight
      ..isAntiAlias = true;
    canvas.drawCircle(const Offset(142, 42), 14.5, paintHeadRight);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant SwasthyaSetuEmblemPainter oldDelegate) {
    return oldDelegate.animationProgress != animationProgress;
  }
}
