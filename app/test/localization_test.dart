import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ayusync_app/core/localization/app_language.dart';
import 'package:ayusync_app/core/localization/app_translations.dart';
import 'package:ayusync_app/core/localization/language_preferences.dart';
import 'package:ayusync_app/core/state/app_state.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppLanguage Enum & Parsing Tests', () {
    test('Verifies language properties for English, Hindi, and Marathi', () {
      expect(AppLanguage.english.code, 'en');
      expect(AppLanguage.english.nativeName, 'English');
      expect(AppLanguage.english.locale.languageCode, 'en');

      expect(AppLanguage.hindi.code, 'hi');
      expect(AppLanguage.hindi.nativeName, 'हिंदी');
      expect(AppLanguage.hindi.locale.languageCode, 'hi');

      expect(AppLanguage.marathi.code, 'mr');
      expect(AppLanguage.marathi.nativeName, 'मराठी');
      expect(AppLanguage.marathi.locale.languageCode, 'mr');
    });

    test('fromCode parses valid codes and falls back safely', () {
      expect(AppLanguage.fromCode('en'), AppLanguage.english);
      expect(AppLanguage.fromCode('hi'), AppLanguage.hindi);
      expect(AppLanguage.fromCode('mr'), AppLanguage.marathi);
      expect(AppLanguage.fromCode('EN'), AppLanguage.english);
      expect(AppLanguage.fromCode('HI'), AppLanguage.hindi);
      expect(AppLanguage.fromCode('MR'), AppLanguage.marathi);

      // Fallbacks
      expect(AppLanguage.fromCode('fr'), AppLanguage.english);
      expect(AppLanguage.fromCode(null), AppLanguage.english);
      expect(AppLanguage.fromCode(''), AppLanguage.english);
    });
  });

  group('AppTranslations Dictionary Completeness Tests', () {
    test('All English keys exist in Hindi and Marathi with non-empty values', () {
      final enKeys = AppTranslations.allKeys(AppLanguage.english);
      final hiKeys = AppTranslations.allKeys(AppLanguage.hindi);
      final mrKeys = AppTranslations.allKeys(AppLanguage.marathi);

      expect(enKeys.isNotEmpty, isTrue);
      expect(hiKeys.length, enKeys.length,
          reason: 'Hindi dictionary key count must match English');
      expect(mrKeys.length, enKeys.length,
          reason: 'Marathi dictionary key count must match English');

      for (final key in enKeys) {
        final enVal = AppTranslations.get(AppLanguage.english, key);
        final hiVal = AppTranslations.get(AppLanguage.hindi, key);
        final mrVal = AppTranslations.get(AppLanguage.marathi, key);

        expect(enVal.trim().isNotEmpty, isTrue, reason: 'EN value for $key should not be empty');
        expect(hiVal.trim().isNotEmpty, isTrue, reason: 'HI value for $key should not be empty');
        expect(mrVal.trim().isNotEmpty, isTrue, reason: 'MR value for $key should not be empty');
        expect(hiVal != key, isTrue, reason: 'HI should have actual translation for $key');
        expect(mrVal != key, isTrue, reason: 'MR should have actual translation for $key');
      }
    });

    test('Interpolation arguments are replaced accurately across all languages', () {
      final enDays = AppTranslations.get(AppLanguage.english, 'days_unit', args: {'count': '7'});
      final hiDays = AppTranslations.get(AppLanguage.hindi, 'days_unit', args: {'count': '7'});
      final mrDays = AppTranslations.get(AppLanguage.marathi, 'days_unit', args: {'count': '7'});

      expect(enDays, '7 Days');
      expect(hiDays, '7 दिन');
      expect(mrDays, '7 दिवस');

      final enOverdue = AppTranslations.get(AppLanguage.english, 'metric_overdue', args: {'count': '3'});
      final hiOverdue = AppTranslations.get(AppLanguage.hindi, 'metric_overdue', args: {'count': '3'});
      final mrOverdue = AppTranslations.get(AppLanguage.marathi, 'metric_overdue', args: {'count': '3'});

      expect(enOverdue, '3 overdue');
      expect(hiOverdue, '3 विलंबित');
      expect(mrOverdue, '3 थकीत');
    });

    test('Graceful fallback for unknown keys returns key itself', () {
      const missingKey = 'non_existent_key_123';
      expect(AppTranslations.get(AppLanguage.english, missingKey), missingKey);
      expect(AppTranslations.get(AppLanguage.hindi, missingKey), missingKey);
      expect(AppTranslations.get(AppLanguage.marathi, missingKey), missingKey);
    });
  });

  group('AppState Multilingual State & Switching Tests', () {
    test('AppState switches languages and updates translation outputs immediately', () async {
      final appState = AppState();

      // Default is English
      expect(appState.currentLanguage, AppLanguage.english);
      expect(appState.currentLocale.languageCode, 'en');
      expect(appState.translate('action_register'), 'Register Patient');
      expect(appState.translate('gender_female'), 'Female');

      // Switch to Hindi
      await appState.setLanguage(AppLanguage.hindi);
      expect(appState.currentLanguage, AppLanguage.hindi);
      expect(appState.currentLocale.languageCode, 'hi');
      expect(appState.translate('action_register'), 'नागरिक पंजीकरण');
      expect(appState.translate('gender_female'), 'महिला');

      // Switch to Marathi
      await appState.setLanguage(AppLanguage.marathi);
      expect(appState.currentLanguage, AppLanguage.marathi);
      expect(appState.currentLocale.languageCode, 'mr');
      expect(appState.translate('action_register'), 'नागरिक नोंदणी');
      expect(appState.translate('gender_female'), 'महिला');

      // Switch back to English
      await appState.setLanguage(AppLanguage.english);
      expect(appState.currentLanguage, AppLanguage.english);
      expect(appState.currentLocale.languageCode, 'en');
      expect(appState.translate('action_register'), 'Register Patient');
    });

    test('LanguagePreferences cache handles persistence and fallback correctly', () async {
      LanguagePreferences.resetCache();
      // When saving a language, getSavedLanguage returns the cached language immediately
      await LanguagePreferences.saveLanguage(AppLanguage.marathi);
      expect(await LanguagePreferences.getSavedLanguage(), AppLanguage.marathi);

      await LanguagePreferences.saveLanguage(AppLanguage.hindi);
      expect(await LanguagePreferences.getSavedLanguage(), AppLanguage.hindi);

      await LanguagePreferences.saveLanguage(AppLanguage.english);
      expect(await LanguagePreferences.getSavedLanguage(), AppLanguage.english);
    });
  });

  group('MaterialLocalizations Widget Tests', () {
    testWidgets('MaterialLocalizations is successfully found for hi_IN and mr_IN', (tester) async {
      for (final locale in [const Locale('hi', 'IN'), const Locale('mr', 'IN'), const Locale('en', 'US')]) {
        await tester.pumpWidget(
          MaterialApp(
            locale: locale,
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en', 'US'),
              Locale('hi', 'IN'),
              Locale('mr', 'IN'),
            ],
            home: Builder(
              builder: (context) {
                final localizations = MaterialLocalizations.of(context);
                expect(localizations, isNotNull);
                expect(localizations.backButtonTooltip.isNotEmpty, isTrue);
                return Text(localizations.backButtonTooltip);
              },
            ),
          ),
        );
        await tester.pump();
      }
    });
  });
}
