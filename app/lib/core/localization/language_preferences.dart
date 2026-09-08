import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'app_language.dart';

class LanguagePreferences {
  static const String _fileName = 'ayusync_language.json';
  static AppLanguage? _cachedLanguage;

  /// Loads the saved language preference from local storage.
  /// Falls back to English if nothing has been saved yet or if an error occurs.
  static Future<AppLanguage> getSavedLanguage() async {
    if (_cachedLanguage != null) {
      return _cachedLanguage!;
    }

    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$_fileName');
      if (await file.exists()) {
        final content = await file.readAsString();
        final data = jsonDecode(content);
        if (data is Map && data['code'] != null) {
          _cachedLanguage = AppLanguage.fromCode(data['code'].toString());
          return _cachedLanguage!;
        }
      }
    } catch (_) {
      // Fallback cleanly to default
    }

    _cachedLanguage = AppLanguage.english;
    return AppLanguage.english;
  }

  /// Saves the chosen language preference to local storage.
  static Future<void> saveLanguage(AppLanguage language) async {
    _cachedLanguage = language;
    if (Platform.environment.containsKey('FLUTTER_TEST')) return;
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$_fileName');
      final data = {
        'code': language.code,
        'name': language.name,
        'updatedAt': DateTime.now().toIso8601String(),
      };
      await file.writeAsString(jsonEncode(data));
    } catch (_) {
      // Cache will still serve the session
    }
  }

  /// Clears cache (useful for testing)
  static void resetCache() {
    _cachedLanguage = null;
  }
}
