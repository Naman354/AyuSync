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

    try {
      final connectivityResults = await Connectivity().checkConnectivity();
      if (!connectivityResults.contains(ConnectivityResult.none)) {
        syncNow();
      }
    } catch (_) {
      // Graceful fallback for test environments without platform channels
    }
  }

  Future<bool> syncNow({String workerId = 'ASHA-WORKER-APP'}) async {
    if (_isSyncing) return false;

    // 1. Ensure authenticated with cached or fresh Bearer token
    await ApiService.instance.ensureAuthenticated();

    // 2. Fetch pending mutations from SQLite sync_queue
    final pending = List<Map<String, dynamic>>.from(
      await LocalDatabase.instance.getPendingSyncMutations(),
    );

    // 3. Resilient recovery: also check for un-synced patients in SQLite patients table
    final unSyncedPatients = await LocalDatabase.instance.getUnSyncedPatients();
    final queuedPatientIds = pending
        .where((p) => p['entity'] == 'PATIENT')
        .map((p) => p['entityId']?.toString())
        .toSet();

    for (var p in unSyncedPatients) {
      final pId = p['id']?.toString() ?? '';
      if (pId.isNotEmpty && !queuedPatientIds.contains(pId)) {
        final opId = 'OP-PAT-$pId-${DateTime.now().millisecondsSinceEpoch}';
        final payload = {
          'id': pId,
          'name': p['name'] ?? 'Community Patient',
          'age': p['age'] is int ? p['age'] : (int.tryParse(p['age']?.toString() ?? '') ?? 30),
          'gender': (p['gender']?.toString() ?? 'FEMALE').toUpperCase(),
          'phone': p['phone']?.toString() ?? '',
          'village': p['village']?.toString() ?? '',
          if (p['dob'] != null && p['dob'].toString().isNotEmpty) 'dob': p['dob'].toString(),
          if (p['abhaId'] != null && p['abhaId'].toString().isNotEmpty) 'abhaId': p['abhaId'].toString(),
        };

        // Queue in SQLite
        await LocalDatabase.instance.queueMutation({
          'operationId': opId,
          'entityId': pId,
          'entity': 'PATIENT',
          'operation': 'CREATE',
          'payload': jsonEncode(payload),
          'createdTime': DateTime.now().toIso8601String(),
          'retryCount': 0,
          'syncStatus': 'PENDING',
        });

        pending.add({
          'operationId': opId,
          'entityId': pId,
          'entity': 'PATIENT',
          'operation': 'CREATE',
          'payload': jsonEncode(payload),
          'createdTime': DateTime.now().toIso8601String(),
        });
        queuedPatientIds.add(pId);
      }
    }

    if (pending.isEmpty) return true;

    _isSyncing = true;
    try {
      final mutations = pending.map((p) {
        dynamic decodedPayload;
        try {
          decodedPayload = jsonDecode(p['payload'] as String);
        } catch (_) {
          decodedPayload = p['payload'];
        }

        return {
          'operationId': p['operationId'],
          'entity': p['entity'],
          'action': p['operation'],
          'payload': decodedPayload,
          'timestamp': p['createdTime'],
        };
      }).toList();

      final result = await ApiService.instance.processSyncBatch(
        workerId: workerId,
        mutations: mutations,
      );

      if (result.containsKey('results')) {
        for (var res in result['results']) {
          final opId = res['operationId']?.toString() ?? '';
          final status = res['status']?.toString() ?? '';

          if (status == 'SUCCESS' || status == 'ALREADY_SYNCED') {
            await LocalDatabase.instance.markMutationSynced(opId);

            // Find matching mutation to update entity table
            final match = pending.firstWhere(
              (p) => p['operationId'] == opId,
              orElse: () => <String, dynamic>{},
            );

            if (match.isNotEmpty) {
              final entity = match['entity']?.toString();
              final entityId = match['entityId']?.toString();

              if (entity == 'PATIENT' && entityId != null && entityId.isNotEmpty) {
                await LocalDatabase.instance.markPatientSynced(entityId);
              } else if ((entity == 'FOLLOWUP' || entity == 'FOLLOW_UP') && entityId != null && entityId.isNotEmpty) {
                await LocalDatabase.instance.markFollowUpSynced(entityId);
              }
            }
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
