class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String phone;
  final String village;
  final String? dob;
  final String? abhaId;
  final DateTime createdAt;
  final bool isSynced;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.phone,
    required this.village,
    this.dob,
    this.abhaId,
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
      'dob': dob ?? '',
      'abhaId': abhaId ?? '',
      'createdAt': createdAt.toIso8601String(),
      'isSynced': isSynced ? 1 : 0,
    };
  }

  factory Patient.fromMap(Map<String, dynamic> map) {
    String? abha = (map['abhaId'] != null && map['abhaId'] != '') ? map['abhaId'].toString() : null;
    if (abha == null && map['identifiers'] is List) {
      for (var idObj in (map['identifiers'] as List)) {
        if (idObj is Map && (idObj['type'] == 'ABHA' || idObj['type'] == 'ABHA_ID')) {
          abha = idObj['value']?.toString();
          break;
        }
      }
    }

    final rawGender = map['gender']?.toString() ?? 'Other';
    final normalizedGender = (rawGender.toUpperCase() == 'MALE')
        ? 'Male'
        : (rawGender.toUpperCase() == 'FEMALE' ? 'Female' : 'Other');

    return Patient(
      id: map['id']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      age: map['age'] is int ? map['age'] : int.tryParse(map['age']?.toString() ?? '') ?? 0,
      gender: normalizedGender,
      phone: map['phone']?.toString() ?? '',
      village: map['village']?.toString() ?? '',
      dob: (map['dob'] != null && map['dob'] != '') ? map['dob'].toString() : null,
      abhaId: abha,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isSynced: map['isSynced'] == 1 || map['isSynced'] == true || !map.containsKey('isSynced'),
    );
  }

  Patient copyWith({
    String? id,
    String? name,
    int? age,
    String? gender,
    String? phone,
    String? village,
    String? dob,
    String? abhaId,
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
      dob: dob ?? this.dob,
      abhaId: abhaId ?? this.abhaId,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
    );
  }
}
