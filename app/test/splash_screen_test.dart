import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ayusync_app/core/state/app_state.dart';
import 'package:ayusync_app/core/theme/app_colors.dart';
import 'package:ayusync_app/features/auth/presentation/pages/splash_page.dart';
import 'package:ayusync_app/features/auth/presentation/widgets/splash_decorations.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget createTestSplash({AppState? appState, Size screenSize = const Size(390, 844)}) {
    final state = appState ?? AppState(monitorNetwork: false);
    return ChangeNotifierProvider<AppState>.value(
      value: state,
      child: MaterialApp(
        routes: {
          '/login': (context) => const Scaffold(body: Text('Login Screen')),
          '/home': (context) => const Scaffold(body: Text('Home Screen')),
        },
        home: MediaQuery(
          data: MediaQueryData(size: screenSize),
          child: const SplashPage(),
        ),
      ),
    );
  }

  group('Custom Splash Screen UI & Design Verification', () {
    testWidgets('Renders Swasthya Setu typography and custom emblem painters', (tester) async {
      await tester.pumpWidget(createTestSplash());
      await tester.pump(const Duration(milliseconds: 400));

      // Verify custom painters are present
      expect(find.byType(CustomPaint), findsWidgets);
      expect(find.byType(SplashPage), findsOneWidget);

      // Verify typography matching design
      expect(find.text('Swasthya'), findsOneWidget);
      expect(find.text('Setu'), findsOneWidget);
      expect(find.text('Dermatology Center'), findsOneWidget);

      // Verify no legacy placeholder elements remain
      expect(find.text('AyuSync'), findsNothing);
      expect(find.textContaining('ASHA & ANM Companion'), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsNothing);

      // Let remaining timers finish cleanly
      await tester.pump(const Duration(milliseconds: 2000));
      await tester.pumpAndSettle();
    });

    testWidgets('ConcentricRingsPainter paints without throwing', (tester) async {
      const painter = ConcentricRingsPainter(animationProgress: 0.5);
      final pictureRecorder = PictureRecorder();
      final canvas = Canvas(pictureRecorder);
      painter.paint(canvas, const Size(400, 800));
      expect(painter.shouldRepaint(const ConcentricRingsPainter(animationProgress: 0.2)), isTrue);
      expect(painter.shouldRepaint(const ConcentricRingsPainter(animationProgress: 0.5)), isFalse);
    });

    testWidgets('SwasthyaSetuEmblemPainter paints without throwing', (tester) async {
      const painter = SwasthyaSetuEmblemPainter(animationProgress: 0.5);
      final pictureRecorder = PictureRecorder();
      final canvas = Canvas(pictureRecorder);
      painter.paint(canvas, const Size(200, 160));
      expect(painter.shouldRepaint(const SwasthyaSetuEmblemPainter(animationProgress: 0.2)), isTrue);
      expect(painter.shouldRepaint(const SwasthyaSetuEmblemPainter(animationProgress: 0.5)), isFalse);
    });

    testWidgets('Handles various device screen sizes without overflow', (tester) async {
      final screenSizes = [
        const Size(320, 568), // iPhone SE 1st gen (compact)
        const Size(375, 667), // iPhone 8
        const Size(390, 844), // iPhone 14
        const Size(412, 915), // Pixel 7
        const Size(768, 1024), // Tablet portrait
        const Size(844, 390), // Mobile landscape
      ];

      for (final size in screenSizes) {
        await tester.pumpWidget(createTestSplash(screenSize: size));
        await tester.pump(const Duration(milliseconds: 400));

        // Expect zero layout overflows
        expect(tester.takeException(), isNull, reason: 'Overflow occurred on size $size');

        // Allow splash timer to complete before next size
        await tester.pump(const Duration(milliseconds: 2000));
        await tester.pumpAndSettle();
      }
    });

    testWidgets('Animation progresses smoothly and redirects when timer completes', (tester) async {
      await tester.pumpWidget(createTestSplash());

      // Advance animation halfway
      await tester.pump(const Duration(milliseconds: 700));
      expect(find.text('Swasthya'), findsOneWidget);

      // Complete animation and transition delay
      await tester.pump(const Duration(milliseconds: 1200));
      await tester.pumpAndSettle();

      // Navigated to login screen (since logged out)
      expect(find.text('Login Screen'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('SplashPage wraps body in AnnotatedRegion<SystemUiOverlayStyle>', (tester) async {
      await tester.pumpWidget(createTestSplash());
      expect(find.byType(AnnotatedRegion<SystemUiOverlayStyle>), findsOneWidget);

      // Allow splash timer to complete cleanly
      await tester.pump(const Duration(milliseconds: 2000));
      await tester.pumpAndSettle();
    });
  });

  group('Native Launch Configuration & Seamless Color Match Verification', () {
    test('AppColors.splashBg matches native launch color #7B9B73', () {
      expect(AppColors.splashBg.value, equals(0xFF7B9B73));
    });

    test('Android styles do not contain ?android:colorBackground white flash in NormalTheme', () {
      final stylesFile = File('android/app/src/main/res/values/styles.xml');
      final stylesNightFile = File('android/app/src/main/res/values-night/styles.xml');
      final stylesV31File = File('android/app/src/main/res/values-v31/styles.xml');
      final stylesNightV31File = File('android/app/src/main/res/values-night-v31/styles.xml');

      expect(stylesFile.existsSync(), isTrue);
      expect(stylesFile.readAsStringSync().contains('?android:colorBackground'), isFalse);
      expect(stylesFile.readAsStringSync().contains('@drawable/launch_background'), isTrue);

      expect(stylesNightFile.existsSync(), isTrue);
      expect(stylesNightFile.readAsStringSync().contains('?android:colorBackground'), isFalse);
      expect(stylesNightFile.readAsStringSync().contains('@drawable/launch_background'), isTrue);

      expect(stylesV31File.existsSync(), isTrue);
      expect(stylesV31File.readAsStringSync().contains('windowSplashScreenBackground'), isTrue);
      expect(stylesV31File.readAsStringSync().contains('@color/splash_background'), isTrue);

      expect(stylesNightV31File.existsSync(), isTrue);
      expect(stylesNightV31File.readAsStringSync().contains('windowSplashScreenBackground'), isTrue);
    });

    test('iOS LaunchScreen.storyboard background matches #7B9B73 RGB', () {
      final storyboard = File('ios/Runner/Base.lproj/LaunchScreen.storyboard');
      expect(storyboard.existsSync(), isTrue);
      final content = storyboard.readAsStringSync();
      // Verify RGB match for 0x7B / 255, 0x9B / 255, 0x73 / 255
      expect(content.contains('0.482352'), isTrue);
      expect(content.contains('0.607843'), isTrue);
      expect(content.contains('0.450980'), isTrue);
      // Ensure no default white background remains
      expect(content.contains('red="1" green="1" blue="1"'), isFalse);
    });
  });
}
