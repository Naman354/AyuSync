class FollowUpTask {
  final String id;
  final String patientId;
  final String patientName;
  final String patientPhone;
  final String doctorName;
  final String doctorFacility;
  final String taskDescription;
  final String instructions;
  final List<String> prescribedMedicines;
  final DateTime dueDate;
  final String status; // PENDING, OVERDUE, COMPLETED
  final String? visitNotes;
  final DateTime? completedAt;

  FollowUpTask({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.patientPhone,
    required this.doctorName,
    required this.doctorFacility,
    required this.taskDescription,
    required this.instructions,
    required this.prescribedMedicines,
    required this.dueDate,
    this.status = 'PENDING',
    this.visitNotes,
    this.completedAt,
  });

  factory FollowUpTask.fromBackendFollowUp(
    Map<String, dynamic> map, {
    String? patientName,
    String? patientPhone,
    String? doctorName,
    String? facilityName,
  }) {
    final due = map['dueDate'] != null
        ? DateTime.tryParse(map['dueDate'].toString()) ?? DateTime.now().add(const Duration(days: 1))
        : DateTime.now().add(const Duration(days: 1));

    String currentStatus = map['status']?.toString() ?? 'PENDING';
    if (currentStatus == 'PENDING' && due.isBefore(DateTime.now())) {
      currentStatus = 'OVERDUE';
    }

    final reason = map['reason']?.toString() ?? 'Follow-up clinical assessment & treatment compliance';

    return FollowUpTask(
      id: map['id']?.toString() ?? 'TASK-${DateTime.now().millisecondsSinceEpoch}',
      patientId: map['patientId']?.toString() ?? '',
      patientName: patientName ?? map['patientName']?.toString() ?? 'Citizen Patient',
      patientPhone: patientPhone ?? map['patientPhone']?.toString() ?? '+91 98765 43210',
      doctorName: doctorName ?? 'Dr. Deshmukh',
      doctorFacility: facilityName ?? 'District Health Centre',
      taskDescription: reason,
      instructions: 'Check patient vitals, verify medication adherence, and record home visit observations.',
      prescribedMedicines: ['Prescribed Medication (Daily dosage)'],
      dueDate: due,
      status: currentStatus,
      visitNotes: map['visitNotes']?.toString(),
      completedAt: map['completedAt'] != null ? DateTime.tryParse(map['completedAt'].toString()) : null,
    );
  }

  FollowUpTask copyWith({
    String? status,
    String? visitNotes,
    DateTime? completedAt,
  }) {
    return FollowUpTask(
      id: id,
      patientId: patientId,
      patientName: patientName,
      patientPhone: patientPhone,
      doctorName: doctorName,
      doctorFacility: doctorFacility,
      taskDescription: taskDescription,
      instructions: instructions,
      prescribedMedicines: prescribedMedicines,
      dueDate: dueDate,
      status: status ?? this.status,
      visitNotes: visitNotes ?? this.visitNotes,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
