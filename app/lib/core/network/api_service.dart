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
  static ApiService get instance => _instance;
  ApiService._internal();

  String? _authToken;

  String? get authToken => _authToken;
  bool get isAuthenticated => _authToken != null && _authToken!.isNotEmpty;

  void setAuthToken(String? token) {
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

  // Generic Request Helper returning decoded JSON
  Future<dynamic> _request({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = true,
  }) async {
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
        throw Exception('Unsupported HTTP method: $method');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return jsonDecode(response.body);
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
      throw Exception(errorMsg);
    }
  }

  // =========================================================
  // 1. AUTHENTICATION & USERS
  // =========================================================

  Future<Map<String, dynamic>> login({
    String? identifier,
    String? phone,
    required String password,
  }) async {
    final loginPhone = phone ?? identifier ?? '';
    final result = await _request(
      method: 'POST',
      path: ApiConfig.authLogin,
      body: {
        'phone': loginPhone,
        'password': password,
      },
      requiresAuth: false,
    );

    if (result is Map<String, dynamic> && result['token'] != null) {
      setAuthToken(result['token'] as String);
    }

    return (result is Map<String, dynamic>) ? result : {};
  }

  // =========================================================
  // 2. PATIENT DOMAIN
  // =========================================================

  Future<Map<String, dynamic>> createPatient({
    required String name,
    required int age,
    required String gender,
    String? phone,
    String? village,
    String? dob,
    String? abhaId,
  }) async {
    final result = await _request(
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
    return (result is Map<String, dynamic>) ? result : {};
  }

  Future<List<dynamic>> searchPatients([String query = '']) async {
    final result = await _request(
      method: 'GET',
      path: ApiConfig.patientSearch,
      queryParameters: query.isNotEmpty ? {'q': query} : null,
    );
    return (result is List) ? result : [];
  }

  // =========================================================
  // 3. ENCOUNTER & ASSESSMENT DOMAIN
  // =========================================================

  Future<Map<String, dynamic>> createEncounter({
    required String patientId,
    String type = 'OUTPATIENT',
  }) async {
    final result = await _request(
      method: 'POST',
      path: ApiConfig.encounters,
      body: {
        'patientId': patientId,
        'type': type,
      },
    );
    return (result is Map<String, dynamic>) ? result : {};
  }

  Future<Map<String, dynamic>> createAssessment({
    required String patientId,
    String? encounterId,
    List<Map<String, dynamic>>? symptoms,
    List<Map<String, dynamic>>? vitals,
  }) async {
    final result = await _request(
      method: 'POST',
      path: ApiConfig.assessments,
      body: {
        'patientId': patientId,
        if (encounterId != null) 'encounterId': encounterId,
        if (symptoms != null) 'symptoms': symptoms,
        if (vitals != null) 'vitals': vitals,
      },
    );
    return (result is Map<String, dynamic>) ? result : {};
  }

  // =========================================================
  // 4. FACILITIES & ROUTING
  // =========================================================

  Future<List<dynamic>> getFacilities() async {
    final result = await _request(
      method: 'GET',
      path: ApiConfig.facilities,
    );
    return (result is List) ? result : [];
  }

  Future<Map<String, dynamic>> createReferral({
    required String patientId,
    required String originId,
    required String destinationId,
    required String reason,
    required String urgency,
  }) async {
    final result = await _request(
      method: 'POST',
      path: ApiConfig.referrals,
      body: {
        'patientId': patientId,
        'originId': originId,
        'destinationId': destinationId,
        'reason': reason,
        'urgency': urgency,
      },
    );
    return (result is Map<String, dynamic>) ? result : {};
  }

  Future<List<dynamic>> getReferrals() async {
    final result = await _request(
      method: 'GET',
      path: ApiConfig.referrals,
    );
    return (result is List) ? result : [];
  }

  // =========================================================
  // 5. FOLLOW-UP TASKS
  // =========================================================

  Future<List<dynamic>> getFollowUps() async {
    final result = await _request(
      method: 'GET',
      path: ApiConfig.followups,
    );
    return (result is List) ? result : [];
  }

  // =========================================================
  // 6. OFFLINE SYNC BATCH
  // =========================================================

  Future<Map<String, dynamic>> processSyncBatch({
    required String workerId,
    required List<Map<String, dynamic>> mutations,
  }) async {
    final result = await _request(
      method: 'POST',
      path: ApiConfig.sync,
      body: {
        'workerId': workerId,
        'mutations': mutations,
      },
    );
    return (result is Map<String, dynamic>) ? result : {};
  }
}
