import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';

import '../../../../core/theme/app_colors.dart';

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

    Navigator.pushNamed(context, '/triage/facility_routing');
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final triage = appState.currentTriageResult;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(appState.translate('review_confirm_referral'), style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.forest, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.forest, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              appState.translate('worker_confirm_title'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textDark),
            ),
            const SizedBox(height: 6),
            Text(
              appState.translate('worker_confirm_subtitle'),
              style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 18),

            // AI Suggestion Reference
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.mintLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.forest.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome_rounded, color: AppColors.forest, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      appState.translate('ai_suggestion_banner', args: {
                        'level': appState.translate('urgency_${(triage?.urgencyLevel ?? "PRIORITY").toLowerCase()}'),
                        'score': '${triage?.urgencyScore ?? 50}',
                      }),
                      style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.textDark, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            Text(
              appState.translate('confirmed_urgency_title'),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textDark),
            ),
            const SizedBox(height: 10),

            // Urgency Selector Radio Tiles
            _urgencyOption(
              title: appState.translate('urgency_routine_title'),
              subtitle: appState.translate('urgency_routine_desc'),
              value: 'ROUTINE',
              color: AppColors.lowGreen,
            ),
            const SizedBox(height: 10),
            _urgencyOption(
              title: appState.translate('urgency_priority_title'),
              subtitle: appState.translate('urgency_priority_desc'),
              value: 'PRIORITY',
              color: AppColors.moderateOrange,
            ),
            const SizedBox(height: 10),
            _urgencyOption(
              title: appState.translate('urgency_urgent_title'),
              subtitle: appState.translate('urgency_urgent_desc'),
              value: 'URGENT',
              color: AppColors.criticalRed,
            ),
            const SizedBox(height: 20),

            // Worker Clinical Notes
            TextFormField(
              controller: _workerNotesController,
              maxLines: 3,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textDark),
              decoration: InputDecoration(
                labelText: appState.translate('worker_notes_label'),
                hintText: appState.translate('worker_notes_hint'),
                prefixIcon: const Icon(Icons.edit_note_rounded, color: AppColors.forest),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFB8C8BD))),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 28),

            // Action Button -> Smart Facility Routing
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: _handleConfirm,
              icon: const Icon(Icons.local_hospital_outlined),
              label: Text(
                appState.translate('confirm_choose_facility'),
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
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
              Icon(
                isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: color,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? color.shade900 : Colors.black87,
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

extension ColorShade on Color {
  Color get shade900 => this;
}
