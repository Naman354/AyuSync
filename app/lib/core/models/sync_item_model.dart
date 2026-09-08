class SyncItem {
  final String id;
  final String entityType; // PATIENT, ASSESSMENT, REFERRAL, FOLLOW_UP, TASK
  final String action; // CREATE, UPDATE, DELETE
  final String description;
  final DateTime createdAt;
  final String status; // PENDING, SYNCING, SYNCED, FAILED
  final Map<String, dynamic>? payload;

  SyncItem({
    required this.id,
    required this.entityType,
    required this.action,
    required this.description,
    DateTime? createdAt,
    this.status = 'PENDING',
    this.payload,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toBackendMutation({String? deviceId}) {
    String entity = entityType.toUpperCase();
    if (entity == 'FOLLOW_UP') entity = 'FOLLOWUP';

    return {
      'operationId': id,
      'entity': entity,
      'action': action.toUpperCase(),
      'payload': payload ?? {'id': id, 'description': description},
      'deviceId': deviceId ?? 'flutter-mobile-client',
      'timestamp': createdAt.toIso8601String(),
    };
  }

  SyncItem copyWith({
    String? status,
    Map<String, dynamic>? payload,
  }) {
    return SyncItem(
      id: id,
      entityType: entityType,
      action: action,
      description: description,
      createdAt: createdAt,
      status: status ?? this.status,
      payload: payload ?? this.payload,
    );
  }
}
