import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ayusync_app/core/auth/auth_session_manager.dart';
import 'package:ayusync_app/core/state/app_state.dart';
import 'package:ayusync_app/features/auth/presentation/pages/splash_page.dart';
import 'package:ayusync_app/features/dashboard/presentation/pages/home_dashboard_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    AuthSessionManager.resetCache();
  });

  tearDown(() {
    AuthSessionManager.resetCache();
  });

  group('Persistent Login & Session Tests', () {
    test('Session is saved on login and restored across AppState re-instantiation', () async {
      AuthSessionManager.resetCache();
      final appState = AppState(monitorNetwork: false);

      // Initially logged out
      expect(appState.isLoggedIn, isFalse);

      // Perform login
      final success = await appState.login('+919998887776', 'password123');
      expect(success, isTrue);
      expect(appState.isLoggedIn, isTrue);

      // Verify AuthSessionManager has the session
      final session = await AuthSessionManager.loadSession();
      expect(session, isNotNull);
      expect(session!['isLoggedIn'], isTrue);
      expect(session['workerPhone'], '+919998887776');

      // Now simulate closing and reopening the app with a fresh AppState
      final restoredAppState = AppState(monitorNetwork: false);
      await restoredAppState.ensureSessionLoaded();

      // Verify persistent login holds
      expect(restoredAppState.isLoggedIn, isTrue);
      expect(restoredAppState.workerName, isNotEmpty);
    });

    test('Explicit logout clears stored session data', () async {
      AuthSessionManager.resetCache();
      final appState = AppState(monitorNetwork: false);

      await appState.login('+919998887776', 'password123');
      expect(appState.isLoggedIn, isTrue);

      // Explicitly log out
      await appState.logout();
      expect(appState.isLoggedIn, isFalse);

      // Verify session was cleared
      final session = await AuthSessionManager.loadSession();
      expect(session, isNull);

      // Re-instantiated AppState is logged out
      final freshAppState = AppState(monitorNetwork: false);
      await freshAppState.ensureSessionLoaded();
      expect(freshAppState.isLoggedIn, isFalse);
    });
  });

  group('Splash Navigation with Persistent Session', () {
    testWidgets('Splash routes to /home when user is persistently logged in', (tester) async {
      AuthSessionManager.setMockSession({
        'isLoggedIn': true,
        'workerName': 'Sunita Patil',
        'workerId': 'ASHA-102',
        'workerPhone': '+919998887776',
        'workerCenter': 'Khandala Sub-Centre',
      });

      final appState = AppState(monitorNetwork: false);
      await appState.ensureSessionLoaded();

      String currentRoute = '/';

      await tester.pumpWidget(
        ChangeNotifierProvider<AppState>.value(
          value: appState,
          child: MaterialApp(
            initialRoute: '/',
            routes: {
              '/': (context) => const SplashPage(),
              '/home': (context) {
                currentRoute = '/home';
                return const Scaffold(body: Text('Home Screen'));
              },
              '/login': (context) {
                currentRoute = '/login';
                return const Scaffold(body: Text('Login Screen'));
              },
            },
          ),
        ),
      );

      // Pump through splash animation duration
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 1200));
      await tester.pumpAndSettle();

      expect(currentRoute, equals('/home'));
      expect(find.text('Home Screen'), findsOneWidget);
    });

    testWidgets('Splash routes to /login when user is not logged in', (tester) async {
      AuthSessionManager.resetCache();

      final appState = AppState(monitorNetwork: false);
      await appState.ensureSessionLoaded();

      String currentRoute = '/';

      await tester.pumpWidget(
        ChangeNotifierProvider<AppState>.value(
          value: appState,
          child: MaterialApp(
            initialRoute: '/',
            routes: {
              '/': (context) => const SplashPage(),
              '/home': (context) {
                currentRoute = '/home';
                return const Scaffold(body: Text('Home Screen'));
              },
              '/login': (context) {
                currentRoute = '/login';
                return const Scaffold(body: Text('Login Screen'));
              },
            },
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 1200));
      await tester.pumpAndSettle();

      expect(currentRoute, equals('/login'));
      expect(find.text('Login Screen'), findsOneWidget);
    });
  });

  group('Profile Logout Button Tests', () {
    testWidgets('Profile dialog displays Logout button and tapping it logs out to /login', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      AuthSessionManager.setMockSession({
        'isLoggedIn': true,
        'workerName': 'Sunita Patil',
        'workerId': 'ASHA-102',
        'workerPhone': '+919998887776',
        'workerCenter': 'Khandala Sub-Centre',
      });

      final appState = AppState(monitorNetwork: false);
      await appState.ensureSessionLoaded();

      String currentRoute = '/home';

      await tester.pumpWidget(
        ChangeNotifierProvider<AppState>.value(
          value: appState,
          child: MaterialApp(
            initialRoute: '/home',
            routes: {
              '/home': (context) => const HomeDashboardPage(),
              '/login': (context) {
                currentRoute = '/login';
                return const Scaffold(body: Text('Login Screen'));
              },
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Open Profile dialog by tapping the worker avatar
      final avatarFinder = find.byType(CircleAvatar).first;
      await tester.tap(avatarFinder);
      await tester.pumpAndSettle();

      // Verify Profile dialog is open
      expect(find.text('ASHA Worker Profile'), findsOneWidget);

      // Verify Logout button is clearly visible in the Profile section
      final logoutButtonFinder = find.byKey(const ValueKey('profile_logout_button'));
      expect(logoutButtonFinder, findsOneWidget);
      expect(find.widgetWithText(OutlinedButton, 'Log Out'), findsOneWidget);

      // Tap Logout
      await tester.tap(logoutButtonFinder);
      await tester.pumpAndSettle();

      // Verify session was cleared
      expect(appState.isLoggedIn, isFalse);
      expect(await AuthSessionManager.loadSession(), isNull);

      // Verify redirected to /login screen
      expect(currentRoute, equals('/login'));
      expect(find.text('Login Screen'), findsOneWidget);
    });
  });
}
