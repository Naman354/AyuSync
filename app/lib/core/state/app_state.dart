import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/patient_model.dart';
import '../models/assessment_model.dart';
import '../models/triage_model.dart';
import '../models/facility_model.dart';
import '../models/followup_model.dart';
import '../models/sync_item_model.dart';
import '../network/api_service.dart';
import '../network/local_db.dart';
import '../sync/sync_engine.dart';

class AppState extends ChangeNotifier {
  final _uuid = const Uuid();

  // Network Connectivity State (Can be toggled in UI for offline demo)
  bool _isOnline = true;
  bool get isOnline => _isOnline;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  // Logged in worker info
  String _workerName = 'Sunita Patil';
  String _workerId = 'ASHA-PUNE-102';
  String _workerPhone = '+919998887776';
  String _workerCenter = 'Khandala Primary Health Sub-Centre';
  bool _isLoggedIn = false;

  String get workerName => _workerName;
  String get workerId => _workerId;
  String get workerPhone => _workerPhone;
  String get workerCenter => _workerCenter;
  bool get isLoggedIn => _isLoggedIn;

  // Local Patients List
  final List<Patient> _patients = [];
  List<Patient> get patients => List.unmodifiable(_patients);

  // Assessments History Map: patientId -> List<Assessment>
  final Map<String, List<Assessment>> _patientAssessments = {};

  // Follow-up Counter-Referral Tasks
  final List<FollowUpTask> _followUpTasks = [];
  List<FollowUpTask> get followUpTasks => List.unmodifiable(_followUpTasks);

  // Available Health Facilities for Smart Routing
  final List<Facility> _facilities = [];
  List<Facility> get facilities => List.unmodifiable(_facilities);

  // Offline Sync Queue
  final List<SyncItem> _syncQueue = [];
  List<SyncItem> get syncQueue => List.unmodifiable(_syncQueue);

  // Active Flow Working Variables
  Patient? _currentPatient;
  Assessment? _currentAssessment;
  TriageResult? _currentTriageResult;
  Facility? _selectedFacility;
  ReferralCase? _lastSubmittedCase;

  Patient? get currentPatient => _currentPatient;
  Assessment? get currentAssessment => _currentAssessment;
  TriageResult? get currentTriageResult => _currentTriageResult;
  Facility? get selectedFacility => _selectedFacility;
  ReferralCase? get lastSubmittedCase => _lastSubmittedCase;

  AppState() {
    _initDefaults();
    _loadFromLocalDb();
  }

