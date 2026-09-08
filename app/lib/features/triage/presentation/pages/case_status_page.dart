import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';

class CaseStatusPage extends StatelessWidget {
  const CaseStatusPage({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final referral = appState.lastSubmittedCase;
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Case Confirmation Slip', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Slip Card
            Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('AYUSYNC DIGITAL REFERRAL SLIP', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF6B7280))),
                              const SizedBox(height: 2),
                              Text(
                                referral?.referralId ?? 'REF-889412',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.forest),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: const Icon(Icons.qr_code_2, size: 36, color: Color(0xFF1E293B)),
                        ),
                      ],
                    ),
                    const Divider(height: 24, color: Color(0xFFF3F4F6)),

                    _statusRow('Citizen Name', referral?.patientName ?? patient?.name ?? 'Kamala Devi'),
                    const SizedBox(height: 8),
                    _statusRow('Village / Ward', patient?.village ?? 'Rampur Ward 3'),
                    const SizedBox(height: 8),
                    _statusRow('ABHA ID', patient?.abhaId ?? '91-4920-1123-9901'),
                    const SizedBox(height: 8),
                    _statusRow('Chief Complaint', referral?.chiefComplaint ?? 'Severe pyrexia with breathlessness'),
                    const SizedBox(height: 8),
                    _statusRow('Assigned Facility', referral?.facility.name ?? 'Bilaspur PHC'),
                    const SizedBox(height: 8),
                    _statusRow('Triage Urgency', referral?.triageUrgency ?? 'URGENT', isUrgent: true),

                    if (referral?.needsAmbulance == true) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.airport_shuttle_rounded, color: Color(0xFFDC2626), size: 20),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '108 Emergency Ambulance Dispatched to Patient Coordinates',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Closed-loop Orchestration Live Status
            Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.sync_alt, size: 18, color: Color(0xFF2563EB)),
                        SizedBox(width: 8),
                        Text(
                          'Closed-Loop Continuity Status',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    _stepTimeline(
                      title: '1. Upstream Referral Transmitted',
                      subtitle: 'Transmitted from ${appState.workerCenter}',
                      isDone: true,
                    ),
                    _stepTimeline(
                      title: '2. Broadcasted to Doctor Live Queue',
                      subtitle: 'Active on Doctor Dashboard (Socket.io Realtime)',
                      isDone: true,
                    ),
                    _stepTimeline(
                      title: '3. Facility Consultation & Treatment',
                      subtitle: 'Patient en-route to ${referral?.facility.type ?? "Facility"}',
                      isDone: false,
                      isCurrent: true,
                    ),
                    _stepTimeline(
                      title: '4. Downstream Counter-Referral',
                      subtitle: 'Prescription & Follow-up tasks will route to 06 Follow-up Inbox',
                      isDone: false,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Return Actions
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: () {
                Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
              },
              icon: const Icon(Icons.home_rounded),
              label: const Text(
                'Return to Home Dashboard',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 10),

            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              onPressed: () {
                Navigator.pushNamed(context, '/followup/inbox');
              },
              icon: const Icon(Icons.inbox_rounded, color: Color(0xFF4B5563)),
              label: const Text('Go to Care Gaps Follow-up Inbox', style: TextStyle(color: Color(0xFF4B5563))),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusRow(String label, String value, {bool isUrgent = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Flexible(
          fit: FlexFit.loose,
          child: Text(
            label,
            style: const TextStyle(fontSize: 13, color: Colors.grey),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isUrgent ? Colors.red : const Color(0xFF1E293B),
            ),
          ),
        ),
      ],
    );
  }

  Widget _stepTimeline({
    required String title,
    required String subtitle,
    required bool isDone,
    bool isCurrent = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isDone ? Icons.check_circle : (isCurrent ? Icons.radio_button_checked : Icons.radio_button_unchecked),
            size: 18,
            color: isDone ? Colors.green : (isCurrent ? const Color(0xFF2563EB) : Colors.grey),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.w600,
                    color: isCurrent ? const Color(0xFF2563EB) : Colors.black87,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
