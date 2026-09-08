class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String phone;
  final String village;
  final String? abhaId;
  final String? bloodGroup;
  final String? dob;
  final String? emergencyContact;
  final String? preferredLanguage;
  final String? district;
  final String? state;
  final String? pinCode;
  final String? address;
  final String? allergies;
  final String? existingConditions;
  final String? currentMedications;
  final String? pastHistory;
  final DateTime createdAt;
  final bool isSynced;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.phone,
    required this.village,
    this.abhaId,
    this.bloodGroup,
    this.dob,
    this.emergencyContact,
    this.preferredLanguage,
    this.district,
    this.state,
    this.pinCode,
    this.address,
    this.allergies,
    this.existingConditions,
    this.currentMedications,
    this.pastHistory,
    DateTime? createdAt,
    this.isSynced = true,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'age': age,
      'gender': gender,
      'phone': phone,
      'village': village,
      'abhaId': abhaId ?? '',
      'bloodGroup': bloodGroup ?? '',
      'dob': dob ?? '',
      'emergencyContact': emergencyContact ?? '',
      'preferredLanguage': preferredLanguage ?? '',
      'district': district ?? '',
      'state': state ?? '',
      'pinCode': pinCode ?? '',
      'address': address ?? '',
      'allergies': allergies ?? '',
      'existingConditions': existingConditions ?? '',
      'currentMedications': currentMedications ?? '',
      'pastHistory': pastHistory ?? '',
      'createdAt': createdAt.toIso8601String(),
      'isSynced': isSynced ? 1 : 0,
    };
  }

  factory Patient.fromMap(Map<String, dynamic> map) {
    // Extract ABHA from nested identifiers array if present
    String? resolvedAbha = map['abhaId'] != '' ? map['abhaId'] : null;
    if (resolvedAbha == null && map['identifiers'] is List) {
      for (var ident in (map['identifiers'] as List)) {
        if (ident is Map && ident['type'] == 'ABHA' && ident['value'] != null) {
          resolvedAbha = ident['value'].toString();
          break;
        }
      }
    }

    String genderStr = map['gender']?.toString() ?? 'Other';
    if (genderStr == 'MALE') genderStr = 'Male';
    if (genderStr == 'FEMALE') genderStr = 'Female';
    if (genderStr == 'OTHER') genderStr = 'Other';

    return Patient(
      id: map['id']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      age: map['age'] is int ? map['age'] : int.tryParse(map['age']?.toString() ?? '0') ?? 0,
      gender: genderStr,
      phone: map['phone']?.toString() ?? '',
      village: map['village']?.toString() ?? '',
      abhaId: resolvedAbha,
      bloodGroup: (map['bloodGroup'] != null && map['bloodGroup'] != '') ? map['bloodGroup'].toString() : null,
      dob: (map['dob'] != null && map['dob'] != '') ? map['dob'].toString() : null,
      emergencyContact: (map['emergencyContact'] != null && map['emergencyContact'] != '') ? map['emergencyContact'].toString() : null,
      preferredLanguage: (map['preferredLanguage'] != null && map['preferredLanguage'] != '') ? map['preferredLanguage'].toString() : null,
      district: (map['district'] != null && map['district'] != '') ? map['district'].toString() : null,
      state: (map['state'] != null && map['state'] != '') ? map['state'].toString() : null,
      pinCode: (map['pinCode'] != null && map['pinCode'] != '') ? map['pinCode'].toString() : null,
      address: (map['address'] != null && map['address'] != '') ? map['address'].toString() : null,
      allergies: (map['allergies'] != null && map['allergies'] != '') ? map['allergies'].toString() : null,
      existingConditions: (map['existingConditions'] != null && map['existingConditions'] != '') ? map['existingConditions'].toString() : null,
      currentMedications: (map['currentMedications'] != null && map['currentMedications'] != '') ? map['currentMedications'].toString() : null,
      pastHistory: (map['pastHistory'] != null && map['pastHistory'] != '') ? map['pastHistory'].toString() : null,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isSynced: map['isSynced'] == null ? true : (map['isSynced'] == 1 || map['isSynced'] == true),
    );
  }

  Patient copyWith({
    String? id,
    String? name,
    int? age,
    String? gender,
    String? phone,
    String? village,
    String? abhaId,
    String? bloodGroup,
    String? dob,
    String? emergencyContact,
    String? preferredLanguage,
    String? district,
    String? state,
    String? pinCode,
    String? address,
    String? allergies,
    String? existingConditions,
    String? currentMedications,
    String? pastHistory,
    DateTime? createdAt,
    bool? isSynced,
  }) {
    return Patient(
      id: id ?? this.id,
      name: name ?? this.name,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      phone: phone ?? this.phone,
      village: village ?? this.village,
      abhaId: abhaId ?? this.abhaId,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      dob: dob ?? this.dob,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      district: district ?? this.district,
      state: state ?? this.state,
      pinCode: pinCode ?? this.pinCode,
      address: address ?? this.address,
      allergies: allergies ?? this.allergies,
      existingConditions: existingConditions ?? this.existingConditions,
      currentMedications: currentMedications ?? this.currentMedications,
      pastHistory: pastHistory ?? this.pastHistory,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
    );
  }
}
