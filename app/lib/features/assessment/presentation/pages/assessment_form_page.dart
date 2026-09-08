import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/models/assessment_model.dart';
import '../../../../core/theme/app_colors.dart';
import '../widgets/voice_input.dart';

class AssessmentFormPage extends StatefulWidget {
  const AssessmentFormPage({super.key});

  @override
  State<AssessmentFormPage> createState() => _AssessmentFormPageState();
}

class _AssessmentFormPageState extends State<AssessmentFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _symptomController = TextEditingController(text: 'Persistent dry cough and mild breathlessness');
  final _durationController = TextEditingController(text: '3');
  final _tempController = TextEditingController(text: '99.4');
  final _systolicController = TextEditingController(text: '135');
  final _diastolicController = TextEditingController(text: '88');
  final _pulseController = TextEditingController(text: '84');
  final _spo2Controller = TextEditingController(text: '95');
  final _glucoseController = TextEditingController(text: '110');
  final _notesController = TextEditingController();

  String _severity = 'MODERATE';
  bool _isProcessing = false;

  void _handleVoiceTranscription(String text) {
    setState(() {
      _symptomController.text = text;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Voice transcribed into symptoms field')),
    );
  }

  void _submitAssessment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isProcessing = true);
    final appState = Provider.of<AppState>(context, listen: false);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    if (patient == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error: No patient selected for assessment.')),
      );
      setState(() => _isProcessing = false);
      return;
    }

    final vitals = Vitals(
      temperature: double.tryParse(_tempController.text.trim()),
      systolicBp: int.tryParse(_systolicController.text.trim()),
      diastolicBp: int.tryParse(_diastolicController.text.trim()),
      pulseRate: int.tryParse(_pulseController.text.trim()),
      spo2: int.tryParse(_spo2Controller.text.trim()),
      bloodGlucose: double.tryParse(_glucoseController.text.trim()),
    );

    await appState.createAssessment(
      patientId: patient.id,
      primarySymptom: _symptomController.text.trim(),
      severity: _severity,
      durationDays: int.tryParse(_durationController.text.trim()) ?? 1,
      vitals: vitals,
      clinicalNotes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    if (!mounted) return;
    setState(() => _isProcessing = false);

    // Decision Branch
    if (!appState.isOnline) {
      // Saved Offline -> Sync Queue
      Navigator.pushReplacementNamed(context, '/assessment/saved_offline');
    } else {
      // Uploaded -> AI Triage + Reasoning
      Navigator.pushReplacementNamed(context, '/triage/ai_result');
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Clinical Assessment & Vitals', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.forest, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.forest, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          // Connectivity indicator banner
          Container(
            margin: const EdgeInsets.only(right: 14),
            alignment: Alignment.center,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: appState.isOnline ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: appState.isOnline ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    appState.isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                    size: 14,
                    color: appState.isOnline ? const Color(0xFF166534) : const Color(0xFF92400E),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    appState.isOnline ? 'Online Sync' : 'Offline Mode',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: appState.isOnline ? const Color(0xFF166534) : const Color(0xFF92400E),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Patient Banner
              if (patient != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.mintLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.forest.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 18,
                        backgroundColor: Colors.white,
                        child: Icon(Icons.person_rounded, color: AppColors.forest, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              patient.name,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textDark),
                            ),
                            Text(
                              '${patient.age} yrs • ${patient.gender} • Village: ${patient.village}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textMedium, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),

              // Vernacular Voice Input
              const Text('Voice Input (Vernacular Assistant)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              VernacularVoiceInput(
                onTranscriptionResult: _handleVoiceTranscription,
              ),
              const SizedBox(height: 16),

              // Primary Symptom
              TextFormField(
                controller: _symptomController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Primary Clinical Symptoms *',
                  hintText: 'Describe chief complaint (e.g. High fever, chest pain)',
                  prefixIcon: Icon(Icons.healing_outlined),
                  border: OutlineInputBorder(),
                ),
                validator: (val) => (val == null || val.trim().isEmpty) ? 'Please enter primary symptoms' : null,
              ),
              const SizedBox(height: 16),

              // Severity & Duration Row
              Row(
                children: [
                  Expanded(
                    flex: 1,
                    child: DropdownButtonFormField<String>(
                      initialValue: _severity,
                      decoration: const InputDecoration(
                        labelText: 'Severity *',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'MILD', child: Text('🟢 Mild')),
                        DropdownMenuItem(value: 'MODERATE', child: Text('🟠 Moderate')),
                        DropdownMenuItem(value: 'SEVERE', child: Text('🔴 Severe')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _severity = val);
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 1,
                    child: TextFormField(
                      controller: _durationController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Duration (Days) *',
                        prefixIcon: Icon(Icons.calendar_today_outlined),
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => (val == null || val.trim().isEmpty) ? 'Enter days' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Physiological Vitals Section
              const Text(
                'Physiological Vitals',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _tempController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Temp (°F)',
                        hintText: '98.6',
                        prefixIcon: Icon(Icons.thermostat),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _spo2Controller,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'SpO2 (%)',
                        hintText: '98',
                        prefixIcon: Icon(Icons.air),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

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
                  const SizedBox(width: 12),
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

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _pulseController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Pulse (bpm)',
                        hintText: '72',
                        prefixIcon: Icon(Icons.favorite_border),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _glucoseController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Glucose (mg/dL)',
                        hintText: '100',
                        prefixIcon: Icon(Icons.water_drop_outlined),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Additional Notes
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Worker Clinical Observations & Notes',
                  hintText: 'e.g. Patient appeared dehydrated, walking with difficulty',
                  prefixIcon: Icon(Icons.notes_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 28),

              // Flow Action Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.forest,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: _isProcessing ? null : _submitAssessment,
                icon: _isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Icon(appState.isOnline ? Icons.auto_awesome_rounded : Icons.save_rounded),
                label: Text(
                  appState.isOnline
                      ? 'Process Clinical Triage'
                      : 'Save Assessment to Offline Queue',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
