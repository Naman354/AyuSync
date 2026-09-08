import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';

class WorkerConfirmationPage extends StatefulWidget {
  const WorkerConfirmationPage({super.key});

  @override
  State<WorkerConfirmationPage> createState() => _WorkerConfirmationPageState();
}

class _WorkerConfirmationPageState extends State<WorkerConfirmationPage> {
  late String _selectedUrgency;
  final _workerNotesController = TextEditingController(text: 'Reviewed vitals. Patient needs urgent doctor evaluation at PHC.');

  @override
  void initState() {
    super.initState();
    final appState = Provider.of<AppState>(context, listen: false);
    _selectedUrgency = appState.currentTriageResult?.confirmedUrgency ??
        appState.currentTriageResult?.urgencyLevel ??
        'PRIORITY';
  }

  void _handleConfirm() {
    final appState = Provider.of<AppState>(context, listen: false);
    appState.updateWorkerTriageConfirmation(
      confirmedUrgency: _selectedUrgency,
      notes: _workerNotesController.text.trim(),
    );

    // Proceed to 14 Smart Facility Routing as per Figma flow
    Navigator.pushNamed(context, '/triage/facility_routing');
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final triage = appState.currentTriageResult;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Confirm Urgency & Recommendation'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Health Worker Verification',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'As an ASHA worker, confirm or adjust the suggested urgency level based on your in-person checkup.',
              style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 20),

            // AI Suggestion Reference
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome, color: Color(0xFF2563EB), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'System Suggested Urgency: ${triage?.urgencyLevel ?? "PRIORITY"} (Score: ${triage?.urgencyScore ?? 50}/100)',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'Final Confirmed Urgency Level',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),

            // Urgency Selector Radio Tiles
            _urgencyOption(
              title: 'ROUTINE (Low Risk)',
              subtitle: 'Sub-Centre follow-up / general consultation',
              value: 'ROUTINE',
              color: Colors.green,
            ),
            const SizedBox(height: 8),
            _urgencyOption(
              title: 'PRIORITY (Moderate Risk)',
              subtitle: 'Same-day evaluation at Primary Health Centre (PHC)',
              value: 'PRIORITY',
              color: Colors.orange,
            ),
            const SizedBox(height: 8),
            _urgencyOption(
              title: 'URGENT (High / Critical Risk)',
              subtitle: 'Immediate referral to CHC / Emergency Specialist',
              value: 'URGENT',
              color: Colors.red,
            ),
            const SizedBox(height: 20),

            // Worker Clinical Notes
            TextFormField(
              controller: _workerNotesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Your Notes & Reason for Decision',
                hintText: 'Enter clinical observations or justification for override...',
                prefixIcon: Icon(Icons.edit_note),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 28),

            // Action Button -> 14 Smart Facility Routing
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _handleConfirm,
              icon: const Icon(Icons.local_hospital_outlined),
              label: const Flexible(
                child: Text(
                  'Confirm & Choose Health Center',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _urgencyOption({
    required String title,
    required String subtitle,
    required String value,
    required Color color,
  }) {
    final isSelected = _selectedUrgency == value;
    return Card(
      elevation: 0,
      color: isSelected ? color.withValues(alpha: 0.06) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: isSelected ? color : Colors.grey.shade300,
          width: isSelected ? 1.8 : 1.0,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => setState(() => _selectedUrgency = value),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
          child: Row(
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected ? color : Colors.grey.shade400,
                    width: 2,
                  ),
                ),
                child: isSelected
                    ? Center(
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: color,
                          ),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? color : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
