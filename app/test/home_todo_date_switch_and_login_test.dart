import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ayusync_app/core/state/app_state.dart';
import 'package:ayusync_app/features/auth/presentation/pages/login_page.dart';
import 'package:ayusync_app/features/dashboard/presentation/pages/home_dashboard_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Home Dashboard To-Do Section Date Switching Tests', () {
    Widget createDashboardTestWidget({AppState? appState}) {
      final state = appState ?? AppState(monitorNetwork: false);
      return ChangeNotifierProvider<AppState>.value(
        value: state,
        child: const MaterialApp(
          home: HomeDashboardPage(),
        ),
      );
    }

    testWidgets('Date strip displays dates and switches tasks dynamically on tap', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final appState = AppState(monitorNetwork: false);
      await tester.pumpWidget(createDashboardTestWidget(appState: appState));
      await tester.pumpAndSettle();

      // Verify initial view (Today - index 2) contains today's tasks
      expect(find.text('Priya Sharma'), findsOneWidget);

      // Find all GestureDetectors in the date strip (each represents a date column with a day number)
      final now = DateTime.now();
      final tomorrow = now.add(const Duration(days: 1));
      final tomorrowDayStr = tomorrow.day.toString();

      // Find the day text for tomorrow in the date strip
      final tomorrowFinder = find.widgetWithText(GestureDetector, tomorrowDayStr);
      expect(tomorrowFinder, findsWidgets);

      // Tap tomorrow in the date strip
      await tester.tap(tomorrowFinder.first);
      await tester.pumpAndSettle();

      // Verify tasks updated dynamically to tomorrow's tasks (Ramesh Kulkarni / Ganesh Jadhav)
      expect(find.text('Ramesh Kulkarni'), findsWidgets);
      expect(find.text('Ganesh Jadhav'), findsOneWidget);

      // Verify today's specific task (Priya Sharma) is no longer in tomorrow's view
      expect(find.text('Priya Sharma'), findsNothing);

      // Now tap on yesterday
      final yesterday = now.subtract(const Duration(days: 1));
      final yesterdayDayStr = yesterday.day.toString();
      final yesterdayFinder = find.widgetWithText(GestureDetector, yesterdayDayStr);
      expect(yesterdayFinder, findsWidgets);

      await tester.tap(yesterdayFinder.first);
      await tester.pumpAndSettle();

      // Verify yesterday's tasks are displayed (Sunita Chavan overdue post-natal check)
      expect(find.text('Sunita Chavan'), findsWidgets);
    });
  });

  group('Login Screen Cleanup Tests', () {
    Widget createLoginTestWidget({AppState? appState}) {
      final state = appState ?? AppState(monitorNetwork: false);
      return ChangeNotifierProvider<AppState>.value(
        value: state,
        child: const MaterialApp(
          home: LoginPage(),
        ),
      );
    }

    testWidgets('Fingerprint button and Sign-up prompt are completely removed', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createLoginTestWidget());
      await tester.pumpAndSettle();

      // 1. Verify biometric fingerprint icon and button are NOT present
      expect(find.byIcon(Icons.fingerprint_rounded), findsNothing);
      expect(find.byIcon(Icons.fingerprint), findsNothing);

      // 2. Verify 'Don't have an account? Sign up' text is NOT present
      expect(find.textContaining('Sign up'), findsNothing);
      expect(find.textContaining('Don\'t have an account'), findsNothing);

      // 3. Verify core login elements remain intact
      expect(find.text('ASHA Id'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.widgetWithText(ElevatedButton, 'Log In'), findsOneWidget);
    });
  });
}
