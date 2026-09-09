import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ayusync_app/core/localization/app_language.dart';
import 'package:ayusync_app/core/state/app_state.dart';
import 'package:ayusync_app/features/assessment/presentation/pages/assessment_form_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget createWidgetUnderTest(AppState appState, {Size size = const Size(360, 800)}) {
    return ChangeNotifierProvider<AppState>.value(
      value: appState,
      child: MaterialApp(
        locale: appState.currentLanguage.locale,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('en', 'US'),
          Locale('en', 'IN'),
          Locale('hi', 'IN'),
          Locale('mr', 'IN'),
        ],
        home: MediaQuery(
          data: MediaQueryData(size: size),
          child: const AssessmentFormPage(),
        ),
      ),
    );
  }

  group('AssessmentFormPage - Moderate Dropdown Layout & Overflow Tests', () {
    testWidgets('Dropdowns render with isExpanded without RenderFlex overflow on 360px screen',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final appState = AppState(monitorNetwork: false);
      await appState.registerPatient(
        name: 'Sunita Sharma',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'Khandala Ward 1',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState, size: const Size(360, 800)));
      await tester.pumpAndSettle();

      // Ensure no layout exceptions or RenderFlex overflow
      expect(tester.takeException(), isNull);

      // Verify severity dropdown is present and defaults to Moderate
      expect(find.text(appState.translate('severity_moderate')), findsOneWidget);
      expect(find.text(appState.translate('severity_label')), findsOneWidget);

      // Verify duration dropdown is present
      expect(find.text(appState.translate('duration_label')), findsOneWidget);
      expect(find.text(appState.translate('days_unit', args: {'count': '3'})), findsOneWidget);
    });

    testWidgets('Dropdowns render without overflow on ultra-narrow 320px screen',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final appState = AppState(monitorNetwork: false);
      await appState.registerPatient(
        name: 'Sunita Sharma',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'Khandala Ward 1',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState, size: const Size(320, 640)));
      await tester.pumpAndSettle();

      // Must not have overflow
      expect(tester.takeException(), isNull);
      expect(find.text(appState.translate('severity_moderate')), findsOneWidget);
    });

    testWidgets('Dropdowns render without overflow with Hindi translations',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.hindi);
      await appState.registerPatient(
        name: 'सुनीता शर्मा',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'खंडाळा',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState, size: const Size(360, 800)));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text(appState.translate('severity_moderate')), findsOneWidget);
    });

    testWidgets('Dropdowns render without overflow with Marathi translations',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.marathi);
      await appState.registerPatient(
        name: 'सुनीता शर्मा',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'खंडाळा',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState, size: const Size(360, 800)));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text(appState.translate('severity_moderate')), findsOneWidget);
    });

    testWidgets('User can change severity selection without layout error',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.registerPatient(
        name: 'Sunita Sharma',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'Khandala Ward 1',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState));
      await tester.pumpAndSettle();

      // Tap Moderate dropdown
      await tester.tap(find.text(appState.translate('severity_moderate')));
      await tester.pumpAndSettle();

      // Select Severe
      final severeItem = find.text(appState.translate('severity_severe')).last;
      await tester.tap(severeItem);
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text(appState.translate('severity_severe')), findsOneWidget);
    });
  });

  group('AssessmentFormPage - Voice-to-Text UI Tests', () {
    testWidgets('Primary symptom input includes microphone button and tooltip in English',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.english);
      await appState.registerPatient(
        name: 'Sunita Sharma',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'Khandala Ward 1',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState));
      await tester.pumpAndSettle();

      // Verify microphone button and tooltip
      expect(find.byIcon(Icons.mic_none_rounded), findsOneWidget);
      expect(find.byTooltip(appState.translate('voice_input_tooltip')), findsOneWidget);

      // Verify typing into primary symptom field still works normally
      final symptomField = find.widgetWithText(TextFormField, appState.translate('hint_primary_symptom'));
      expect(symptomField, findsOneWidget);
      await tester.enterText(symptomField, 'Persistent dry cough for 3 days');
      await tester.pumpAndSettle();

      expect(find.text('Persistent dry cough for 3 days'), findsOneWidget);
    });

    testWidgets('Primary symptom input displays microphone button and tooltip in Hindi',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.hindi);
      await appState.registerPatient(
        name: 'सुनीता शर्मा',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'खंडाळा',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.mic_none_rounded), findsOneWidget);
      expect(find.byTooltip(appState.translate('voice_input_tooltip')), findsOneWidget);
    });

    testWidgets('Primary symptom input displays microphone button and tooltip in Marathi',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.marathi);
      await appState.registerPatient(
        name: 'सुनीता शर्मा',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'खंडाळा',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.mic_none_rounded), findsOneWidget);
      expect(find.byTooltip(appState.translate('voice_input_tooltip')), findsOneWidget);
    });

    testWidgets('Tapping mic button triggers voice recognition toggle',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.registerPatient(
        name: 'Sunita Sharma',
        age: 36,
        gender: 'Female',
        phone: '9876543210',
        village: 'Khandala Ward 1',
      );

      await tester.pumpWidget(createWidgetUnderTest(appState));
      await tester.pumpAndSettle();

      final micButton = find.byTooltip(appState.translate('voice_input_tooltip'));
      expect(micButton, findsOneWidget);

      await tester.tap(micButton);
      await tester.pump();

      // Ensure no exceptions occurred
      expect(tester.takeException(), isNull);
    });
  });
}
