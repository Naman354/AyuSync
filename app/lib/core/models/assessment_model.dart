class Vitals {
  final double? temperature;
  final int? systolicBp;
  final int? diastolicBp;
  final int? pulseRate;
  final int? spo2;
  final double? bloodGlucose;
  final int? respiratoryRate;
  final double? weight;

  Vitals({
    this.temperature,
    this.systolicBp,
    this.diastolicBp,
    this.pulseRate,
    this.spo2,
    this.bloodGlucose,
    this.respiratoryRate,
    this.weight,
  });

  Map<String, dynamic> toMap() {
    return {
      'temperature': temperature,
      'systolicBp': systolicBp,
      'diastolicBp': diastolicBp,
      'pulseRate': pulseRate,
      'spo2': spo2,
      'bloodGlucose': bloodGlucose,
      'respiratoryRate': respiratoryRate,
      'weight': weight,
    };
  }

  /// Formats vitals as backend structured array: [{ type: "TEMP", value: 98.6, unit: "F" }, ...]
  List<Map<String, dynamic>> toBackendVitalsList() {
    final list = <Map<String, dynamic>>[];
    if (temperature != null) {
      list.add({'type': 'TEMP', 'value': temperature, 'unit': 'F'});
    }
    if (systolicBp != null) {
      list.add({'type': 'BP', 'value': systolicBp, 'unit': 'mmHg'});
    }
    if (pulseRate != null) {
      list.add({'type': 'HR', 'value': pulseRate, 'unit': 'bpm'});
    }
    if (spo2 != null) {
      list.add({'type': 'SPO2', 'value': spo2, 'unit': '%'});
    }
    if (bloodGlucose != null) {
      list.add({'type': 'GLUCOSE', 'value': bloodGlucose, 'unit': 'mg/dL'});
    }
    return list;
  }

  factory Vitals.fromMap(Map<String, dynamic> map) {
    return Vitals(
      temperature: (map['temperature'] as num?)?.toDouble(),
      systolicBp: (map['systolicBp'] as num?)?.toInt(),
      diastolicBp: (map['diastolicBp'] as num?)?.toInt(),
      pulseRate: (map['pulseRate'] as num?)?.toInt(),
      spo2: (map['spo2'] as num?)?.toInt(),
      bloodGlucose: (map['bloodGlucose'] as num?)?.toDouble(),
      respiratoryRate: (map['respiratoryRate'] as num?)?.toInt(),
      weight: (map['weight'] as num?)?.toDouble(),
    );
  }

  factory Vitals.fromBackendList(List<dynamic> list) {
    double? temp;
    int? sBp;
    int? dBp;
    int? hr;
    int? o2;
    double? gluc;

    for (var v in list) {
      if (v is Map) {
        final type = v['type']?.toString().toUpperCase();
        final rawVal = v['value'];
        final val = rawVal is num ? rawVal.toDouble() : double.tryParse(rawVal?.toString() ?? '');
        if (val == null) continue;

        if (type == 'TEMP' || type == 'TEMPERATURE') {
          temp = val;
        } else if (type == 'BP' || type == 'SYSTOLIC_BP') {
          sBp = val.toInt();
        } else if (type == 'DIASTOLIC_BP') {
          dBp = val.toInt();
        } else if (type == 'HR' || type == 'PULSE' || type == 'PULSERATE') {
          hr = val.toInt();
        } else if (type == 'SPO2') {
          o2 = val.toInt();
        } else if (type == 'GLUCOSE') {
          gluc = val;
        }
      }
    }

    return Vitals(
      temperature: temp,
      systolicBp: sBp,
      diastolicBp: dBp,
      pulseRate: hr,
      spo2: o2,
      bloodGlucose: gluc,
    );
  }
}

class Assessment {
  final String id;
  final String patientId;
  final String primarySymptom;
  final String severity; // LOW, MODERATE, CRITICAL / SEVERE
  final int durationDays;
  final Vitals vitals;
  final String? primaryHealthConcern;
  final String? relevantObservations;
  final String? clinicalNotes;
  final DateTime timestamp;
  final bool isSynced;
  final Map<String, dynamic>? rawAiRecommendation;

  Assessment({
    required this.id,
    required this.patientId,
    required this.primarySymptom,
    required this.severity,
    required this.durationDays,
    required this.vitals,
    this.primaryHealthConcern,
    this.relevantObservations,
    this.clinicalNotes,
    DateTime? timestamp,
    this.isSynced = true,
    this.rawAiRecommendation,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'patientId': patientId,
      'primarySymptom': primarySymptom,
      'severity': severity,
      'durationDays': durationDays,
      'vitals': vitals.toMap(),
      'primaryHealthConcern': primaryHealthConcern ?? '',
      'relevantObservations': relevantObservations ?? '',
      'clinicalNotes': clinicalNotes ?? '',
      'timestamp': timestamp.toIso8601String(),
      'isSynced': isSynced ? 1 : 0,
    };
  }

  factory Assessment.fromMap(Map<String, dynamic> map) {
    // If backend symptoms array exists
    String symptomText = map['primarySymptom']?.toString() ?? '';
    String sev = map['severity']?.toString() ?? 'LOW';
    int duration = (map['durationDays'] as num?)?.toInt() ?? 1;

    if (symptomText.isEmpty && map['symptoms'] is List && (map['symptoms'] as List).isNotEmpty) {
      final sList = map['symptoms'] as List;
      final firstSym = sList.first;
      if (firstSym is Map) {
        symptomText = firstSym['name']?.toString() ?? '';
        sev = firstSym['severity']?.toString() ?? 'MODERATE';
        final durStr = firstSym['duration']?.toString() ?? '1';
        duration = int.tryParse(durStr.split(' ').first) ?? 1;
      }
    }

    Vitals v;
    if (map['vitals'] != null) {
      if (map['vitals'] is List) {
        v = Vitals.fromBackendList(map['vitals'] as List);
      } else if (map['vitals'] is Map) {
        v = Vitals.fromMap(Map<String, dynamic>.from(map['vitals']));
      } else {
        v = Vitals();
      }
    } else if (map['encounter'] is Map && map['encounter']['vitals'] is List) {
      v = Vitals.fromBackendList(map['encounter']['vitals'] as List);
    } else {
      v = Vitals();
    }

    Map<String, dynamic>? aiRec;
    if (map['aiRecommendations'] is List && (map['aiRecommendations'] as List).isNotEmpty) {
      aiRec = Map<String, dynamic>.from((map['aiRecommendations'] as List).first as Map);
    }

    return Assessment(
      id: map['id']?.toString() ?? '',
      patientId: map['patientId']?.toString() ?? '',
      primarySymptom: symptomText.isNotEmpty ? symptomText : 'General Health Assessment',
      severity: sev,
      durationDays: duration,
      vitals: v,
      primaryHealthConcern: map['primaryHealthConcern']?.toString(),
      relevantObservations: map['relevantObservations']?.toString(),
      clinicalNotes: map['clinicalNotes']?.toString(),
      timestamp: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : (map['timestamp'] != null
              ? DateTime.tryParse(map['timestamp'].toString()) ?? DateTime.now()
              : DateTime.now()),
      isSynced: map['isSynced'] == 1 || map['isSynced'] == true,
      rawAiRecommendation: aiRec,
    );
  }
}
