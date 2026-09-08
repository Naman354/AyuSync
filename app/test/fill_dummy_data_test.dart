import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ayusync_app/core/state/app_state.dart';
import 'package:ayusync_app/features/patient/presentation/pages/new_patient_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget createTestWidget() {
    return ChangeNotifierProvider(
      create: (_) => AppState(monitorNetwork: false),
      child: const MaterialApp(
        home: NewPatientPage(),
      ),
    );
  }

  group('Fill Dummy Data Demo Quick-Action Tests', () {
    setUp(() {
      final binding = TestWidgetsFlutterBinding.ensureInitialized();
      binding.platformDispatcher.views.first.physicalSize = const Size(800, 1200);
      binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    });

    tearDown(() {
      final binding = TestWidgetsFlutterBinding.ensureInitialized();
      binding.platformDispatcher.views.first.resetPhysicalSize();
      binding.platformDispatcher.views.first.resetDevicePixelRatio();
    });
    testWidgets('Displays Fill Dummy Data button on Step 1', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.byKey(const ValueKey('fill_dummy_data_button')), findsOneWidget);
      expect(find.text('Fill Dummy Data'), findsOneWidget);
      expect(find.text('DEMO'), findsOneWidget);
    });

    testWidgets('Tapping Fill Dummy Data populates valid citizen demographics', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final buttonFinder = find.byKey(const ValueKey('fill_dummy_data_button'));

      // Tap the quick action button
      await tester.tap(buttonFinder);
      await tester.pumpAndSettle();

      // Verify fields are populated with valid demo data
      expect(find.text('Sunita Rao'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
      expect(find.text('15/08/1984'), findsOneWidget);
      expect(find.text('9876543210'), findsOneWidget);
      expect(find.text('Khandala Ward 1'), findsWidgets);
      expect(find.text('91-4421-8839-1092'), findsOneWidget);

      // Verify feedback snackbar is displayed
      expect(find.textContaining('Demo patient data loaded'), findsOneWidget);
    });

    testWidgets('Tapping Fill Dummy Data allows user to immediately proceed to Step 2', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final buttonFinder = find.byKey(const ValueKey('fill_dummy_data_button'));

      // Tap Fill Dummy Data
      await tester.tap(buttonFinder);
      await tester.pumpAndSettle();

      // Dismiss snackbar so it doesn't obscure bottom bar in test
      ScaffoldMessenger.of(tester.element(buttonFinder)).clearSnackBars();
      await tester.pumpAndSettle();

      // Tap Continue to Vitals & Symptoms
      final continueBtn = find.text('Continue to Vitals & Symptoms');
      await tester.tap(continueBtn);
      await tester.pumpAndSettle();

      // Verify step 2 is active (Chief Clinical Complaint / Symptoms header visible)
      expect(find.text('Chief Clinical Complaint'), findsOneWidget);
      expect(find.text('Save Patient & Assess'), findsOneWidget);
    });

    testWidgets('Cycles between valid demo profiles on repeated taps', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      final buttonFinder = find.byKey(const ValueKey('fill_dummy_data_button'));

      // 1st Tap: Sunita Rao
      await tester.tap(buttonFinder);
      await tester.pumpAndSettle();
      expect(find.text('Sunita Rao'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);

      // 2nd Tap: Ramesh Kulkarni
      await tester.tap(buttonFinder);
      await tester.pumpAndSettle();
      expect(find.text('Ramesh Kulkarni'), findsOneWidget);
      expect(find.text('54'), findsOneWidget);
      expect(find.text('9812345678'), findsOneWidget);

      // 3rd Tap: Pooja Chavan
      await tester.tap(buttonFinder);
      await tester.pumpAndSettle();
      expect(find.text('Pooja Chavan'), findsOneWidget);
      expect(find.text('29'), findsOneWidget);
      expect(find.text('9765432109'), findsOneWidget);
    });
  });
}
