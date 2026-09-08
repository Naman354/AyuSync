import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import '../network/api_service.dart';
import '../network/local_db.dart';

class SyncEngine {
  static final SyncEngine _instance = SyncEngine._internal();
  factory SyncEngine() => _instance;
  SyncEngine._internal();

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  Future<void> init() async {
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      if (!results.contains(ConnectivityResult.none)) {
        syncNow();
      }
    });
  }

  Future<void> queueMutation({
    required String operationId,
    required String entityId,
    required String entity,
    required String action,
    required Map<String, dynamic> payload,
  }) async {
    await LocalDatabase.instance.queueMutation({
      'operationId': operationId,
      'entityId': entityId,
      'entity': entity,
      'operation': action,
      'payload': jsonEncode(payload),
      'createdTime': DateTime.now().toIso8601String(),
      'retryCount': 0,
      'syncStatus': 'PENDING',
    });

    final connectivityResults = await Connectivity().checkConnectivity();
    if (!connectivityResults.contains(ConnectivityResult.none)) {
      syncNow();
    }
  }

  Future<bool> syncNow({String workerId = 'ASHA-WORKER-APP'}) async {
    if (_isSyncing) return false;

    final pending = await LocalDatabase.instance.getPendingSyncMutations();
    if (pending.isEmpty) return true;

    _isSyncing = true;
    try {
      final mutations = pending.map((p) {
        return {
          'operationId': p['operationId'],
          'entity': p['entity'],
          'action': p['operation'],
          'payload': jsonDecode(p['payload'] as String),
          'timestamp': p['createdTime'],
        };
      }).toList();

      final result = await ApiService.instance.processSyncBatch(
        workerId: workerId,
        mutations: mutations,
      );

      if (result.containsKey('results')) {
        for (var res in result['results']) {
          if (res['status'] == 'SUCCESS' || res['status'] == 'ALREADY_SYNCED') {
            await LocalDatabase.instance.markMutationSynced(res['operationId']);
          }
        }
        await LocalDatabase.instance.clearSyncedMutations();
      }
      return true;
    } catch (e) {
      debugPrint('Sync error: $e');
      return false;
    } finally {
      _isSyncing = false;
    }
  }
}
