class Facility {
  final String id;
  final String name;
  final String type; // Sub-Center, PHC, CHC, District Hospital
  final double distanceKm;
  final int readinessScore; // 0 to 100
  final bool hasSpecialist;
  final bool hasEmergency;
  final int availableBeds;
  final int waitingMinutes;
  final List<String> availableServices;
  final String freshness; // e.g. "Updated 10m ago"

  Facility({
    required this.id,
    required this.name,
    required this.type,
    required this.distanceKm,
    required this.readinessScore,
    required this.hasSpecialist,
    required this.hasEmergency,
    required this.availableBeds,
    required this.waitingMinutes,
    required this.availableServices,
    required this.freshness,
  });

  factory Facility.fromBackendMap(Map<String, dynamic> map) {
    final availability = map['availability'] as Map<String, dynamic>?;
    final readiness = availability != null && availability['readinessScore'] != null
        ? (availability['readinessScore'] as num).toInt()
        : 85;

    final servicesList = <String>[];
    if (map['services'] is List) {
      for (var s in (map['services'] as List)) {
        if (s is Map && s['service'] != null) {
          servicesList.add(s['service'].toString());
        } else if (s is String) {
          servicesList.add(s);
        }
      }
    }

    final capacities = map['capacities'] as List?;
    int beds = 10;
    if (capacities != null && capacities.isNotEmpty) {
      for (var c in capacities) {
        if (c is Map && c['total'] != null && c['occupied'] != null) {
          final total = (c['total'] as num).toInt();
          final occ = (c['occupied'] as num).toInt();
          beds = (total - occ).clamp(0, 999);
        }
      }
    }

    final doctors = map['doctors'] as List?;
    final hasSpecialists = doctors != null && doctors.isNotEmpty;
    final isEmergency = servicesList.any((s) => s.toLowerCase().contains('emergency') || s.toLowerCase().contains('icu')) ||
        (map['type'] != null && (map['type'].toString().contains('CHC') || map['type'].toString().contains('Hospital')));

    return Facility(
      id: map['id']?.toString() ?? '',
      name: map['name']?.toString() ?? 'Health Facility',
      type: map['type']?.toString() ?? 'Primary Health Centre (PHC)',
      distanceKm: (map['distanceKm'] as num?)?.toDouble() ?? 4.2,
      readinessScore: readiness,
      hasSpecialist: hasSpecialists,
      hasEmergency: isEmergency,
      availableBeds: beds,
      waitingMinutes: (map['waitingMinutes'] as num?)?.toInt() ?? 20,
      availableServices: servicesList.isNotEmpty ? servicesList : ['General Medicine', 'Triage', 'Pharmacy'],
      freshness: 'Updated live',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'distanceKm': distanceKm,
      'readinessScore': readinessScore,
      'hasSpecialist': hasSpecialist,
      'hasEmergency': hasEmergency,
      'availableBeds': availableBeds,
      'waitingMinutes': waitingMinutes,
      'availableServices': availableServices,
      'freshness': freshness,
    };
  }
}

class ReferralCase {
  final String referralId;
  final String patientId;
  final String patientName;
  final String triageUrgency;
  final Facility facility;
  final String chiefComplaint;
  final DateTime submittedAt;
  final String status; // SUBMITTED, ACCEPTED, SCHEDULED, IN_CONSULTATION, COMPLETED

  ReferralCase({
    required this.referralId,
    required this.patientId,
    required this.patientName,
    required this.triageUrgency,
    required this.facility,
    required this.chiefComplaint,
    DateTime? submittedAt,
    this.status = 'SUBMITTED',
  }) : submittedAt = submittedAt ?? DateTime.now();

  factory ReferralCase.fromBackendMap(Map<String, dynamic> map, {Facility? fallbackFacility, String? fallbackPatientName}) {
    Facility fac;
    if (map['destination'] is Map<String, dynamic>) {
      fac = Facility.fromBackendMap(map['destination'] as Map<String, dynamic>);
    } else {
      fac = fallbackFacility ??
          Facility(
            id: map['destinationId']?.toString() ?? 'FAC-01',
            name: 'Referred Facility',
            type: 'Health Centre',
            distanceKm: 5.0,
            readinessScore: 90,
            hasSpecialist: true,
            hasEmergency: true,
            availableBeds: 15,
            waitingMinutes: 20,
            availableServices: ['General Medicine'],
            freshness: 'Updated live',
          );
    }

    String patName = fallbackPatientName ?? 'Patient';
    if (map['patient'] is Map && map['patient']['name'] != null) {
      patName = map['patient']['name'].toString();
    }

    return ReferralCase(
      referralId: map['id']?.toString() ?? 'REF-001',
      patientId: map['patientId']?.toString() ?? '',
      patientName: patName,
      triageUrgency: map['urgency']?.toString() ?? 'ROUTINE',
      facility: fac,
      chiefComplaint: map['reason']?.toString() ?? 'Clinical Referral',
      status: map['status']?.toString() ?? 'SUBMITTED',
      submittedAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
