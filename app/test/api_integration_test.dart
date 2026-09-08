import 'package:flutter_test/flutter_test.dart';
import 'package:ayusync_app/core/models/patient_model.dart';
import 'package:ayusync_app/core/models/assessment_model.dart';
import 'package:ayusync_app/core/models/facility_model.dart';
import 'package:ayusync_app/core/models/triage_model.dart';
import 'package:ayusync_app/core/models/followup_model.dart';
import 'package:ayusync_app/core/models/sync_item_model.dart';
import 'package:ayusync_app/core/network/api_config.dart';

void main() {
  group('Backend Model Parsing & Integration Tests', () {
    test('Patient model parses backend JSON with identifiers array', () {
      final backendJson = {
        'id': 'pat-uuid-123',
        'name': 'Ramesh Kumar',
        'age': 45,
        'gender': 'MALE',
        'phone': '+919876543210',
        'village': 'Rampur',
        'identifiers': [
          {'type': 'ABHA', 'value': '91-1234-5678-9012'}
        ],
        'createdAt': '2026-09-07T12:00:00.000Z',
      };

      final patient = Patient.fromMap(backendJson);
      expect(patient.id, equals('pat-uuid-123'));
      expect(patient.name, equals('Ramesh Kumar'));
      expect(patient.gender, equals('Male'));
      expect(patient.abhaId, equals('91-1234-5678-9012'));
      expect(patient.isSynced, isTrue);
    });

    test('Assessment and Vitals parse backend response and AI recommendation', () {
      final backendAssessment = {
        'id': 'asm-uuid-456',
        'patientId': 'pat-uuid-123',
        'provenance': 'WORKER_RECORDED',
        'symptoms': [
          {'name': 'High grade pyrexia', 'severity': 'SEVERE', 'duration': '3 days'}
        ],
        'encounter': {
          'vitals': [
            {'type': 'TEMP', 'value': '102.5', 'unit': 'F'},
            {'type': 'BP', 'value': '140', 'unit': 'mmHg'},
            {'type': 'SPO2', 'value': '92', 'unit': '%'}
          ]
        },
        'aiRecommendations': [
          {
            'urgencyCategory': 'URGENT',
            'reasons': ['Low SpO2 hypoxia', 'High fever'],
            'confidence': 0.91,
          }
        ]
      };

      final assessment = Assessment.fromMap(backendAssessment);
      expect(assessment.id, equals('asm-uuid-456'));
      expect(assessment.primarySymptom, equals('High grade pyrexia'));
      expect(assessment.severity, equals('SEVERE'));
      expect(assessment.vitals.temperature, equals(102.5));
      expect(assessment.vitals.spo2, equals(92));

      final triageResult = TriageResult.fromBackendRecommendation(
        assessment.rawAiRecommendation!,
        assessmentId: assessment.id,
      );
      expect(triageResult.urgencyLevel, equals('URGENT'));
      expect(triageResult.urgencyScore, greaterThanOrEqualTo(75));
      expect(triageResult.contributingFactors.length, equals(2));
    });

    test('Facility parses backend JSON with availability and services', () {
      final backendFacility = {
        'id': 'fac-uuid-789',
        'name': 'Bilaspur CHC',
        'type': 'CHC',
        'services': [
          {'service': 'Emergency 24x7', 'isAvailable': true},
          {'service': 'ICU', 'isAvailable': true}
        ],
        'capacities': [
          {'resource': 'ICU Beds', 'total': 20, 'occupied': 5}
        ],
        'availability': {
          'status': 'OPEN',
          'readinessScore': 94.0,
        },
        'doctors': [{'id': 'doc-1'}]
      };

      final facility = Facility.fromBackendMap(backendFacility);
      expect(facility.id, equals('fac-uuid-789'));
      expect(facility.name, equals('Bilaspur CHC'));
      expect(facility.hasSpecialist, isTrue);
      expect(facility.hasEmergency, isTrue);
      expect(facility.readinessScore, equals(94));
      expect(facility.availableBeds, equals(15));
    });

    test('FollowUpTask parses backend pull delta', () {
      final backendFollowup = {
        'id': 'fu-uuid-101',
        'patientId': 'pat-uuid-123',
        'workerId': 'worker-1',
        'dueDate': '2026-09-10T10:00:00.000Z',
        'reason': 'Hypertension follow-up visit',
        'status': 'PENDING',
      };

      final task = FollowUpTask.fromBackendFollowUp(backendFollowup);
      expect(task.id, equals('fu-uuid-101'));
      expect(task.taskDescription, equals('Hypertension follow-up visit'));
      expect(task.status, equals('PENDING'));
    });

    test('SyncItem produces valid mutation payload for POST /api/sync', () {
      final item = SyncItem(
        id: 'sync-op-001',
        entityType: 'PATIENT',
        action: 'CREATE',
        description: 'New Patient: Sunderlal',
        payload: {'name': 'Sunderlal', 'age': 50, 'gender': 'MALE'},
      );

      final mutation = item.toBackendMutation(deviceId: 'test-device');
      expect(mutation['operationId'], equals('sync-op-001'));
      expect(mutation['entity'], equals('PATIENT'));
      expect(mutation['action'], equals('CREATE'));
      expect(mutation['deviceId'], equals('test-device'));
    });

    test('ApiConfig allows runtime baseUrl override', () {
      ApiConfig.setBaseUrl('http://192.168.1.100:5000');
      expect(ApiConfig.baseUrl, equals('http://192.168.1.100:5000'));
    });
  });
}
