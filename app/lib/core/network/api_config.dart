class ApiConfig {
  static String? _customBaseUrl;

  /// Returns the base URL for the AyuSync backend.
  /// Defaults to the deployed Render backend: https://ayusync-backend.onrender.com
  static String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }
    return 'https://ayusync-backend.onrender.com';
  }

  static void setBaseUrl(String url) {
    _customBaseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  // Endpoints
  static const String authLogin = '/api/auth/login';
  static const String authDoctors = '/api/auth/doctors';
  static const String patients = '/api/patients';
  static const String patientsSearch = '/api/patients/search';
  static const String encounters = '/api/patients/encounter';
  static const String assessments = '/api/assessments';
  static const String facilities = '/api/facilities';
  static const String referrals = '/api/referrals';
  static const String queue = '/api/queue';
  static const String appointments = '/api/appointments';
  static const String analyticsDashboard = '/api/analytics/dashboard';
  static const String syncPush = '/api/sync';
  static const String syncPull = '/api/sync/pull';
  static const String syncConflictResolve = '/api/sync/conflict/resolve';
  static const String health = '/health';
}
