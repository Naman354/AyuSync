import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_recognition_result.dart';

/// Service managing Speech-to-Text audio recognition for AyuSync.
/// Configured for English speech recognition across all app languages.
class VoiceRecognitionService {
  static final VoiceRecognitionService _instance = VoiceRecognitionService._internal();
  factory VoiceRecognitionService() => _instance;
  VoiceRecognitionService._internal();

  final SpeechToText _speech = SpeechToText();
  bool _isInitialized = false;
  bool _isAvailable = false;
  String? _lastError;
  String _englishLocaleId = 'en_IN';

  bool get isInitialized => _isInitialized;
  bool get isAvailable => _isAvailable;
  bool get isListening => _speech.isListening;
  String? get lastError => _lastError;
  String get englishLocaleId => _englishLocaleId;

  /// Initializes the speech recognizer and queries available device locales.
  Future<bool> initialize({
    Function(SpeechRecognitionError)? onError,
    Function(String)? onStatus,
  }) async {
    if (_isInitialized && _isAvailable) return true;

    try {
      _isAvailable = await _speech.initialize(
        onError: (val) {
          _lastError = val.errorMsg;
          onError?.call(val);
        },
        onStatus: (status) {
          onStatus?.call(status);
        },
        debugLogging: kDebugMode,
      );
      _isInitialized = true;

      if (_isAvailable) {
        await _resolveEnglishLocale();
      }
      return _isAvailable;
    } catch (e) {
      _lastError = e.toString();
      _isAvailable = false;
      _isInitialized = true;
      return false;
    }
  }

  /// Locates the optimal English locale supported on the current device (en_IN -> en_US -> en_GB -> system en).
  Future<void> _resolveEnglishLocale() async {
    try {
      final locales = await _speech.locales();
      if (locales.isEmpty) {
        _englishLocaleId = 'en_IN';
        return;
      }

      // Priority: en_IN -> en_US -> en_GB -> any en_* -> first locale
      final localeIds = locales.map((l) => l.localeId).toList();
      if (localeIds.any((id) => id.toLowerCase() == 'en_in' || id.toLowerCase().startsWith('en-in'))) {
        _englishLocaleId = localeIds.firstWhere(
            (id) => id.toLowerCase() == 'en_in' || id.toLowerCase().startsWith('en-in'));
      } else if (localeIds.any((id) => id.toLowerCase() == 'en_us' || id.toLowerCase().startsWith('en-us'))) {
        _englishLocaleId = localeIds.firstWhere(
            (id) => id.toLowerCase() == 'en_us' || id.toLowerCase().startsWith('en-us'));
      } else if (localeIds.any((id) => id.toLowerCase().startsWith('en'))) {
        _englishLocaleId = localeIds.firstWhere((id) => id.toLowerCase().startsWith('en'));
      } else {
        _englishLocaleId = locales.first.localeId;
      }
    } catch (_) {
      _englishLocaleId = 'en_IN';
    }
  }

  /// Starts listening for speech in English.
  Future<bool> startListening({
    required Function(String recognizedWords, bool isFinal) onResult,
    Function(double soundLevel)? onSoundLevel,
    Function(String error)? onError,
    VoidCallback? onDone,
  }) async {
    if (!_isInitialized) {
      final initSuccess = await initialize(
        onError: (err) => onError?.call(err.errorMsg),
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            onDone?.call();
          }
        },
      );
      if (!initSuccess) {
        onError?.call(_lastError ?? 'Speech recognition not available');
        return false;
      }
    }

    if (!_isAvailable) {
      onError?.call('Microphone permission or speech recognition unavailable');
      return false;
    }

    try {
      await _speech.listen(
        onResult: (SpeechRecognitionResult result) {
          onResult(result.recognizedWords, result.finalResult);
        },
        localeId: _englishLocaleId,
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 4),
        onSoundLevelChange: onSoundLevel,
        listenOptions: SpeechListenOptions(
          partialResults: true,
          cancelOnError: false,
          listenMode: ListenMode.dictation,
        ),
      );
      return true;
    } catch (e) {
      _lastError = e.toString();
      onError?.call(e.toString());
      return false;
    }
  }

  /// Stops the current listening session and processes final results.
  Future<void> stopListening() async {
    try {
      if (_speech.isListening) {
        await _speech.stop();
      }
    } catch (_) {}
  }

  /// Cancels listening immediately without waiting for results.
  Future<void> cancelListening() async {
    try {
      if (_speech.isListening) {
        await _speech.cancel();
      }
    } catch (_) {}
  }
}
