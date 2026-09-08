import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class ApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? errorMessage;
  final int statusCode;

  ApiResponse({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    required this.statusCode,
  });

  factory ApiResponse.success(T data, {int statusCode = 200}) {
    return ApiResponse(
      isSuccess: true,
      data: data,
      statusCode: statusCode,
    );
  }

  factory ApiResponse.error(String message, {int statusCode = 500}) {
    return ApiResponse(
      isSuccess: false,
      errorMessage: message,
      statusCode: statusCode,
    );
  }
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;

  String? get authToken => _authToken;
  bool get isAuthenticated => _authToken != null && _authToken!.isNotEmpty;

  void setAuthToken(String token) {
    _authToken = token;
  }

  void clearAuthToken() {
    _authToken = null;
  }

  Map<String, String> _buildHeaders({bool requiresAuth = true}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (requiresAuth && _authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Uri _buildUri(String path, [Map<String, dynamic>? queryParameters]) {
    final baseUrl = ApiConfig.baseUrl;
    final baseUri = Uri.parse(baseUrl);
    final cleanPath = path.startsWith('/') ? path : '/$path';
    
    // Merge base path if baseUrl has a subpath
    final fullPath = baseUri.path.isNotEmpty && baseUri.path != '/'
        ? '${baseUri.path}$cleanPath'
        : cleanPath;

    final stringParams = queryParameters?.map((k, v) => MapEntry(k, v.toString()));

    if (baseUri.scheme == 'https') {
      return Uri.https(baseUri.authority, fullPath, stringParams);
    } else {
      return Uri.http(baseUri.authority, fullPath, stringParams);
    }
  }

  // Generic Request Helper
  Future<ApiResponse<T>> _request<T>({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = true,
    T Function(dynamic json)? transform,
  }) async {
    try {
      final uri = _buildUri(path, queryParameters);
      final headers = _buildHeaders(requiresAuth: requiresAuth);

      http.Response response;
      const timeout = Duration(seconds: 30);

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: headers).timeout(timeout);
          break;
        case 'POST':
          response = await http
              .post(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
              .timeout(timeout);
          break;
        case 'PUT':
          response = await http
              .put(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
              .timeout(timeout);
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: headers).timeout(timeout);
          break;
        default:
          return ApiResponse.error('Unsupported HTTP method: $method', statusCode: 400);
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (response.body.isEmpty) {
          return ApiResponse.success(null as T, statusCode: response.statusCode);
        }
        final dynamic decoded = jsonDecode(response.body);
        final data = transform != null ? transform(decoded) : decoded as T;
        return ApiResponse.success(data, statusCode: response.statusCode);
      } else {
        String errorMsg = 'HTTP ${response.statusCode}';
        try {
          final errJson = jsonDecode(response.body);
          if (errJson is Map && errJson['message'] != null) {
            errorMsg = errJson['message'].toString();
          } else if (errJson is Map && errJson['error'] != null) {
            errorMsg = errJson['error'].toString();
          }
        } catch (_) {}
        return ApiResponse.error(errorMsg, statusCode: response.statusCode);
      }
    } catch (e) {
      final errorString = e.toString();
      if (errorString.contains('TimeoutException')) {
        return ApiResponse.error('Server took too long to respond. The cloud service may be waking up, please retry.', statusCode: 504);
      }
      if (errorString.contains('Connection closed before full header was received')) {
        return ApiResponse.error('Server connection was reset (Render is waking up). Please try again in a few seconds.', statusCode: 503);
      }
      if (errorString.contains('SocketException') || errorString.contains('Connection refused') || errorString.contains('Failed host lookup') || errorString.contains('ClientException')) {
        return ApiResponse.error('Unable to connect to the server. Please check your internet connection or try again later.', statusCode: 503);
      }
      return ApiResponse.error(errorString, statusCode: 503);
    }
  }

  // =========================================================
  // 1. AUTHENTICATION & USERS
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> login({
    required String phone,
    required String password,
  }) async {
    final result = await _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.authLogin,
      body: {
        'phone': phone,
        'password': password,
      },
      requiresAuth: false,
    );

    if (result.isSuccess && result.data != null) {
      final token = result.data!['token'] as String?;
      if (token != null) {
        setAuthToken(token);
      }
    }

    return result;
  }

  Future<ApiResponse<List<dynamic>>> getDoctors() async {
    return _request<List<dynamic>>(
      method: 'GET',
      path: ApiConfig.authDoctors,
    );
  }

  // =========================================================
  // 2. PATIENT DOMAIN
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> createPatient({
    required String name,
    required int age,
    required String gender,
    String? phone,
    String? village,
    String? dob,
    String? abhaId,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.patients,
      body: {
        'name': name,
        'age': age,
        'gender': gender.toUpperCase(),
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (village != null && village.isNotEmpty) 'village': village,
        if (dob != null && dob.isNotEmpty) 'dob': dob,
        if (abhaId != null && abhaId.isNotEmpty) 'abhaId': abhaId,
      },
    );
  }

  Future<ApiResponse<List<dynamic>>> searchPatients(String query) async {
    return _request<List<dynamic>>(
      method: 'GET',
      path: ApiConfig.patientsSearch,
      queryParameters: {'q': query},
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> getPatientTimeline(String patientId) async {
    return _request<Map<String, dynamic>>(
      method: 'GET',
      path: '${ApiConfig.patients}/$patientId/timeline',
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> createEncounter({
    required String patientId,
    String? facilityId,
    String type = 'FIELD_VISIT',
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.encounters,
      body: {
        'patientId': patientId,
        'facilityId': facilityId,
        'type': type,
      },
    );
  }

  // =========================================================
  // 3. CLINICAL ASSESSMENTS & AI TRIAGE
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> createAssessment({
    required String patientId,
    String? encounterId,
    required List<Map<String, dynamic>> symptoms,
    List<Map<String, dynamic>>? vitals,
    String provenance = 'WORKER_RECORDED',
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.assessments,
      body: {
        'patientId': patientId,
        if (encounterId != null) 'encounterId': encounterId,
        'symptoms': symptoms,
        if (vitals != null && vitals.isNotEmpty) 'vitals': vitals,
        'provenance': provenance,
      },
    );
  }

  Future<ApiResponse<List<dynamic>>> getAssessmentsByPatient(String patientId) async {
    return _request<List<dynamic>>(
      method: 'GET',
      path: '${ApiConfig.assessments}/patient/$patientId',
    );
  }

  // =========================================================
  // 4. FACILITIES & SMART ROUTING
  // =========================================================

  Future<ApiResponse<List<dynamic>>> getFacilities() async {
    return _request<List<dynamic>>(
      method: 'GET',
      path: ApiConfig.facilities,
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> updateFacilityAvailability(
    String facilityId, {
    required String status,
    int? readinessScore,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'PUT',
      path: '${ApiConfig.facilities}/$facilityId/availability',
      body: {
        'status': status,
        if (readinessScore != null) 'readinessScore': readinessScore,
      },
    );
  }

  // =========================================================
  // 5. REFERRALS & WORKFLOW
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> createReferral({
    required String patientId,
    String? originId,
    required String destinationId,
    String urgency = 'ROUTINE',
    String reason = 'Clinical referral',
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.referrals,
      body: {
        'patientId': patientId,
        if (originId != null && originId.isNotEmpty) 'originId': originId,
        'destinationId': destinationId,
        'urgency': urgency,
        'reason': reason,
      },
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> updateReferralStatus(
    String referralId, {
    required String newStatus,
    String? notes,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'PUT',
      path: '${ApiConfig.referrals}/$referralId/status',
      body: {
        'newStatus': newStatus,
        if (notes != null) 'notes': notes,
      },
    );
  }

  // =========================================================
  // 6. QUEUE & APPOINTMENTS
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> enqueuePatient({
    String? appointmentId,
    String? patientId,
    String? facilityId,
    String? doctorId,
    int priority = 0,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.queue,
      body: {
        if (appointmentId != null) 'appointmentId': appointmentId,
        if (patientId != null) 'patientId': patientId,
        if (facilityId != null) 'facilityId': facilityId,
        if (doctorId != null) 'doctorId': doctorId,
        'priority': priority,
      },
    );
  }

  Future<ApiResponse<List<dynamic>>> getAllQueue() async {
    return _request<List<dynamic>>(
      method: 'GET',
      path: ApiConfig.queue,
    );
  }

  Future<ApiResponse<List<dynamic>>> getQueueForDoctor(String doctorId) async {
    return _request<List<dynamic>>(
      method: 'GET',
      path: '${ApiConfig.queue}/doctor/$doctorId',
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> updateQueueStatus(
    String queueId, {
    required String status,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'PUT',
      path: '${ApiConfig.queue}/$queueId/status',
      body: {'status': status},
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> bookAppointment({
    required String patientId,
    required String facilityId,
    required String doctorId,
    required DateTime scheduledAt,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.appointments,
      body: {
        'patientId': patientId,
        'facilityId': facilityId,
        'doctorId': doctorId,
        'scheduledAt': scheduledAt.toIso8601String(),
      },
    );
  }

  Future<ApiResponse<List<dynamic>>> getAllAppointments() async {
    return _request<List<dynamic>>(
      method: 'GET',
      path: ApiConfig.appointments,
    );
  }

  // =========================================================
  // 7. DASHBOARD ANALYTICS
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> getDashboardAnalytics() async {
    return _request<Map<String, dynamic>>(
      method: 'GET',
      path: ApiConfig.analyticsDashboard,
    );
  }

  // =========================================================
  // 8. OFFLINE SYNC (PUSH BATCH & DELTA PULL)
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> pushSyncBatch({
    required String workerId,
    required List<Map<String, dynamic>> mutations,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.syncPush,
      body: {
        'workerId': workerId,
        'mutations': mutations,
      },
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> pullSyncChanges({
    DateTime? since,
    String? facilityId,
    String? workerId,
  }) async {
    final queryParams = <String, dynamic>{};
    if (since != null) {
      queryParams['since'] = since.toIso8601String();
    }
    if (facilityId != null && facilityId.isNotEmpty) {
      queryParams['facilityId'] = facilityId;
    }
    if (workerId != null && workerId.isNotEmpty) {
      queryParams['workerId'] = workerId;
    }

    return _request<Map<String, dynamic>>(
      method: 'GET',
      path: ApiConfig.syncPull,
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
  }

  Future<ApiResponse<Map<String, dynamic>>> resolveSyncConflict({
    required String conflictId,
    required String resolutionStrategy,
    Map<String, dynamic>? mergedPayload,
  }) async {
    return _request<Map<String, dynamic>>(
      method: 'POST',
      path: ApiConfig.syncConflictResolve,
      body: {
        'conflictId': conflictId,
        'resolutionStrategy': resolutionStrategy,
        if (mergedPayload != null) 'mergedPayload': mergedPayload,
      },
    );
  }

  // =========================================================
  // 9. HEALTH CHECK
  // =========================================================

  Future<ApiResponse<Map<String, dynamic>>> checkHealth() async {
    return _request<Map<String, dynamic>>(
      method: 'GET',
      path: ApiConfig.health,
      requiresAuth: false,
    );
  }
}
