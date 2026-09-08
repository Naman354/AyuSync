import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:ayusync_app/core/state/app_state.dart';
import 'package:ayusync_app/core/localization/app_language.dart';
import 'package:ayusync_app/core/localization/app_translations.dart';
import 'package:ayusync_app/core/services/voice_recognition_service.dart';
import 'package:ayusync_app/features/patient/presentation/pages/new_patient_page.dart';

void main() {
  group('Voice Recognition Service Tests', () {
    test('VoiceRecognitionService singleton maintains English locale target', () {
      final service = VoiceRecognitionService();
      expect(service.englishLocaleId, startsWith('en'));
    });

    test('All voice translation keys are translated across en, hi, and mr', () {
      final voiceKeys = [
        'voice_input_tooltip',
        'voice_listening',
        'voice_tap_to_stop',
        'voice_permission_denied',
        'voice_not_available',
        'voice_error',
        'voice_active_badge',
      ];

      for (final lang in AppLanguage.values) {
        final dict = AppTranslations.getDictionary(lang);
        for (final key in voiceKeys) {
          expect(dict.containsKey(key), isTrue, reason: 'Missing $key in ${lang.name}');
          expect(dict[key], isNotEmpty, reason: 'Empty $key in ${lang.name}');
        }
      }
    });
  });

  group('New Patient Page - Voice-to-Text Step 2 UI Tests', () {
    Widget createWidgetUnderTest(AppState appState, {Key? key}) {
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
          home: NewPatientPage(key: key),
        ),
      );
    }

    testWidgets('Step 2 displays microphone button and allows typing in English',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.english);
      await tester.pumpWidget(createWidgetUnderTest(appState, key: const Key('en_page')));
      await tester.pumpAndSettle();

      // Step 1 fill
      await tester.enterText(find.byType(TextField).at(0), 'Suresh Sharma');
      await tester.enterText(find.byType(TextField).at(1), '42');
      await tester.enterText(find.byType(TextField).at(3), '9876543210');
      await tester.pumpAndSettle();

      // Tap Continue to Step 2
      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      // Verify Step 2 is displayed
      expect(find.text(appState.translate('step_2_title')), findsOneWidget);
      expect(find.text(appState.translate('primary_symptom')), findsOneWidget);

      // Verify microphone button and tooltip
      expect(find.byIcon(Icons.mic_none_rounded), findsOneWidget);
      expect(find.byTooltip(appState.translate('voice_input_tooltip')), findsOneWidget);

      // Verify typing works in Primary Symptom field
      final symptomField = find.widgetWithText(TextField, appState.translate('primary_symptom'));
      expect(symptomField, findsOneWidget);
      await tester.enterText(symptomField, 'Severe chest discomfort');
      await tester.pumpAndSettle();

      expect(find.text('Severe chest discomfort'), findsOneWidget);
    });

    testWidgets('Step 2 displays microphone button with Hindi localization',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.hindi);
      await tester.pumpWidget(createWidgetUnderTest(appState, key: const Key('hi_page')));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField).at(0), 'Gita Devi');
      await tester.enterText(find.byType(TextField).at(1), '35');
      await tester.enterText(find.byType(TextField).at(3), '9876501234');
      await tester.pumpAndSettle();

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.mic_none_rounded), findsOneWidget);
      expect(find.byTooltip(appState.translate('voice_input_tooltip')), findsOneWidget);
    });

    testWidgets('Step 2 displays microphone button with Marathi localization',
        (WidgetTester tester) async {
      final appState = AppState(monitorNetwork: false);
      await appState.setLanguage(AppLanguage.marathi);
      await tester.pumpWidget(createWidgetUnderTest(appState, key: const Key('mr_page')));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField).at(0), 'Ananda Kulkarni');
      await tester.enterText(find.byType(TextField).at(1), '50');
      await tester.enterText(find.byType(TextField).at(3), '9876543210');
      await tester.pumpAndSettle();

      await tester.tap(find.byType(ElevatedButton));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.mic_none_rounded), findsOneWidget);
      expect(find.byTooltip(appState.translate('voice_input_tooltip')), findsOneWidget);
    });
  });
}
