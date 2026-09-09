import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/models/assessment_model.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/patient_validators.dart';
import '../../../../core/services/voice_recognition_service.dart';

class AssessmentFormPage extends StatefulWidget {
  const AssessmentFormPage({super.key});

  @override
  State<AssessmentFormPage> createState() => _AssessmentFormPageState();
}

class _AssessmentFormPageState extends State<AssessmentFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _symptomController = TextEditingController();
  final _notesController = TextEditingController();
  final _tempController = TextEditingController(text: '98.6');
  final _systolicController = TextEditingController(text: '120');
  final _diastolicController = TextEditingController(text: '80');
  final _pulseController = TextEditingController(text: '72');
  final _spo2Controller = TextEditingController(text: '98');

  String _selectedSeverity = 'MODERATE';
  int _durationDays = 3;
  bool _isProcessing = false;
  final Map<String, String> _fieldErrors = {};

  // Voice-to-Text Service (Configured for English recognition)
  final VoiceRecognitionService _voiceService = VoiceRecognitionService();
  bool _isListening = false;
  String _speechBaseText = '';

  final List<Map<String, String>> _quickSymptomDefs = const [
    {'id': 'High Fever', 'key': 'symptom_high_fever'},
    {'id': 'Severe Breathlessness', 'key': 'symptom_breathlessness'},
    {'id': 'Persistent Cough', 'key': 'symptom_cough'},
    {'id': 'Chest Pain', 'key': 'symptom_chest_pain'},
    {'id': 'Dizziness / Syncope', 'key': 'symptom_dizziness'},
    {'id': 'Abdominal Pain', 'key': 'symptom_abdominal_pain'},
    {'id': 'Severe Headache', 'key': 'symptom_headache'},
    {'id': 'Vomiting / Diarrhea', 'key': 'symptom_vomiting'},
  ];

  @override
  void dispose() {
    _voiceService.cancelListening();
    _symptomController.dispose();
    _notesController.dispose();
    _tempController.dispose();
    _systolicController.dispose();
    _diastolicController.dispose();
    _pulseController.dispose();
    _spo2Controller.dispose();
    super.dispose();
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.w600))),
          ],
        ),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  Future<void> _toggleVoiceInput(AppState appState) async {
    if (_isListening) {
      await _voiceService.stopListening();
      if (mounted) {
        setState(() => _isListening = false);
      }
      return;
    }

    FocusScope.of(context).unfocus();
    _speechBaseText = _symptomController.text.trim();

    setState(() => _isListening = true);

    final started = await _voiceService.startListening(
      onResult: (recognizedWords, isFinal) {
        if (!mounted) return;
        setState(() {
          if (recognizedWords.trim().isNotEmpty) {
            final combined = _speechBaseText.isEmpty
                ? recognizedWords.trim()
                : '$_speechBaseText ${recognizedWords.trim()}';
            _symptomController.text = combined;
            _symptomController.selection = TextSelection.fromPosition(
              TextPosition(offset: combined.length),
            );
            _clearError('symptom');
          }
          if (isFinal) {
            _isListening = false;
          }
        });
      },
      onError: (err) {
        if (!mounted) return;
        setState(() => _isListening = false);
        final lower = err.toLowerCase();
        if (lower.contains('permission') || lower.contains('denied') || lower.contains('microphone')) {
          _showError(appState.translate('voice_permission_denied'));
        } else if (lower.contains('not available') || lower.contains('unavailable')) {
          _showError(appState.translate('voice_not_available'));
        } else {
          _showError(appState.translate('voice_error', args: {'error': err}));
        }
      },
      onDone: () {
        if (mounted) {
          setState(() => _isListening = false);
        }
      },
    );

    if (!started && mounted) {
      setState(() => _isListening = false);
    }
  }

  void _clearError(String key) {
    if (_fieldErrors.containsKey(key)) {
      setState(() => _fieldErrors.remove(key));
    }
  }

  List<String> _parseSymptoms(String text) {
    return text
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
  }

  bool _isSymptomSelected(String symptomId) {
    final currentList = _parseSymptoms(_symptomController.text);
    return currentList.any((s) => s.toLowerCase() == symptomId.toLowerCase());
  }

  void _toggleQuickSymptom(String symptomId) {
    final currentList = _parseSymptoms(_symptomController.text);
    final existingIndex = currentList.indexWhere(
      (s) => s.toLowerCase() == symptomId.toLowerCase(),
    );

    if (existingIndex >= 0) {
      currentList.removeAt(existingIndex);
    } else {
      currentList.add(symptomId);
    }

    setState(() {
      _symptomController.text = currentList.join(', ');
      _clearError('symptom');
    });
  }

  bool _validateForm(AppState appState) {
    final errors = <String, String>{};

    final symptomErr = PatientValidators.validatePrimarySymptom(_symptomController.text);
    if (symptomErr != null) {
      errors['symptom'] = appState.translate('err_symptom_required');
    }

    final durationErr = PatientValidators.validateDurationDays(_durationDays);
    if (durationErr != null) {
      errors['duration'] = durationErr;
    }

    final notesErr = PatientValidators.validateNotes(_notesController.text);
    if (notesErr != null) {
      errors['notes'] = notesErr;
    }

    setState(() {
      _fieldErrors.clear();
      if (errors.isNotEmpty) _fieldErrors.addAll(errors);
    });

    if (errors.isNotEmpty) {
      _showError(errors.values.first);
      return false;
    }
    return true;
  }

  Future<void> _submitAssessment() async {
    final appState = Provider.of<AppState>(context, listen: false);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    if (patient == null) {
      _showError(appState.translate('no_patient_selected_msg'));
      return;
    }

    if (!_validateForm(appState)) return;

    setState(() => _isProcessing = true);

    final vitals = Vitals(
      temperature: double.tryParse(_tempController.text.trim()),
      systolicBp: int.tryParse(_systolicController.text.trim()),
      diastolicBp: int.tryParse(_diastolicController.text.trim()),
      pulseRate: int.tryParse(_pulseController.text.trim()),
      spo2: int.tryParse(_spo2Controller.text.trim()),
    );

    await appState.createAssessment(
      patientId: patient.id,
      primarySymptom: _symptomController.text.trim(),
      severity: _selectedSeverity,
      durationDays: _durationDays,
      vitals: vitals,
      clinicalNotes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (!appState.isOnline) {
      Navigator.pushReplacementNamed(context, '/assessment/saved_offline');
    } else {
      Navigator.pushReplacementNamed(context, '/triage/ai_result');
    }
  }

  void _showChangePatientDialog(AppState appState) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      appState.translate('select_patient_to_assess'),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.forest),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(),
                Expanded(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: appState.patients.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final p = appState.patients[index];
                      final isCurrent = appState.currentPatient?.id == p.id;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isCurrent ? AppColors.forest : AppColors.mintLight,
                          child: Text(
                            p.name.isNotEmpty ? p.name[0] : '?',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isCurrent ? Colors.white : AppColors.forest,
                            ),
                          ),
                        ),
                        title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${p.age} yrs • ${p.gender} • ${p.village}'),
                        trailing: isCurrent
                            ? const Icon(Icons.check_circle_rounded, color: AppColors.forest)
                            : null,
                        onTap: () {
                          appState.selectPatient(p);
                          Navigator.pop(ctx);
                          setState(() {});
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          appState.translate('clinical_assessment_title'),
          style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.forest, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.forest, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
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
                    appState.isOnline
                        ? appState.translate('online')
                        : appState.translate('offline'),
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
              // Patient Banner Card
              if (patient != null)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFD6E4DB)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: AppColors.mintLight,
                        child: Text(
                          patient.name.isNotEmpty ? patient.name[0] : 'P',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.forest),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    patient.name,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textDark),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${patient.age} yrs • ${patient.gender} • ${patient.village}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textMedium, fontWeight: FontWeight.w500),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (appState.patients.length > 1)
                        TextButton(
                          onPressed: () => _showChangePatientDialog(appState),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.forest,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            minimumSize: const Size(50, 30),
                          ),
                          child: Text(
                            appState.translate('change_patient'),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.person_off_rounded, color: Color(0xFFDC2626), size: 32),
                      const SizedBox(height: 8),
                      Text(
                        appState.translate('no_patient_selected_msg'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.forest,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => Navigator.pushReplacementNamed(context, '/new-patient'),
                        icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
                        label: Text(appState.translate('action_register')),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 18),

              // Chief Clinical Complaint Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD6E4DB)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader(appState.translate('chief_complaint'), Icons.healing_outlined),
                    const SizedBox(height: 10),
                    Text(
                      appState.translate('quick_symptoms_title'),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF4B5563)),
                    ),
                    const SizedBox(height: 8),

                    // Toggleable Quick Symptoms Chips
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _quickSymptomDefs.map((symItem) {
                        final symptomId = symItem['id']!;
                        final symptomLabel = appState.translate(symItem['key']!);
                        final isContained = _isSymptomSelected(symptomId);
                        return InkWell(
                          onTap: () => _toggleQuickSymptom(symptomId),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isContained ? AppColors.forest : AppColors.mintLight,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.forest.withValues(alpha: 0.25)),
                            ),
                            child: Text(
                              symptomLabel,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isContained ? Colors.white : AppColors.forest,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 14),

                    // Primary Symptom Input with Voice-to-Text
                    _buildTextField(
                      controller: _symptomController,
                      label: appState.translate('primary_symptom'),
                      hint: appState.translate('hint_primary_symptom'),
                      icon: Icons.sick_outlined,
                      maxLines: 2,
                      errorText: _fieldErrors['symptom'],
                      suffixIcon: Padding(
                        padding: const EdgeInsets.only(right: 6.0),
                        child: IconButton(
                          icon: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 250),
                            child: _isListening
                                ? Container(
                                    key: const ValueKey('mic_active'),
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDC2626),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFDC2626).withValues(alpha: 0.4),
                                          blurRadius: 8,
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                    child: const Icon(Icons.mic_rounded, color: Colors.white, size: 20),
                                  )
                                : Container(
                                    key: const ValueKey('mic_idle'),
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: AppColors.mintLight,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: AppColors.forest.withValues(alpha: 0.3)),
                                    ),
                                    child: const Icon(Icons.mic_none_rounded, color: AppColors.forest, size: 20),
                                  ),
                          ),
                          tooltip: _isListening
                              ? appState.translate('voice_tap_to_stop')
                              : appState.translate('voice_input_tooltip'),
                          onPressed: () => _toggleVoiceInput(appState),
                        ),
                      ),
                      onChanged: (_) {
                        _clearError('symptom');
                        setState(() {});
                      },
                    ),

                    if (_isListening) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFDC2626)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                appState.translate('voice_listening'),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFDC2626),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            InkWell(
                              onTap: () => _toggleVoiceInput(appState),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDC2626),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.stop_rounded, color: Colors.white, size: 14),
                                    const SizedBox(width: 2),
                                    Text(
                                      appState.translate('voice_tap_to_stop'),
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 14),

                    // Severity & Duration Dropdowns Row
                    Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                appState.translate('severity_label'),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.forest),
                              ),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                initialValue: _selectedSeverity,
                                isExpanded: true,
                                decoration: InputDecoration(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFFB8C8BD), width: 1.2),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFFB8C8BD), width: 1.2),
                                  ),
                                ),
                                items: [
                                  DropdownMenuItem(
                                    value: 'MILD',
                                    child: Text(
                                      appState.translate('severity_mild'),
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  ),
                                  DropdownMenuItem(
                                    value: 'MODERATE',
                                    child: Text(
                                      appState.translate('severity_moderate'),
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  ),
                                  DropdownMenuItem(
                                    value: 'SEVERE',
                                    child: Text(
                                      appState.translate('severity_severe'),
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  ),
                                ],
                                onChanged: (val) {
                                  if (val != null) setState(() => _selectedSeverity = val);
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 1,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                appState.translate('duration_label'),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.forest),
                              ),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<int>(
                                initialValue: _durationDays,
                                isExpanded: true,
                                decoration: InputDecoration(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFFB8C8BD), width: 1.2),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: Color(0xFFB8C8BD), width: 1.2),
                                  ),
                                ),
                                items: [1, 2, 3, 4, 5, 7, 10, 14].map((d) {
                                  return DropdownMenuItem(
                                    value: d,
                                    child: Text(
                                      appState.translate('days_unit', args: {'count': '$d'}),
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                    ),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _durationDays = val);
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Baseline Vitals Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD6E4DB)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader(appState.translate('baseline_vitals'), Icons.monitor_heart_outlined),
                    const SizedBox(height: 14),

                    // Temp & SpO2
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _tempController,
                            label: appState.translate('temp_label'),
                            hint: '98.6',
                            icon: Icons.thermostat_outlined,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            errorText: _fieldErrors['temp'],
                            onChanged: (_) => _clearError('temp'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            controller: _spo2Controller,
                            label: appState.translate('spo2_label'),
                            hint: '98',
                            icon: Icons.air_outlined,
                            keyboardType: TextInputType.number,
                            errorText: _fieldErrors['spo2'],
                            onChanged: (_) => _clearError('spo2'),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // BP Systolic & Diastolic
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _systolicController,
                            label: appState.translate('bp_systolic'),
                            hint: '120',
                            icon: Icons.speed_outlined,
                            keyboardType: TextInputType.number,
                            errorText: _fieldErrors['bp'],
                            onChanged: (_) => _clearError('bp'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            controller: _diastolicController,
                            label: appState.translate('bp_diastolic'),
                            hint: '80',
                            icon: Icons.speed_outlined,
                            keyboardType: TextInputType.number,
                            errorText: _fieldErrors['bp'],
                            onChanged: (_) => _clearError('bp'),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Pulse Rate
                    _buildTextField(
                      controller: _pulseController,
                      label: appState.translate('pulse_rate'),
                      hint: '72',
                      icon: Icons.favorite_border_rounded,
                      keyboardType: TextInputType.number,
                      errorText: _fieldErrors['pulse'],
                      onChanged: (_) => _clearError('pulse'),
                    ),

                    const SizedBox(height: 14),

                    // Clinical Notes
                    _buildTextField(
                      controller: _notesController,
                      label: appState.translate('clinical_notes'),
                      hint: appState.translate('hint_clinical_notes'),
                      icon: Icons.notes_outlined,
                      maxLines: 2,
                      textInputAction: TextInputAction.done,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.forest,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
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
                      ? appState.translate('process_clinical_triage')
                      : appState.translate('save_assessment_offline'),
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.forest),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.forest),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    TextInputAction textInputAction = TextInputAction.next,
    Widget? suffixIcon,
    int maxLines = 1,
    void Function(String)? onChanged,
    String? errorText,
  }) {
    final hasError = errorText != null && errorText.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: hasError ? const Color(0xFFDC2626) : AppColors.forest,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          maxLines: maxLines,
          onChanged: onChanged,
          style: const TextStyle(fontSize: 14, color: AppColors.textDark, fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
            prefixIcon: Icon(icon, color: hasError ? const Color(0xFFDC2626) : AppColors.forest, size: 20),
            suffixIcon: suffixIcon,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: hasError ? const Color(0xFFDC2626) : const Color(0xFFB8C8BD), width: 1.2),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: hasError ? const Color(0xFFDC2626) : const Color(0xFFB8C8BD), width: 1.2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: hasError ? const Color(0xFFDC2626) : AppColors.forest, width: 1.8),
            ),
            errorText: hasError ? errorText : null,
            errorStyle: const TextStyle(fontSize: 11, color: Color(0xFFDC2626), fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
