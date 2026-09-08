import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/models/followup_model.dart';
import '../../../../core/models/assessment_model.dart';

class RecordFollowUpPage extends StatefulWidget {
  final FollowUpTask? task;

  const RecordFollowUpPage({super.key, this.task});

  @override
  State<RecordFollowUpPage> createState() => _RecordFollowUpPageState();
}

class _RecordFollowUpPageState extends State<RecordFollowUpPage> {
  final _formKey = GlobalKey<FormState>();
  bool _adherenceConfirmed = true;
  final _notesController = TextEditingController(text: 'Visited patient at home. Patient taking Amlodipine regularly. BP is under control. No headache or dizziness.');
  final _systolicController = TextEditingController(text: '124');
  final _diastolicController = TextEditingController(text: '80');
  final _pulseController = TextEditingController(text: '76');
  bool _isSubmitting = false;

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    final appState = Provider.of<AppState>(context, listen: false);
    final task = widget.task ?? (appState.followUpTasks.isNotEmpty ? appState.followUpTasks.first : null);

    if (task == null) {
      setState(() => _isSubmitting = false);
      return;
    }

    final recordedVitals = Vitals(
      systolicBp: int.tryParse(_systolicController.text.trim()),
      diastolicBp: int.tryParse(_diastolicController.text.trim()),
      pulseRate: int.tryParse(_pulseController.text.trim()),
    );

    appState.completeFollowUpTask(
      taskId: task.id,
      visitNotes: _notesController.text.trim(),
      recordedVitals: recordedVitals,
    );

    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          appState.isOnline
              ? '✅ Follow-up visit synced to Doctor Web Dashboard!'
              : '💾 Follow-up visit recorded offline and queued in SQLite.',
        ),
        backgroundColor: Colors.green,
      ),
    );

    // Return to Follow-up Inbox or Dashboard
    Navigator.pushNamedAndRemoveUntil(context, '/followup/inbox', (route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final task = widget.task ?? (appState.followUpTasks.isNotEmpty ? appState.followUpTasks.first : null);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('18 Record Follow-up Visit'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Target Info
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.home_outlined, color: Color(0xFF2563EB)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Home Visit for: ${task?.patientName ?? "Patient"}',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Medication Adherence Switch
              Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: SwitchListTile(
                  title: const Text('Medication Adherence Check', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: const Text('Is patient consuming prescribed medications on schedule?'),
                  value: _adherenceConfirmed,
                  activeThumbColor: const Color(0xFF2563EB),
                  onChanged: (val) => setState(() => _adherenceConfirmed = val),
                ),
              ),
              const SizedBox(height: 16),

              // Follow-up Vitals
              const Text('Follow-up Vitals Recorded', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _systolicController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'BP Systolic',
                        hintText: '120',
                        prefixIcon: Icon(Icons.speed),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _diastolicController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'BP Diastolic',
                        hintText: '80',
                        prefixIcon: Icon(Icons.speed),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _pulseController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Pulse Rate (bpm)',
                  hintText: '72',
                  prefixIcon: Icon(Icons.favorite_border),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),

              // Visit Observations
              TextFormField(
                controller: _notesController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'ASHA Home Visit Observations *',
                  hintText: 'Describe patient recovery, symptoms, and advice given...',
                  prefixIcon: Icon(Icons.note_alt_outlined),
                  border: OutlineInputBorder(),
                ),
                validator: (val) => (val == null || val.trim().isEmpty) ? 'Please record visit notes' : null,
              ),
              const SizedBox(height: 28),

              // Submit Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _isSubmitting ? null : _handleSubmit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.check_circle_outline),
                label: const Text(
                  'Submit & Complete Follow-up Task',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
