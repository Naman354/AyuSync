import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/subtle_background_scaffold.dart';

class PatientHistoryPage extends StatelessWidget {
  const PatientHistoryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    if (patient == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(appState.translate('patient_history_title'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.forest,
          elevation: 0,
        ),
        body: Center(child: Text(appState.translate('no_patient_selected'))),
      );
    }

    final historyList = appState.getAssessmentsForPatient(patient.id);
    final genderText = patient.gender.toLowerCase() == 'male'
        ? appState.translate('gender_male')
        : (patient.gender.toLowerCase() == 'female'
            ? appState.translate('gender_female')
            : appState.translate('gender_other'));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(appState.translate('patient_history_title'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
      ),
      body: SubtleHealthcareBackground(
        type: BackgroundIllustrationType.communityWatermark,
        opacity: 0.06,
        child: Column(
        children: [
          // Header Patient Profile Summary
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.white,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.mintLight,
                  child: Text(
                    patient.name.isNotEmpty ? patient.name[0] : 'P',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.forest),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(patient.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                      const SizedBox(height: 2),
                      Text(
                        appState.translate('patient_details_subtitle', args: {
                          'age': '${patient.age}',
                          'gender': genderText,
                          'village': patient.village,
                        }),
                        style: const TextStyle(color: Color(0xFF4B5563)),
                      ),
                      Text(
                        'ABHA: ${patient.abhaId ?? "Not Linked"}',
                        style: const TextStyle(fontSize: 12, color: AppColors.forest, fontWeight: FontWeight.w600),
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
                Expanded(
                  child: Text(
                    appState.translate('encounters_title'),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  appState.translate('records_count', args: {'count': '${historyList.length}'}),
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                ),
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
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            appState.translate('no_encounters_yet'),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          appState.translate('start_fresh_triage_sub'),
                          style: const TextStyle(color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
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
                                      appState.translate('severity_chip_label', args: {'severity': asm.severity}),
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

          // Bottom Action Bar to start Assessment
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
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
              onPressed: () {
                Navigator.pushNamed(context, '/assessment/form');
              },
              icon: const Icon(Icons.add_chart_rounded),
              label: Text(
                appState.translate('start_assessment_vitals'),
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
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
