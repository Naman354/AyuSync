import 'package:flutter_test/flutter_test.dart';
import 'package:ayusync_app/core/models/assessment_model.dart';
import 'package:ayusync_app/core/state/app_state.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Instant Local-First Patient Registration & Assessment Tests', () {
    test('registerPatient creates local patient immediately and updates in-memory state', () async {
      final appState = AppState(monitorNetwork: false);

      final patient = await appState.registerPatient(
        name: 'Asha Rani',
        age: 32,
        gender: 'Female',
        phone: '+919876543210',
        village: 'Khandala Ward 1',
      );

      expect(patient.id.startsWith('PAT-'), isTrue);
      expect(patient.name, equals('Asha Rani'));
      expect(patient.age, equals(32));
      expect(patient.gender, equals('Female'));
      expect(patient.phone, equals('+919876543210'));
      expect(patient.village, equals('Khandala Ward 1'));
      expect(patient.isSynced, isFalse); // Initially queued for sync

      expect(appState.currentPatient?.id, equals(patient.id));
      expect(appState.patients.any((p) => p.id == patient.id), isTrue);
      expect(appState.syncQueue.any((item) => item.entityType == 'PATIENT'), isTrue);
    });

    test('createAssessment computes local XAI triage immediately with zero blocking delay', () async {
      final appState = AppState(monitorNetwork: false);

      final patient = await appState.registerPatient(
        name: 'Sunita Patil',
        age: 40,
        gender: 'Female',
        phone: '+919876543211',
        village: 'Khandala Ward 2',
      );

      final vitals = Vitals(
        temperature: 102.5,
        systolicBp: 170,
        diastolicBp: 95,
        pulseRate: 115,
        spo2: 91,
      );

      final assessment = await appState.createAssessment(
        patientId: patient.id,
        primarySymptom: 'Severe Breathlessness & Chest Pain',
        severity: 'SEVERE',
        durationDays: 2,
        vitals: vitals,
      );

      expect(assessment.id.startsWith('ASM-'), isTrue);
      expect(assessment.patientId, equals(patient.id));
      expect(assessment.primarySymptom, equals('Severe Breathlessness & Chest Pain'));

      // Verify instant local XAI triage result computation
      final triage = appState.currentTriageResult;
      expect(triage, isNotNull);
      expect(triage!.urgencyLevel, equals('URGENT'));
      expect(triage.urgencyScore, greaterThanOrEqualTo(70));
      expect(triage.contributingFactors.isNotEmpty, isTrue);
      expect(triage.recommendedAction.isNotEmpty, isTrue);
    });
  });
}