  void _initDefaults() {
    _facilities.addAll([
      Facility(
        id: 'fac-khandala-phc',
        name: 'Khandala Primary Health Centre',
        type: 'Primary Health Centre (PHC)',
        distanceKm: 2.1,
        readinessScore: 78,
        hasSpecialist: false,
        hasEmergency: true,
        availableBeds: 10,
        waitingMinutes: 15,
        availableServices: ['Outpatient Clinical Consultation', 'Basic Pathology Testing', 'Universal Immunization Drive', 'Maternal Antenatal Checkup'],
        freshness: 'Live Telemetry',
      ),
      Facility(
        id: 'fac-baramati-chc',
        name: 'Baramati Community Health Centre',
        type: 'Community Health Centre (CHC)',
        distanceKm: 14.5,
        readinessScore: 92,
        hasSpecialist: true,
        hasEmergency: true,
        availableBeds: 60,
        waitingMinutes: 25,
        availableServices: ['Internal Medicine', 'Obstetrics & Gynecology', 'Digital X-Ray & Diagnostics', 'Blood Storage Center', '24x7 Emergency'],
        freshness: 'Live Telemetry',
      ),
      Facility(
        id: 'fac-pune-dist',
        name: 'Aundh District Hospital, Pune',
        type: 'District Hospital',
        distanceKm: 38.0,
        readinessScore: 95,
        hasSpecialist: true,
        hasEmergency: true,
        availableBeds: 250,
        waitingMinutes: 45,
        availableServices: ['Advanced ICU / HDU', 'Cardiology Telemetry', 'CT Scan & Advanced Radiology', 'Blood Component Center', 'NICU / PICU'],
        freshness: 'Live Telemetry',
      ),
    ]);

    _followUpTasks.addAll([
      FollowUpTask(
        id: 'TASK-501',
        patientId: 'pat-ramesh-kulkarni',
        patientName: 'Ramesh Kulkarni',
        patientPhone: '+91 91112 22333',
        doctorName: 'Dr. Rajesh Deshmukh (MD Internal Med)',
        doctorFacility: 'Baramati CHC',
        taskDescription: 'Post-hypertension blood pressure monitoring & Amlodipine compliance check',
        instructions: 'Record BP sitting and standing. Ensure patient takes Amlodipine 5mg once daily at morning.',
        prescribedMedicines: ['Tab. Amlodipine 5mg (1-0-0)', 'Tab. Paracetamol 500mg SOS'],
        dueDate: DateTime.now().add(const Duration(days: 1)),
        status: 'PENDING',
      ),
      FollowUpTask(
        id: 'TASK-502',
        patientId: 'pat-sunita-chavan',
        patientName: 'Sunita Chavan',
        patientPhone: '+91 90000 00019',
        doctorName: 'Dr. Priya Kulkarni (OBGYN)',
        doctorFacility: 'Aundh District Hospital',
        taskDescription: 'Post-natal checkup (Day 14) & Infant weight check',
        instructions: 'Check maternal hemoglobin levels, temperature, and verify exclusive breastfeeding.',
        prescribedMedicines: ['Tab. IFA (Iron Folic Acid) 1 daily', 'Tab. Calcium 500mg'],
        dueDate: DateTime.now().subtract(const Duration(days: 1)),
        status: 'OVERDUE',
      ),
    ]);
  }

  Future<void> _loadFromLocalDb() async {
    try {
      final dbPatients = await LocalDatabase.instance.getPatients();
      if (dbPatients.isNotEmpty) {
        _patients.clear();
        for (var map in dbPatients) {
          _patients.add(Patient.fromMap(map));
        }
      }

      // Rehydrate _syncQueue from SQLite sync_queue table
      final pending = await LocalDatabase.instance.getPendingSyncMutations();
      _syncQueue.clear();
      final seenEntityIds = <String>{};

      for (var p in pending) {
        final entityId = p['entityId']?.toString() ?? '';
        final entity = p['entity']?.toString() ?? 'ITEM';
        final action = p['operation']?.toString() ?? 'MUTATION';
        seenEntityIds.add(entityId);

        String description = '$entity [$action]';
        try {
          final payload = jsonDecode(p['payload'] as String);
          if (entity == 'PATIENT') {
            description = 'New Patient Registration: ${payload['name'] ?? entityId} (${payload['village'] ?? ''})';
          } else if (entity == 'ASSESSMENT') {
            description = 'Clinical Vitals & Assessment: $entityId';
          } else if (entity == 'REFERRAL') {
            description = 'Emergency Referral: $entityId';
          }
        } catch (_) {}

        _syncQueue.add(SyncItem(
          id: p['operationId']?.toString() ?? _uuid.v4(),
          entityType: entity,
          action: action,
          description: description,
          status: p['syncStatus']?.toString() ?? 'PENDING',
        ));
      }

      // Also ensure any un-synced patients in SQLite patients table are represented
      final unSynced = await LocalDatabase.instance.getUnSyncedPatients();
      for (var un in unSynced) {
        final pId = un['id']?.toString() ?? '';
        if (pId.isNotEmpty && !seenEntityIds.contains(pId)) {
          seenEntityIds.add(pId);
          _syncQueue.add(SyncItem(
            id: _uuid.v4(),
            entityType: 'PATIENT',
            action: 'CREATE',
            description: 'New Patient Registration: ${un['name']} (${un['village']})',
            status: 'PENDING',
          ));
        }
      }

      notifyListeners();

      // Ensure API authentication is ready in background
      ApiService.instance.ensureAuthenticated();
    } catch (e) {
      debugPrint('Error loading from local db: $e');
    }
  }

