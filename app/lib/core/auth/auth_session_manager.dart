import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// Manages persistent authentication and worker session data.
/// Saves session securely to device storage so the user remains logged in
/// across app closures until an explicit logout is initiated.
class AuthSessionManager {
  static const String _fileName = 'ayusync_auth_session.json';
  static Map<String, dynamic>? _cachedSession;

  /// Loads the persisted session from local device storage.
  /// Returns null if no active session exists or if logged out.
  static Future<Map<String, dynamic>?> loadSession() async {
    if (_cachedSession != null) {
      return _cachedSession;
    }

    if (Platform.environment.containsKey('FLUTTER_TEST')) {
      return null;
    }

    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$_fileName');
      if (await file.exists()) {
        final content = await file.readAsString();
        if (content.isNotEmpty) {
          final data = jsonDecode(content);
          if (data is Map<String, dynamic> && data['isLoggedIn'] == true) {
            _cachedSession = data;
            return data;
          }
        }
      }
    } catch (e) {
      debugPrint('AuthSessionManager: error loading session: $e');
    }
    return null;
  }

  /// Persists the active user session data.
  static Future<void> saveSession({
    required String workerName,
    required String workerId,
    required String workerPhone,
    required String workerCenter,
    String? authToken,
  }) async {
    final sessionData = <String, dynamic>{
      'isLoggedIn': true,
      'workerName': workerName,
      'workerId': workerId,
      'workerPhone': workerPhone,
      'workerCenter': workerCenter,
      'authToken': authToken,
      'savedAt': DateTime.now().toIso8601String(),
    };
    _cachedSession = sessionData;

    if (Platform.environment.containsKey('FLUTTER_TEST')) return;

    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$_fileName');
      await file.writeAsString(jsonEncode(sessionData));
    } catch (e) {
      debugPrint('AuthSessionManager: error saving session: $e');
    }
  }

  /// Securely clears the session data on explicit user logout.
  static Future<void> clearSession() async {
    _cachedSession = null;

    if (Platform.environment.containsKey('FLUTTER_TEST')) return;

    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$_fileName');
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e) {
      debugPrint('AuthSessionManager: error clearing session: $e');
    }
  }

  /// Manually injects or clears the cached session (for testing).
  @visibleForTesting
  static void setMockSession(Map<String, dynamic>? mockSession) {
    _cachedSession = mockSession;
  }

  /// Resets in-memory cache.
  static void resetCache() {
    _cachedSession = null;
  }
}
