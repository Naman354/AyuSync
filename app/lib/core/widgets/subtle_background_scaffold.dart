import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Defines the variant of subtle background illustration to display.
enum BackgroundIllustrationType {
  /// Minimalist soft medical line-art pattern (stethoscopes, heartbeat ECG, medical cross, healing leaves).
  medicalPattern,

  /// Dignified community healthcare watermark (ASHA worker assisting a village mother & child with healing motifs).
  communityWatermark,
}

/// A lightweight, accessible background wrapper that renders very subtle,
/// translucent healthcare and community-wellness illustrations behind screen contents.
class SubtleHealthcareBackground extends StatelessWidget {
  final Widget child;
  final BackgroundIllustrationType type;
  final double opacity;
  final Color? backgroundColor;

  const SubtleHealthcareBackground({
    super.key,
    required this.child,
    this.type = BackgroundIllustrationType.medicalPattern,
    this.opacity = 0.05,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final assetPath = type == BackgroundIllustrationType.medicalPattern
        ? 'assets/images/healthcare_pattern_bg.jpg'
        : 'assets/images/community_health_watermark.jpg';

    return Stack(
      fit: StackFit.expand,
      children: [
        // 1. Base solid background tone
        Container(color: backgroundColor ?? AppColors.background),

        // 2. Translucent, non-interactive background illustration
        Positioned.fill(
          child: IgnorePointer(
            child: Opacity(
              opacity: opacity.clamp(0.01, 0.20),
              child: Image.asset(
                assetPath,
                key: ValueKey(assetPath),
                fit: BoxFit.cover,
                alignment: type == BackgroundIllustrationType.communityWatermark
                    ? Alignment.bottomCenter
                    : Alignment.center,
                filterQuality: FilterQuality.low,
                errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
              ),
            ),
          ),
        ),

        // 3. Screen content
        child,
      ],
    );
  }
}
