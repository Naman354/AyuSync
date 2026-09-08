import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/patient_model.dart';
import '../../../../core/models/assessment_model.dart';
import '../../../../core/utils/patient_validators.dart';
import '../../../../core/services/voice_recognition_service.dart';
import 'registration_success_page.dart';

class NewPatientPage extends StatefulWidget {
  const NewPatientPage({super.key});

  @override
  State<NewPatientPage> createState() => _NewPatientPageState();
}

class _NewPatientPageState extends State<NewPatientPage> {
  int _currentStep = 1; // 1: Citizen Demographics, 2: Symptoms & Vitals
  bool _isSubmitting = false;
  final Map<String, String> _fieldErrors = {};

  void _clearError(String key) {
    if (_fieldErrors.containsKey(key)) {
      setState(() => _fieldErrors.remove(key));
    }
  }

  // --- Step 1 Controllers (Backend Patient Fields) ---
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _dobController = TextEditingController();
  String _selectedGender = 'Female';
  final _phoneController = TextEditingController();
  final _villageController = TextEditingController(text: 'Khandala Ward 1');
  final _abhaController = TextEditingController();

  // Common local villages for quick 1-tap fill
  final List<String> _quickVillages = [
    'Khandala Ward 1',
    'Khandala Ward 2',
    'Bhosale Vasti',
    'Malwadi',
  ];

  // --- Step 2 Controllers (Backend Assessment & Vitals Fields) ---
  final _symptomController = TextEditingController();
  String _selectedSeverity = 'MODERATE'; // MILD, MODERATE, SEVERE
  int _durationDays = 3;
  final _notesController = TextEditingController();

  // Voice-to-Text Service (Configured for English recognition)
  final VoiceRecognitionService _voiceService = VoiceRecognitionService();
  bool _isListening = false;
  String _speechBaseText = '';

  // Vitals
  final _tempController = TextEditingController(text: '98.6');
  final _systolicController = TextEditingController(text: '120');
  final _diastolicController = TextEditingController(text: '80');
  final _pulseController = TextEditingController(text: '72');
  final _spo2Controller = TextEditingController(text: '98');

  @override
  void dispose() {
    _voiceService.cancelListening();
    _nameController.dispose();
    _ageController.dispose();
    _dobController.dispose();
    _phoneController.dispose();
    _villageController.dispose();
    _abhaController.dispose();
    _symptomController.dispose();
    _notesController.dispose();
    _tempController.dispose();
    _systolicController.dispose();
    _diastolicController.dispose();
    _pulseController.dispose();
    _spo2Controller.dispose();
    super.dispose();
  }

  String? _localizeError(AppState appState, String? err) {
    if (err == null) return null;
    if (err.contains('full name') || err.contains('patient name')) return appState.translate('err_name_required');
    if (err.contains('2 characters')) return appState.translate('err_name_min');
    if (err.contains('letters')) return appState.translate('err_name_letters');
    if (err.contains('numbers')) return appState.translate('err_name_numbers');
    if (err.contains('age or') || err.contains('date of birth or')) return appState.translate('err_age_or_dob');
    if (err.contains('between 0 and 125')) return appState.translate('err_age_range');
    if (err.contains('10-digit') || err.contains('valid 10-digit')) return appState.translate('err_phone_required');
    if (err.contains('start with 6')) return appState.translate('err_phone_prefix');
    if (err.contains('village')) return appState.translate('err_village_required');
    if (err.contains('primary') || err.contains('symptom')) return appState.translate('err_symptom_required');
    return err;
  }

  bool _validateStep1(AppState appState) {
    final errors = <String, String>{};

    final nameErr = PatientValidators.validateName(_nameController.text);
    if (nameErr != null) errors['name'] = _localizeError(appState, nameErr)!;

    final ageText = _ageController.text.trim();
    final dobText = _dobController.text.trim();

    if (ageText.isEmpty && dobText.isEmpty) {
      errors['age'] = appState.translate('err_age_or_dob');
      errors['dob'] = appState.translate('err_age_or_dob');
    } else {
      if (ageText.isNotEmpty) {
        final ageErr = PatientValidators.validateAge(ageText);
        if (ageErr != null) errors['age'] = _localizeError(appState, ageErr)!;
      }
      if (dobText.isNotEmpty) {
        final dobErr = PatientValidators.validateDob(dobText);
        if (dobErr != null) errors['dob'] = _localizeError(appState, dobErr)!;
      }
    }

    final phoneErr = PatientValidators.validatePhone(_phoneController.text);
    if (phoneErr != null) errors['phone'] = _localizeError(appState, phoneErr)!;

    final villageErr = PatientValidators.validateVillage(_villageController.text);
    if (villageErr != null) errors['village'] = _localizeError(appState, villageErr)!;

    setState(() {
      _fieldErrors.clear();
      _fieldErrors.addAll(errors);
    });

    if (errors.isNotEmpty) {
      _showError(errors.values.first);
      return false;
    }
    return true;
  }

