import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/models/assessment_model.dart';
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

    await appState.createAssessmentAsync(
      patientId: patient.id,
      primarySymptom: _symptomController.text.trim(),
      severity: _severity,
      durationDays: int.tryParse(_durationController.text.trim()) ?? 1,
      vitals: vitals,
      clinicalNotes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    if (!mounted) return;
    setState(() => _isProcessing = false);

    // 09 Internet? Decision Branch (from Figma flowchart)
    if (!appState.isOnline) {
      // 09 Internet? -> NO -> 10 Saved Offline -> 11 Sync Queue
      Navigator.pushReplacementNamed(context, '/assessment/saved_offline');
    } else {
      // 09 Internet? -> YES -> 11 Sync / Upload -> 12 AI Triage + Reasoning
      Navigator.pushReplacementNamed(context, '/triage/ai_result');
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Symptoms & Health Readings'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        actions: [
          // Connectivity indicator banner
          Container(
            margin: const EdgeInsets.only(right: 12),
            alignment: Alignment.center,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: appState.isOnline ? Colors.green.shade700 : Colors.amber.shade800,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                appState.isOnline ? 'Online Sync' : 'Offline Mode',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
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
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.person, color: Color(0xFF2563EB)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Assessing: ${patient.name} (${patient.age}y, ${patient.gender}) • Village: ${patient.village}',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),

              // Vernacular Voice Input
              const Text('Voice Input (Speak in your language)', style: TextStyle(fontWeight: FontWeight.bold)),
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
                  labelText: 'Main Symptoms / Problems *',
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
                'Vital Signs (Health Readings)',
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
                  labelText: 'Your Observations & Notes',
                  hintText: 'e.g. Patient appeared dehydrated, walking with difficulty',
                  prefixIcon: Icon(Icons.notes_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 28),

              // Flow Action Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _isProcessing ? null : _submitAssessment,
                icon: _isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Icon(appState.isOnline ? Icons.auto_awesome : Icons.save_alt),
                label: Flexible(
                  child: Text(
                    appState.isOnline
                        ? 'Analyze Symptoms & Get Guidance'
                        : 'Save Offline (Upload Later)',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
