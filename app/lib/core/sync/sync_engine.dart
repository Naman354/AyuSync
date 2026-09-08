import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:convert';
import '../network/api_service.dart';
import '../network/local_db.dart';

class SyncEngine {
  static final SyncEngine _instance = SyncEngine._internal();
  factory SyncEngine() => _instance;
  SyncEngine._internal();

  final ApiService _apiService = ApiService();

  Future<void> init() async {
    Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      if (!results.contains(ConnectivityResult.none)) {
        syncNow();
      }
    });
  }

  Future<void> queueMutation(
    String id,
    String entity,
    String action,
    Map<String, dynamic> payload,
  ) async {
    await LocalDatabase.instance.queueMutation({
      'operationId': id,
      'entityId': payload['id']?.toString() ?? id,
      'entity': entity,
      'operation': action,
      'payload': jsonEncode(payload),
      'createdTime': DateTime.now().toIso8601String(),
      'retryCount': 0,
      'syncStatus': 'PENDING',
    });

    final connectivityResult = await Connectivity().checkConnectivity();
    if (!connectivityResult.contains(ConnectivityResult.none)) {
      syncNow();
    }
  }

  Future<void> syncNow() async {
    final pending = await LocalDatabase.instance.getPendingMutations();
    if (pending.isEmpty) return;

    try {
      final mutations = pending.map((p) {
        return {
          'operationId': p['operationId'],
          'entity': p['entity'],
          'action': p['operation'],
          'payload': jsonDecode(p['payload'] as String),
          'deviceId': 'flutter-mobile-client',
          'timestamp': DateTime.now().toIso8601String(),
        };
      }).toList();

      final response = await _apiService.pushSyncBatch(
        workerId: 'ASHA-CG-4902',
        mutations: mutations,
      );

      if (response.isSuccess && response.data != null) {
        final results = response.data!['results'] as List?;
        if (results != null) {
          for (var res in results) {
            if (res is Map &&
                (res['status'] == 'SUCCESS' || res['status'] == 'ALREADY_SYNCED')) {
              final opId = res['operationId']?.toString();
              if (opId != null) {
                await LocalDatabase.instance.markMutationSynced(opId);
              }
              if (res['entityId'] != null) {
                await LocalDatabase.instance.markPatientSynced(res['entityId'].toString());
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('SyncEngine push failed: $e');
    }
  }
}
