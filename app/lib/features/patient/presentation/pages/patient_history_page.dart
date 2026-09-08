import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';

class PatientHistoryPage extends StatefulWidget {
  const PatientHistoryPage({super.key});

  @override
  State<PatientHistoryPage> createState() => _PatientHistoryPageState();
}

class _PatientHistoryPageState extends State<PatientHistoryPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = Provider.of<AppState>(context, listen: false);
      final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);
      if (patient != null) {
        appState.fetchPatientTimeline(patient.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    if (patient == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('16 Patient History')),
        body: const Center(child: Text('No patient selected')),
      );
    }

    final historyList = appState.getAssessmentsForPatient(patient.id);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Patient Visit History'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Header Patient Profile Summary
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.white,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.blue.shade100,
                  child: Text(
                    patient.name.isNotEmpty ? patient.name[0] : 'P',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(patient.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text('${patient.age} yrs • ${patient.gender} • Village: ${patient.village}'),
                      Text(
                        'ABHA: ${patient.abhaId ?? "Not Linked"}',
                        style: TextStyle(fontSize: 12, color: Colors.blue.shade700, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Row(
              children: [
                const Icon(Icons.history, size: 18, color: Color(0xFF1E293B)),
                const SizedBox(width: 6),
                const Text(
                  'Past Visits & Checkup Records',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                ),
                const Spacer(),
                Text('${historyList.length} Records', style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),

          // Encounter Timeline
          Expanded(
            child: historyList.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.assignment_late_outlined, size: 56, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text('No past checkup records for this patient.'),
                        const SizedBox(height: 4),
                        const Text('Start a new health checkup below.', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
                    itemCount: historyList.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final asm = historyList[index];
                      final dateStr = '${asm.timestamp.day}/${asm.timestamp.month}/${asm.timestamp.year}';

                      return Card(
                        elevation: 0,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: asm.severity == 'SEVERE'
                                          ? Colors.red.shade50
                                          : (asm.severity == 'MODERATE' ? Colors.orange.shade50 : Colors.green.shade50),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: asm.severity == 'SEVERE'
                                            ? Colors.red.shade300
                                            : (asm.severity == 'MODERATE' ? Colors.orange.shade300 : Colors.green.shade300),
                                      ),
                                    ),
                                    child: Text(
                                      'Severity: ${asm.severity}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: asm.severity == 'SEVERE'
                                            ? Colors.red.shade900
                                            : (asm.severity == 'MODERATE' ? Colors.orange.shade900 : Colors.green.shade900),
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(dateStr, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                asm.primarySymptom,
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              // Vitals Chips
                              Wrap(
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  if (asm.vitals.temperature != null)
                                    _vitalChip('Temp', '${asm.vitals.temperature}°F'),
                                  if (asm.vitals.spo2 != null)
                                    _vitalChip('SpO2', '${asm.vitals.spo2}%'),
                                  if (asm.vitals.systolicBp != null)
                                    _vitalChip('BP', '${asm.vitals.systolicBp}/${asm.vitals.diastolicBp ?? "-"}'),
                                  if (asm.vitals.pulseRate != null)
                                    _vitalChip('Pulse', '${asm.vitals.pulseRate} bpm'),
                                ],
                              ),
                              if (asm.clinicalNotes != null && asm.clinicalNotes!.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'Notes: ${asm.clinicalNotes}',
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontStyle: FontStyle.italic),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Bottom Action Bar to start 08 Symptoms + Vitals
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                // Navigate to 08 Symptoms + Vitals as per Figma flow
                Navigator.pushNamed(context, '/assessment/form');
              },
              icon: const Icon(Icons.add_chart),
              label: const Text(
                'Start New Health Checkup',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _vitalChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Text(
        '$label: $value',
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}
