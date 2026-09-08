import 'dart:ui' show Locale;

enum AppLanguage {
  english('en', 'English', 'English', 'Default'),
  hindi('hi', 'Hindi', 'हिंदी', 'राष्ट्रीय भाषा'),
  marathi('mr', 'Marathi', 'मराठी', 'प्रादेशिक भाषा');

  final String code;
  final String name;
  final String nativeName;
  final String description;

  const AppLanguage(this.code, this.name, this.nativeName, this.description);

  Locale get locale => Locale(code);

  static AppLanguage fromCode(String? code) {
    if (code == null) return AppLanguage.english;
    final lower = code.toLowerCase().trim();
    for (final lang in AppLanguage.values) {
      if (lang.code.toLowerCase() == lower) {
        return lang;
      }
    }
    return AppLanguage.english;
  }
}