  void toggleOnlineStatus() {
    _isOnline = !_isOnline;
    if (_isOnline) {
      fetchBackendData();
    }
    notifyListeners();
  }

  // --- Authentication ---
  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (_isOnline) {
        final res = await ApiService.instance.login(
          identifier: identifier,
          password: password,
        );

        if (res.containsKey('user')) {
          final user = res['user'];
          _workerName = user['name'] ?? _workerName;
          _workerPhone = user['phone'] ?? identifier;
          _workerId = user['id'] ?? _workerId;
          _workerCenter = user['facilityName'] ?? user['center'] ?? _workerCenter;
        }
      } else {
        _workerPhone = identifier;
        _workerName = 'Sunita Patil (Offline)';
      }

      _isLoggedIn = true;
      _isLoading = false;
      notifyListeners();

      // Fetch live data upon successful login
      if (_isOnline) {
        await fetchBackendData();
      }

      return true;
    } catch (e) {
      // Fallback for offline or demo access
      if (!_isOnline || e.toString().contains('Failed host lookup') || e.toString().contains('SocketException')) {
        _isLoggedIn = true;
        _isLoading = false;
        _workerPhone = identifier;
        notifyListeners();
        return true;
      }
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void logout() {
    _isLoggedIn = false;
    ApiService.instance.setAuthToken(null);
    notifyListeners();
  }

  // --- Live Data Refresh ---
  Future<void> fetchBackendData() async {
    if (!_isOnline) return;

    try {
      // 1. Fetch Patients from Backend
      final patientsJson = await ApiService.instance.searchPatients();
      if (patientsJson.isNotEmpty) {
        final livePatients = <Patient>[];
        for (var p in patientsJson) {
          final patient = Patient(
            id: p['id']?.toString() ?? '',
            name: p['name']?.toString() ?? 'Unnamed',
            age: p['age'] is int ? p['age'] : (int.tryParse(p['age']?.toString() ?? '') ?? 30),
            gender: _normalizeGender(p['gender']?.toString() ?? 'OTHER'),
            phone: p['phone']?.toString() ?? '',
            village: p['village']?.toString() ?? '',
            dob: p['dob']?.toString(),
            createdAt: p['createdAt'] != null ? DateTime.tryParse(p['createdAt']) ?? DateTime.now() : DateTime.now(),
            isSynced: true,
          );
          livePatients.add(patient);
          // Cache locally
          await LocalDatabase.instance.insertPatient(patient.toMap());
        }
        _patients.clear();
        _patients.addAll(livePatients);
      }

      // 2. Fetch Facilities from Backend
      final facilitiesJson = await ApiService.instance.getFacilities();
      if (facilitiesJson.isNotEmpty) {
        final liveFacilities = <Facility>[];
        for (var f in facilitiesJson) {
          final services = <String>[];
          if (f['services'] is List) {
            for (var s in f['services']) {
              if (s['service'] != null) services.add(s['service'].toString());
            }
          }

          int availableBeds = 0;
          if (f['capacities'] is List) {
            for (var c in f['capacities']) {
              final total = c['total'] is int ? c['total'] as int : int.tryParse(c['total']?.toString() ?? '0') ?? 0;
              final occupied = c['occupied'] is int ? c['occupied'] as int : int.tryParse(c['occupied']?.toString() ?? '0') ?? 0;
              final diff = total - occupied;
              availableBeds += (diff < 0 ? 0 : (diff > 999 ? 999 : diff));
            }
          }

          final availability = f['availability'] ?? {};
          final readinessScore = availability['readinessScore'] is num
              ? (availability['readinessScore'] as num).toInt()
              : (int.tryParse(availability['readinessScore']?.toString() ?? '80') ?? 80);

          final hasSpecialist = (f['doctors'] is List && (f['doctors'] as List).isNotEmpty);
          final hasEmergency = services.any((s) => s.toLowerCase().contains('emergency') || s.toLowerCase().contains('icu') || s.toLowerCase().contains('trauma'));

          final levelVal = f['level'] is num ? (f['level'] as num).toDouble() : (double.tryParse(f['level']?.toString() ?? '1.0') ?? 1.0);

          liveFacilities.add(Facility(
            id: f['id']?.toString() ?? '',
            name: f['name']?.toString() ?? 'Health Facility',
            type: f['type']?.toString() ?? 'PHC',
            distanceKm: levelVal * 12.5,
            readinessScore: readinessScore,
            hasSpecialist: hasSpecialist,
            hasEmergency: hasEmergency,
            availableBeds: availableBeds > 0 ? availableBeds : 12,
            waitingMinutes: (100 - readinessScore) < 10 ? 10 : ((100 - readinessScore) > 60 ? 60 : (100 - readinessScore)),
            availableServices: services.isNotEmpty ? services : ['General OPD', 'Basic Diagnostics'],
            freshness: 'Updated just now',
          ));
        }

        if (liveFacilities.isNotEmpty) {
          _facilities.clear();
          _facilities.addAll(liveFacilities);
        }
      }

      // 3. Fetch Follow-ups from Backend
      try {
        final followUpsJson = await ApiService.instance.getFollowUps();
        if (followUpsJson.isNotEmpty) {
          final liveTasks = <FollowUpTask>[];
          for (var fu in followUpsJson) {
            final patientData = fu['patient'] ?? {};
            final patientName = patientData['name']?.toString() ?? 'Citizen';
            final patientId = fu['patientId']?.toString() ?? '';
            final reason = fu['reason']?.toString() ?? 'Post-Consultation Review';
            final notes = fu['notes']?.toString() ?? 'Monitor vitals and medication adherence';
            final status = fu['status']?.toString() ?? 'PENDING';
            final dueDateStr = fu['dueDate']?.toString();
            final dueDate = dueDateStr != null ? DateTime.tryParse(dueDateStr) ?? DateTime.now() : DateTime.now();

            liveTasks.add(FollowUpTask(
              id: fu['id']?.toString() ?? 'TASK-${liveTasks.length + 1}',
              patientId: patientId,
              patientName: patientName,
              patientPhone: '+91 91112 22333',
              doctorName: 'Medical Officer',
              doctorFacility: 'Baramati CHC',
              taskDescription: reason,
              instructions: notes,
              prescribedMedicines: ['Tab. Amlodipine 5mg', 'Tab. Paracetamol 500mg'],
              dueDate: dueDate,
              status: status,
              visitNotes: notes,
            ));
          }

          if (liveTasks.isNotEmpty) {
            _followUpTasks.clear();
            _followUpTasks.addAll(liveTasks);
          }
        }
      } catch (err) {
        debugPrint('Error fetching follow-ups: $err');
      }

      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching backend data: $e');
    }
  }

  String _normalizeGender(String raw) {
    final upper = raw.toUpperCase();
    if (upper == 'FEMALE' || upper == 'F') return 'Female';
    if (upper == 'MALE' || upper == 'M') return 'Male';
    return 'Other';
  }

  void setCurrentPatient(Patient patient) {
    _currentPatient = patient;
    notifyListeners();
  }

  // --- Patient Registration ---
  Future<Patient> registerPatient({
    required String name,
    required int age,
    required String gender,
    required String phone,
    required String village,
    String? dob,
    String? abhaId,
  }) async {
    final tempId = 'PAT-${_uuid.v4().substring(0, 8)}';
    final cleanAbha = (abhaId != null && abhaId.trim().isNotEmpty) ? abhaId.trim() : null;

    Patient newPatient = Patient(
      id: tempId,
      name: name.trim(),
      age: age,
      gender: gender,
      phone: phone.trim(),
      village: village.trim(),
      dob: dob?.trim(),
      abhaId: cleanAbha,
      createdAt: DateTime.now(),
      isSynced: false,
    );

    bool directUploadSuccess = false;
    if (_isOnline) {
      try {
        final created = await ApiService.instance.createPatient(
          name: newPatient.name,
          age: newPatient.age,
          gender: newPatient.gender,
          phone: newPatient.phone,
          village: newPatient.village,
          dob: newPatient.dob,
          abhaId: newPatient.abhaId,
        );

        if (created.containsKey('id') && created['id'] != null) {
          final serverId = created['id'].toString();
          newPatient = newPatient.copyWith(
            id: serverId,
            isSynced: true,
          );
          directUploadSuccess = true;
        }
      } catch (e) {
        debugPrint('Direct backend create patient failed, will queue mutation: $e');
      }
    }

    if (!directUploadSuccess) {
      _queuePatientMutation(newPatient);
    }

    await LocalDatabase.instance.insertPatient(newPatient.toMap());
    _patients.insert(0, newPatient);
    _currentPatient = newPatient;
    notifyListeners();
    return newPatient;
  }

  void _queuePatientMutation(Patient patient) {
    _syncQueue.add(SyncItem(
      id: _uuid.v4(),
      entityType: 'PATIENT',
      action: 'CREATE',
      description: 'New Patient Registration: ${patient.name} (${patient.village})',
    ));

    SyncEngine().queueMutation(
      operationId: _uuid.v4(),
      entityId: patient.id,
      entity: 'PATIENT',
      action: 'CREATE',
      payload: {
        'id': patient.id,
        'name': patient.name,
        'age': patient.age,
        'gender': patient.gender.toUpperCase(),
        'phone': patient.phone,
        'village': patient.village,
        if (patient.dob != null && patient.dob!.isNotEmpty) 'dob': patient.dob,
        if (patient.abhaId != null && patient.abhaId!.isNotEmpty) 'abhaId': patient.abhaId,
      },
    );
  }

  // --- Assessment & AI Triage Creation ---
  Future<Assessment> createAssessment({
    required String patientId,
    required String primarySymptom,
    required String severity,
    required int durationDays,
    required Vitals vitals,
    String? clinicalNotes,
  }) async {
    final asmId = 'ASM-${_uuid.v4().substring(0, 8)}';
    Assessment assessment = Assessment(
      id: asmId,
      patientId: patientId,
      primarySymptom: primarySymptom,
      severity: severity,
      durationDays: durationDays,
      vitals: vitals,
      clinicalNotes: clinicalNotes,
      timestamp: DateTime.now(),
      isSynced: false,
    );

    // Compute local triage prediction first
    TriageResult triageResult = _computeLocalTriage(assessment);

    if (_isOnline) {
      try {
        final symptomsPayload = [
          {
            'name': primarySymptom,
            'duration': '$durationDays days',
            'severity': severity.toUpperCase(),
          }
        ];

        final vitalsPayload = <Map<String, dynamic>>[];
        if (vitals.systolicBp != null) {
          vitalsPayload.add({
            'type': 'BP',
            'value': '${vitals.systolicBp}/${vitals.diastolicBp ?? 80}',
            'unit': 'mmHg',
          });
        }
        if (vitals.pulseRate != null) {
          vitalsPayload.add({
            'type': 'HR',
            'value': '${vitals.pulseRate}',
            'unit': 'bpm',
          });
        }
        if (vitals.temperature != null) {
          vitalsPayload.add({
            'type': 'TEMP',
            'value': '${vitals.temperature}',
            'unit': '°F',
          });
        }
        if (vitals.spo2 != null) {
          vitalsPayload.add({
            'type': 'SPO2',
            'value': '${vitals.spo2}',
            'unit': '%',
          });
        }
        if (vitals.respiratoryRate != null) {
          vitalsPayload.add({
            'type': 'RR',
            'value': '${vitals.respiratoryRate}',
            'unit': 'breaths/min',
          });
        }
        if (vitals.weight != null) {
          vitalsPayload.add({
            'type': 'WEIGHT',
            'value': '${vitals.weight}',
            'unit': 'kg',
          });
        }

        String? encounterId;
        try {
          final enc = await ApiService.instance.createEncounter(patientId: patientId);
          encounterId = enc['id']?.toString();
        } catch (e) {
          debugPrint('Encounter create: $e');
        }

        final res = await ApiService.instance.createAssessment(
          patientId: patientId,
          encounterId: encounterId,
          symptoms: symptomsPayload,
          vitals: vitalsPayload,
        );

        if (res.containsKey('id')) {
          assessment = Assessment(
            id: res['id'].toString(),
            patientId: patientId,
            primarySymptom: primarySymptom,
            severity: severity,
            durationDays: durationDays,
            vitals: vitals,
            clinicalNotes: clinicalNotes,
            timestamp: DateTime.now(),
            isSynced: true,
          );
        }

        // Parse AI Recommendations if returned from backend
        if (res['aiRecommendations'] is List && (res['aiRecommendations'] as List).isNotEmpty) {
          final ai = res['aiRecommendations'][0];
          final urgency = ai['urgencyCategory']?.toString() ?? triageResult.urgencyLevel;
          final factors = <String>[];
          if (ai['reasons'] is List) {
            for (var r in ai['reasons']) {
              factors.add(r.toString());
            }
          }
          final confidence = (ai['confidence'] as num?)?.toDouble() ?? 0.85;

          triageResult = TriageResult(
            assessmentId: assessment.id,
            urgencyLevel: urgency,
            urgencyScore: (confidence * 100).toInt().clamp(10, 99),
            contributingFactors: factors.isNotEmpty ? factors : triageResult.contributingFactors,
            recommendedAction: urgency == 'URGENT'
                ? 'Immediate expedited referral to 24x7 Emergency CHC/District Hospital.'
                : (urgency == 'PRIORITY'
                    ? 'Same-day consultation at Primary Health Centre (PHC). Continuous monitoring.'
                    : 'Standard outpatient routine care at Sub-Centre / PHC.'),
            explanationText: 'AI Triage classified as $urgency based on clinical vital thresholds.',
            confirmedUrgency: urgency,
          );
        }
      } catch (e) {
        debugPrint('Direct backend create assessment error, queuing mutation: $e');
        _queueAssessmentMutation(assessment);
      }
    } else {
      _queueAssessmentMutation(assessment);
    }

    if (!_patientAssessments.containsKey(patientId)) {
      _patientAssessments[patientId] = [];
    }
    _patientAssessments[patientId]!.insert(0, assessment);
    _currentAssessment = assessment;
    _currentTriageResult = triageResult;

    await LocalDatabase.instance.insertAssessment({
      'id': assessment.id,
      'patientId': assessment.patientId,
      'primarySymptom': assessment.primarySymptom,
      'severity': assessment.severity,
      'durationDays': assessment.durationDays,
      'vitals': jsonEncode(assessment.vitals.toMap()),
      'clinicalNotes': assessment.clinicalNotes ?? '',
      'timestamp': assessment.timestamp.toIso8601String(),
      'isSynced': assessment.isSynced ? 1 : 0,
    });

    notifyListeners();
    return assessment;
  }

  void _queueAssessmentMutation(Assessment assessment) {
    _syncQueue.add(SyncItem(
      id: _uuid.v4(),
      entityType: 'ASSESSMENT',
      action: 'CREATE',
      description: 'Vitals & Assessment: ${assessment.primarySymptom} (${assessment.severity})',
    ));

    SyncEngine().queueMutation(
      operationId: _uuid.v4(),
      entityId: assessment.id,
      entity: 'ASSESSMENT',
      action: 'CREATE',
      payload: {
        'id': assessment.id,
        'patientId': assessment.patientId,
        'provenance': 'WORKER_RECORDED',
        'symptoms': {
          'create': [
            {
              'name': assessment.primarySymptom,
              'duration': '${assessment.durationDays} days',
              'severity': assessment.severity.toUpperCase(),
            }
          ]
        },
      },
    );
  }

  TriageResult _computeLocalTriage(Assessment asm) {
    int score = 25;
    List<String> drivers = [];
    String urgency = 'ROUTINE';
    String action = 'Standard outpatient consultation at Sub-Centre / PHC.';
    String reason = 'Patient presents with mild or routine symptoms with normal baseline vitals.';

    if (asm.severity == 'SEVERE' || asm.severity == 'CRITICAL') {
      score += 40;
      drivers.add('High symptom severity declared (${asm.primarySymptom})');
    } else if (asm.severity == 'MODERATE') {
      score += 20;
      drivers.add('Moderate symptom progression over ${asm.durationDays} days');
    }

    if (asm.vitals.spo2 != null && asm.vitals.spo2! < 94) {
      score += 35;
      drivers.add('Hypoxia: Low Oxygen Saturation (SpO2 ${asm.vitals.spo2}%)');
    }

    if (asm.vitals.systolicBp != null && (asm.vitals.systolicBp! > 160 || asm.vitals.systolicBp! < 90)) {
      score += 25;
      drivers.add('Abnormal Blood Pressure (${asm.vitals.systolicBp}/${asm.vitals.diastolicBp ?? 0} mmHg)');
    }

    if (asm.vitals.temperature != null && asm.vitals.temperature! > 101.5) {
      score += 20;
      drivers.add('High grade pyrexia (${asm.vitals.temperature}°F)');
    }

    if (asm.vitals.pulseRate != null && (asm.vitals.pulseRate! > 110 || asm.vitals.pulseRate! < 50)) {
      score += 15;
      drivers.add('Tachycardia / Bradycardia (${asm.vitals.pulseRate} bpm)');
    }

    if (score >= 70) {
      urgency = 'URGENT';
      action = 'Immediate stabilization and expedited referral to 24x7 PHC / CHC Emergency.';
      reason = 'Critical risk factors detected: ${drivers.join(", ")}. Requires prompt medical evaluation.';
    } else if (score >= 45) {
      urgency = 'PRIORITY';
      action = 'Same-day consultation at Primary Health Centre (PHC). Continuous vitals monitoring.';
      reason = 'Elevated clinical risk due to: ${drivers.join(", ")}. Doctor consultation recommended.';
    }

    return TriageResult(
      assessmentId: asm.id,
      urgencyLevel: urgency,
      urgencyScore: score.clamp(0, 100),
      contributingFactors: drivers.isEmpty ? ['Standard vitals within acceptable ranges'] : drivers,
      recommendedAction: action,
      explanationText: reason,
      confirmedUrgency: urgency,
    );
  }

  void updateWorkerTriageConfirmation({required String confirmedUrgency, String? notes}) {
    if (_currentTriageResult != null) {
      _currentTriageResult = _currentTriageResult!.copyWith(
        confirmedUrgency: confirmedUrgency,
        workerNotes: notes,
      );
      notifyListeners();
    }
  }

  void selectFacility(Facility facility) {
    _selectedFacility = facility;
    notifyListeners();
  }

  ReferralCase submitReferralCase() {
    final patient = _currentPatient ?? (_patients.isNotEmpty ? _patients.first : Patient(id: 'PAT-1', name: 'Citizen', age: 30, gender: 'Female', phone: '+919876543210', village: 'Khandala'));
    final facility = _selectedFacility ?? (_facilities.isNotEmpty ? _facilities.first : Facility(id: 'fac-1', name: 'PHC Khandala', type: 'PHC', distanceKm: 2, readinessScore: 80, hasSpecialist: false, hasEmergency: true, availableBeds: 5, waitingMinutes: 15, availableServices: ['OPD'], freshness: 'Now'));
    final urgency = _currentTriageResult?.confirmedUrgency ?? _currentTriageResult?.urgencyLevel ?? 'PRIORITY';
    final complaint = _currentAssessment?.primarySymptom ?? 'General clinical consultation';

    final referral = ReferralCase(
      referralId: 'REF-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      patientId: patient.id,
      patientName: patient.name,
      triageUrgency: urgency,
      facility: facility,
      chiefComplaint: complaint,
    );

    _lastSubmittedCase = referral;

    if (_isOnline) {
      ApiService.instance.createReferral(
        patientId: patient.id,
        originId: 'fac-khandala-phc',
        destinationId: facility.id.startsWith('fac-') ? facility.id : 'fac-baramati-chc',
        reason: complaint,
        urgency: urgency,
      ).then((res) {
        debugPrint('Referral created on backend: ${res['id']}');
      }).catchError((e) {
        debugPrint('Backend referral submission fallback: $e');
        _queueReferralMutation(referral);
      });
    } else {
      _queueReferralMutation(referral);
    }

    notifyListeners();
    return referral;
  }

  void _queueReferralMutation(ReferralCase referral) {
    _syncQueue.add(SyncItem(
      id: _uuid.v4(),
      entityType: 'REFERRAL',
      action: 'CREATE',
      description: 'Referral to ${referral.facility.name} for ${referral.patientName} (Urgency: ${referral.triageUrgency})',
    ));
  }

  // --- Follow Up Completion ---
  void completeFollowUpTask({
    required String taskId,
    required String visitNotes,
    Vitals? recordedVitals,
  }) {
    final index = _followUpTasks.indexWhere((t) => t.id == taskId);
    if (index != -1) {
      final task = _followUpTasks[index];
      _followUpTasks[index] = task.copyWith(
        status: 'COMPLETED',
        visitNotes: visitNotes,
        completedAt: DateTime.now(),
      );

      if (!_isOnline) {
        _syncQueue.add(SyncItem(
          id: _uuid.v4(),
          entityType: 'FOLLOW_UP',
          action: 'UPDATE',
          description: 'Completed Visit for ${task.patientName}: $visitNotes',
        ));
      }

      notifyListeners();
    }
  }

  // --- Manual Sync Trigger ---
  Future<bool> syncAllQueueItems() async {
    for (int i = 0; i < _syncQueue.length; i++) {
      _syncQueue[i] = _syncQueue[i].copyWith(status: 'SYNCING');
    }
    notifyListeners();

    final success = await SyncEngine().syncNow(workerId: _workerId);

    for (int i = 0; i < _syncQueue.length; i++) {
      _syncQueue[i] = _syncQueue[i].copyWith(status: success ? 'SYNCED' : 'FAILED');
    }
    notifyListeners();

    if (success) {
      await Future.delayed(const Duration(milliseconds: 600));
      _syncQueue.clear();

      // Reload local SQLite database so in-memory patients have isSynced = true
      final dbPatients = await LocalDatabase.instance.getPatients();
      if (dbPatients.isNotEmpty) {
        _patients.clear();
        for (var map in dbPatients) {
          _patients.add(Patient.fromMap(map));
        }
      }

      await fetchBackendData();
    }
    notifyListeners();
    return success;
  }

  List<Patient> searchPatients(String query) {
    if (query.trim().isEmpty) return _patients;
    final q = query.toLowerCase();
    return _patients.where((p) {
      return p.name.toLowerCase().contains(q) ||
          p.phone.contains(q) ||
          p.village.toLowerCase().contains(q) ||
          (p.abhaId?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  List<Assessment> getAssessmentsForPatient(String patientId) {
    return _patientAssessments[patientId] ?? [];
  }
}