  void _onNextStep(AppState appState) {
    if (!_validateStep1(appState)) return;

    FocusScope.of(context).unfocus();
    setState(() => _currentStep = 2);
  }

  bool _validateStep2(AppState appState) {
    final errors = <String, String>{};

    final symptomErr = PatientValidators.validatePrimarySymptom(_symptomController.text);
    if (symptomErr != null) errors['symptom'] = _localizeError(appState, symptomErr)!;

    final durationErr = PatientValidators.validateDurationDays(_durationDays);
    if (durationErr != null) errors['duration'] = _localizeError(appState, durationErr)!;

    final notesErr = PatientValidators.validateNotes(_notesController.text);
    if (notesErr != null) errors['notes'] = _localizeError(appState, notesErr)!;

    setState(() {
      _fieldErrors.remove('symptom');
      _fieldErrors.remove('notes');
      _fieldErrors.remove('duration');
      if (errors.isNotEmpty) _fieldErrors.addAll(errors);
    });

    if (errors.isNotEmpty) {
      _showError(errors.values.first);
      return false;
    }
    return true;
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

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final initial = _dobController.text.isNotEmpty
        ? _parseDobToDateTime(_dobController.text) ?? DateTime(now.year - 30, 1, 1)
        : DateTime(now.year - 30, 1, 1);

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1900),
      lastDate: now,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.forest,
              onPrimary: Colors.white,
              onSurface: AppColors.textDark,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted = '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
      final age = now.year - picked.year - ((now.month < picked.month || (now.month == picked.month && now.day < picked.day)) ? 1 : 0);
      setState(() {
        _dobController.text = formatted;
        _ageController.text = (age >= 0 ? age : 0).toString();
        _fieldErrors.remove('dob');
        _fieldErrors.remove('age');
      });
    }
  }

  DateTime? _parseDobToDateTime(String dob) {
    try {
      final parts = dob.split('/');
      if (parts.length == 3) {
        final d = int.parse(parts[0]);
        final m = int.parse(parts[1]);
        final y = int.parse(parts[2]);
        return DateTime(y, m, d);
      }
    } catch (_) {}
    return null;
  }

  Future<void> _onSavePatient(AppState appState) async {
    if (_isSubmitting) return;

    if (!_validateStep2(appState)) return;

    setState(() => _isSubmitting = true);

    try {
      final parsedAge = int.tryParse(_ageController.text.trim()) ??
          PatientValidators.calculateAgeFromDob(_dobController.text.trim()) ??
          30;
      final formattedPhone = PatientValidators.normalizePhone(_phoneController.text);

      // 1. Instant local-first patient registration (persists to SQLite immediately & kicks off non-blocking background sync)
      final patient = await appState.registerPatient(
        name: _nameController.text.trim(),
        age: parsedAge,
        gender: _selectedGender,
        phone: formattedPhone,
        village: _villageController.text.trim(),
        dob: _dobController.text.trim().isNotEmpty ? _dobController.text.trim() : null,
        abhaId: _abhaController.text.trim().isNotEmpty ? _abhaController.text.trim() : null,
      );

      // 2. Instant local-first vitals & clinical assessment registration
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
      setState(() => _isSubmitting = false);

      // Instant transition to RegistrationSuccessPage with zero waiting delay
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RegistrationSuccessPage(patient: patient),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RegistrationSuccessPage(
            patient: appState.currentPatient ??
                Patient(
                  id: 'PAT-LOCAL',
                  name: _nameController.text.trim(),
                  age: int.tryParse(_ageController.text.trim()) ?? 30,
                  gender: _selectedGender,
                  phone: _phoneController.text.trim(),
                  village: _villageController.text.trim(),
                ),
          ),
        ),
      );
    }
  }

  static const List<Map<String, String>> _quickSymptomDefs = [
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
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(appState),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0),
                child: _currentStep == 1 ? _buildStep1Demographics(appState) : _buildStep2Assessment(appState),
              ),
            ),
            _buildBottomNav(appState),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(AppState appState) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      color: Colors.white,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.forest, size: 20),
            onPressed: () {
              if (_currentStep > 1) {
                setState(() => _currentStep -= 1);
              } else {
                Navigator.pop(context);
              }
            },
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  _currentStep == 1
                      ? appState.translate('new_citizen_registration')
                      : appState.translate('step_2_title'),
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.forest,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  _currentStep == 1
                      ? appState.translate('step_1_subtitle')
                      : appState.translate('step_2_subtitle'),
                  style: const TextStyle(fontSize: 12, color: AppColors.textLight, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 40),
        ],
      ),
    );
  }

  // --- Step 1: Backend Patient Demographics ---
  Widget _buildStep1Demographics(AppState appState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(appState.translate('step_1_title'), Icons.person_outline_rounded),
        const SizedBox(height: 12),
        _buildTextField(
          controller: _nameController,
          label: appState.translate('full_name'),
          hint: appState.translate('hint_full_name'),
          icon: Icons.badge_outlined,
          textInputAction: TextInputAction.next,
          errorText: _fieldErrors['name'],
          onChanged: (_) => _clearError('name'),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              flex: 1,
              child: _buildTextField(
                controller: _ageController,
                label: appState.translate('age_years'),
                hint: 'e.g. 45',
                icon: Icons.cake_outlined,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.next,
                errorText: _fieldErrors['age'],
                onChanged: (val) {
                  _clearError('age');
                  final age = int.tryParse(val.trim());
                  if (age != null && age > 0 && age <= 125) {
                    final birthYear = DateTime.now().year - age;
                    _dobController.text = '01/01/$birthYear';
                    _clearError('dob');
                  }
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 1,
              child: _buildTextField(
                controller: _dobController,
                label: appState.translate('dob_label'),
                hint: '01/01/1980',
                icon: Icons.calendar_today_outlined,
                textInputAction: TextInputAction.next,
                errorText: _fieldErrors['dob'],
                suffixIcon: IconButton(
                  icon: const Icon(Icons.date_range_rounded, color: AppColors.forest, size: 20),
                  tooltip: 'Choose Date of Birth',
                  onPressed: _pickDob,
                ),
                onChanged: (val) {
                  _clearError('dob');
                  final calculatedAge = PatientValidators.calculateAgeFromDob(val.trim());
                  if (calculatedAge != null && calculatedAge > 0) {
                    _ageController.text = calculatedAge.toString();
                    _clearError('age');
                  }
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(
          appState.translate('gender_label'),
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _genderOption('Female', appState.translate('gender_female'), Icons.female_rounded),
            const SizedBox(width: 10),
            _genderOption('Male', appState.translate('gender_male'), Icons.male_rounded),
            const SizedBox(width: 10),
            _genderOption('Other', appState.translate('gender_other'), Icons.transgender_rounded),
          ],
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _phoneController,
          label: appState.translate('mobile_phone'),
          hint: '98765 43210',
          icon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          errorText: _fieldErrors['phone'],
          onChanged: (_) => _clearError('phone'),
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _villageController,
          label: appState.translate('village_ward'),
          hint: 'e.g. Khandala Ward 1',
          icon: Icons.location_on_outlined,
          textInputAction: TextInputAction.next,
          errorText: _fieldErrors['village'],
          onChanged: (_) => _clearError('village'),
        ),
        const SizedBox(height: 6),
        // Quick 1-tap village selector chips
        Wrap(
          spacing: 6,
          runSpacing: 4,
          children: _quickVillages.map((v) {
            final isSelected = _villageController.text.trim() == v;
            return InkWell(
              onTap: () {
                setState(() => _villageController.text = v);
                _clearError('village');
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.forest : AppColors.mintLight,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  v,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppColors.textDark,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _abhaController,
          label: appState.translate('abha_number'),
          hint: '91-XXXX-XXXX-XXXX',
          icon: Icons.fingerprint_rounded,
          textInputAction: TextInputAction.done,
        ),
      ],
    );
  }

  Widget _genderOption(String genderValue, String displayLabel, IconData icon) {
    final isSelected = _selectedGender == genderValue;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedGender = genderValue),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.forest : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.forest : const Color(0xFFB8C8BD),
              width: 1.5,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : AppColors.forest),
              const SizedBox(width: 4),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    displayLabel,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? Colors.white : AppColors.forest,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _isSymptomSelected(String symptom) {
    return PatientValidators.isSymptomInList(_symptomController.text, symptom);
  }

  void _toggleQuickSymptom(String symptom) {
    final wasSelected = _isSymptomSelected(symptom);
    setState(() {
      _symptomController.text = PatientValidators.toggleSymptomInList(_symptomController.text, symptom);
      if (!wasSelected && (symptom == 'Chest Pain' || symptom == 'Severe Breathlessness')) {
        _selectedSeverity = 'SEVERE';
      }
    });

    _clearError('symptom');
  }

  // --- Step 2: Backend Assessment (Symptoms & Vitals) ---
  Widget _buildStep2Assessment(AppState appState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(appState.translate('chief_complaint'), Icons.healing_outlined),
        const SizedBox(height: 8),
        Text(
          appState.translate('quick_symptoms_title'),
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF4B5563)),
        ),
        const SizedBox(height: 6),
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
        const SizedBox(height: 12),
        _buildTextField(
          controller: _symptomController,
          label: appState.translate('primary_symptom'),
          hint: appState.translate('hint_primary_symptom'),
          icon: Icons.sick_outlined,
          maxLines: 2,
          textInputAction: TextInputAction.next,
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
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
                      DropdownMenuItem(value: 'MILD', child: Text(appState.translate('severity_mild'))),
                      DropdownMenuItem(value: 'MODERATE', child: Text(appState.translate('severity_moderate'))),
                      DropdownMenuItem(value: 'SEVERE', child: Text(appState.translate('severity_severe'))),
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
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
                        child: Text(appState.translate('days_unit', args: {'count': '$d'})),
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
        const SizedBox(height: 20),
        _buildSectionHeader(appState.translate('baseline_vitals'), Icons.monitor_heart_outlined),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _tempController,
                label: appState.translate('temp_label'),
                hint: '98.6',
                icon: Icons.thermostat_outlined,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textInputAction: TextInputAction.next,
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
                textInputAction: TextInputAction.next,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _systolicController,
                label: appState.translate('bp_systolic'),
                hint: '120',
                icon: Icons.speed_outlined,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.next,
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
                textInputAction: TextInputAction.next,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildTextField(
          controller: _pulseController,
          label: appState.translate('pulse_rate'),
          hint: '72',
          icon: Icons.favorite_border_rounded,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _notesController,
          label: appState.translate('clinical_notes'),
          hint: appState.translate('hint_clinical_notes'),
          icon: Icons.notes_outlined,
          maxLines: 2,
          textInputAction: TextInputAction.done,
          errorText: _fieldErrors['notes'],
          onChanged: (_) => _clearError('notes'),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.forest),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.forest),
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
        Container(
          decoration: BoxDecoration(
            color: hasError ? const Color(0xFFFEF2F2) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: hasError ? const Color(0xFFDC2626) : const Color(0xFFB8C8BD),
              width: hasError ? 1.5 : 1.2,
            ),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            maxLines: maxLines,
            onChanged: onChanged,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textDark),
            decoration: InputDecoration(
              labelText: label,
              labelStyle: TextStyle(
                fontSize: 13,
                color: hasError ? const Color(0xFFDC2626) : Colors.grey.shade700,
                fontWeight: FontWeight.w500,
              ),
              hintText: hint,
              hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
              prefixIcon: Icon(
                icon,
                color: hasError ? const Color(0xFFDC2626) : AppColors.forest,
                size: 20,
              ),
              suffixIcon: suffixIcon,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(left: 6.0),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded, size: 13, color: Color(0xFFDC2626)),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    errorText,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildBottomNav(AppState appState) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 1)
            OutlinedButton(
              onPressed: _isSubmitting ? null : () => setState(() => _currentStep -= 1),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.forest,
                side: const BorderSide(color: AppColors.forest, width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              ),
              child: Text(appState.translate('back'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          if (_currentStep > 1) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _isSubmitting
                  ? null
                  : () {
                      if (_currentStep == 1) {
                        _onNextStep(appState);
                      } else {
                        _onSavePatient(appState);
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                    )
                  : FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        _currentStep == 1
                            ? appState.translate('continue_to_vitals')
                            : appState.translate('save_patient_assess'),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
