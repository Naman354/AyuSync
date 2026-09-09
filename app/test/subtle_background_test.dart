import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ayusync_app/core/widgets/subtle_background_scaffold.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Subtle Healthcare Background Illustration Tests', () {
    test('Background asset files exist and are non-empty', () {
      final patternFile = File('assets/images/healthcare_pattern_bg.jpg');
      final watermarkFile = File('assets/images/community_health_watermark.jpg');

      expect(patternFile.existsSync(), isTrue, reason: 'Pattern background asset must exist');
      expect(patternFile.lengthSync(), greaterThan(10000), reason: 'Pattern background asset must be valid image file');

      expect(watermarkFile.existsSync(), isTrue, reason: 'Community watermark asset must exist');
      expect(watermarkFile.lengthSync(), greaterThan(10000), reason: 'Community watermark asset must be valid image file');
    });

    testWidgets('Renders medicalPattern variant with IgnorePointer and child', (tester) async {
      int tapCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SubtleHealthcareBackground(
              type: BackgroundIllustrationType.medicalPattern,
              opacity: 0.05,
              child: Center(
                child: ElevatedButton(
                  onPressed: () => tapCount++,
                  child: const Text('Test Button'),
                ),
              ),
            ),
          ),
        ),
      );

      // Verify widget exists and child button is rendered
      expect(find.byType(SubtleHealthcareBackground), findsOneWidget);
      expect(find.text('Test Button'), findsOneWidget);

      // Verify IgnorePointer wraps the background layer to prevent touch interception
      final ignorePointers = tester.widgetList<IgnorePointer>(find.byType(IgnorePointer));
      expect(ignorePointers.isNotEmpty, isTrue);
      expect(ignorePointers.any((ip) => ip.ignoring == true), isTrue);

      // Tap the button and verify pointer event passes through unobstructed
      await tester.tap(find.text('Test Button'));
      await tester.pump();
      expect(tapCount, equals(1));
    });

    testWidgets('Renders communityWatermark variant with appropriate asset key', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SubtleHealthcareBackground(
              type: BackgroundIllustrationType.communityWatermark,
              opacity: 0.08,
              child: Text('Watermark Content'),
            ),
          ),
        ),
      );

      expect(find.byType(SubtleHealthcareBackground), findsOneWidget);
      expect(find.text('Watermark Content'), findsOneWidget);

      // Verify image asset key is community watermark
      final imageFinder = find.byKey(const ValueKey('assets/images/community_health_watermark.jpg'));
      expect(imageFinder, findsOneWidget);
    });

    testWidgets('Clamps opacity to safe boundaries for visual readability', (tester) async {
      // Test when opacity requested is 0.00 (too low) -> clamped to 0.01
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SubtleHealthcareBackground(
              type: BackgroundIllustrationType.medicalPattern,
              opacity: 0.00,
              child: Text('Clamped Low'),
            ),
          ),
        ),
      );

      var opacityWidget = tester.widget<Opacity>(
        find.ancestor(
          of: find.byKey(const ValueKey('assets/images/healthcare_pattern_bg.jpg')),
          matching: find.byType(Opacity),
        ),
      );
      expect(opacityWidget.opacity, closeTo(0.01, 0.001));

      // Test when opacity requested is 0.99 (too high, would obscure text) -> clamped to 0.20
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SubtleHealthcareBackground(
              type: BackgroundIllustrationType.medicalPattern,
              opacity: 0.99,
              child: Text('Clamped High'),
            ),
          ),
        ),
      );

      opacityWidget = tester.widget<Opacity>(
        find.ancestor(
          of: find.byKey(const ValueKey('assets/images/healthcare_pattern_bg.jpg')),
          matching: find.byType(Opacity),
        ),
      );
      expect(opacityWidget.opacity, closeTo(0.20, 0.001));
    });
  });
}
