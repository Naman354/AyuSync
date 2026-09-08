import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/app_state.dart';
import 'app_language.dart';

extension LocalizationExtension on BuildContext {
  /// Translates a string key using the active AppLanguage from AppState.
  /// Automatically listens to AppState language changes and triggers widget rebuild.
  String tr(String key, {Map<String, String>? args}) {
    return watch<AppState>().translate(key, args: args);
  }

  /// Read-only translation lookup without subscribing to widget rebuilds.
  String trRead(String key, {Map<String, String>? args}) {
    return read<AppState>().translate(key, args: args);
  }

  /// Active AppLanguage
  AppLanguage get currentLanguage => watch<AppState>().currentLanguage;
}
