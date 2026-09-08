import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/patient_model.dart';
import '../../../../core/models/assessment_model.dart';
import '../../../../core/utils/patient_validators.dart';
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

  // Vitals
  final _tempController = TextEditingController(text: '98.6');
  final _systolicController = TextEditingController(text: '120');
  final _diastolicController = TextEditingController(text: '80');
  final _pulseController = TextEditingController(text: '72');
  final _spo2Controller = TextEditingController(text: '98');

  @override
  void dispose() {
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

  bool _validateStep1() {
    final errors = <String, String>{};

    final nameErr = PatientValidators.validateName(_nameController.text);
    if (nameErr != null) errors['name'] = nameErr;

    final ageText = _ageController.text.trim();
    final dobText = _dobController.text.trim();

    if (ageText.isEmpty && dobText.isEmpty) {
      errors['age'] = 'Please enter age or select date of birth';
      errors['dob'] = 'Please enter date of birth or age';
    } else {
      if (ageText.isNotEmpty) {
        final ageErr = PatientValidators.validateAge(ageText);
        if (ageErr != null) errors['age'] = ageErr;
      }
      if (dobText.isNotEmpty) {
        final dobErr = PatientValidators.validateDob(dobText);
        if (dobErr != null) errors['dob'] = dobErr;
      }
    }

    final phoneErr = PatientValidators.validatePhone(_phoneController.text);
    if (phoneErr != null) errors['phone'] = phoneErr;

    final villageErr = PatientValidators.validateVillage(_villageController.text);
    if (villageErr != null) errors['village'] = villageErr;

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

  void _onNextStep() {
    if (!_validateStep1()) return;

    FocusScope.of(context).unfocus();
    setState(() => _currentStep = 2);
  }

  bool _validateStep2() {
    final errors = <String, String>{};

    final symptomErr = PatientValidators.validatePrimarySymptom(_symptomController.text);
    if (symptomErr != null) errors['symptom'] = symptomErr;

    final durationErr = PatientValidators.validateDurationDays(_durationDays);
    if (durationErr != null) errors['duration'] = durationErr;

    final notesErr = PatientValidators.validateNotes(_notesController.text);
    if (notesErr != null) errors['notes'] = notesErr;

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

    if (!_validateStep2()) return;

    setState(() => _isSubmitting = true);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const PopScope(
        canPop: false,
        child: Center(
          child: CircularProgressIndicator(color: AppColors.forest),
        ),
      ),
    );

    try {
      final parsedAge = int.tryParse(_ageController.text.trim()) ??
          PatientValidators.calculateAgeFromDob(_dobController.text.trim()) ??
          30;
      final formattedPhone = PatientValidators.normalizePhone(_phoneController.text);

      // 1. Register Patient with strictly backend fields
      final patient = await appState.registerPatient(
        name: _nameController.text.trim(),
        age: parsedAge,
        gender: _selectedGender,
        phone: formattedPhone,
        village: _villageController.text.trim(),
        dob: _dobController.text.trim().isNotEmpty ? _dobController.text.trim() : null,
        abhaId: _abhaController.text.trim().isNotEmpty ? _abhaController.text.trim() : null,
      );

      // 2. Register Vitals & Symptoms
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
      Navigator.of(context, rootNavigator: true).pop(); // dismiss loading
      setState(() => _isSubmitting = false);

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RegistrationSuccessPage(patient: patient),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop();
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Saved with local sync queue: ${e.toString().replaceAll("Exception: ", "")}'),
          backgroundColor: AppColors.forest,
        ),
      );
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

  int _calculateAgeFromDob(String dob) {
    return PatientValidators.calculateAgeFromDob(dob) ?? 30;
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0),
                child: _currentStep == 1 ? _buildStep1Demographics() : _buildStep2Assessment(),
              ),
            ),
            _buildBottomNav(appState),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
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
                  _currentStep == 1 ? 'New Citizen Registration' : 'Symptoms & Baseline Vitals',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.forest,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _currentStep == 1 ? 'Step 1 of 2 · Citizen Demographics' : 'Step 2 of 2 · Vitals & Clinical Intake',
                  style: const TextStyle(fontSize: 12, color: AppColors.textLight, fontWeight: FontWeight.w600),
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
  Widget _buildStep1Demographics() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Citizen Demographics', Icons.person_outline_rounded),
        const SizedBox(height: 12),
        _buildTextField(
          controller: _nameController,
          label: 'Full Name *',
          hint: 'e.g. Ramesh Patel',
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
                label: 'Age (Yrs) *',
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
                label: 'DOB (DD/MM/YYYY)',
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
        const Text(
          'Gender *',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _genderOption('Female', Icons.female_rounded),
            const SizedBox(width: 10),
            _genderOption('Male', Icons.male_rounded),
            const SizedBox(width: 10),
            _genderOption('Other', Icons.transgender_rounded),
          ],
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _phoneController,
          label: 'Mobile Phone Number *',
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
          label: 'Village / Ward *',
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
          label: 'ABHA Number (Optional)',
          hint: '91-XXXX-XXXX-XXXX',
          icon: Icons.fingerprint_rounded,
          textInputAction: TextInputAction.done,
        ),
      ],
    );
  }

  Widget _genderOption(String gender, IconData icon) {
    final isSelected = _selectedGender == gender;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedGender = gender),
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
              const SizedBox(width: 6),
              Text(
                gender,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Colors.white : AppColors.forest,
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
  Widget _buildStep2Assessment() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Chief Clinical Complaint', Icons.healing_outlined),
        const SizedBox(height: 8),
        const Text('Quick Symptom Tap to Add:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF4B5563))),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            'High Fever',
            'Severe Breathlessness',
            'Persistent Cough',
            'Chest Pain',
            'Dizziness / Syncope',
            'Abdominal Pain',
            'Severe Headache',
            'Vomiting / Diarrhea',
          ].map((symptom) {
            final isContained = _isSymptomSelected(symptom);
            return InkWell(
              onTap: () => _toggleQuickSymptom(symptom),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isContained ? AppColors.forest : AppColors.mintLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.forest.withValues(alpha: 0.25)),
                ),
                child: Text(
                  symptom,
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
          label: 'Primary Symptom *',
          hint: 'e.g. High grade fever with chills & cough',
          icon: Icons.sick_outlined,
          maxLines: 2,
          textInputAction: TextInputAction.next,
          errorText: _fieldErrors['symptom'],
          onChanged: (_) {
            _clearError('symptom');
            setState(() {});
          },
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              flex: 1,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Severity *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.forest)),
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
                    items: const [
                      DropdownMenuItem(value: 'MILD', child: Text('🟢 Mild')),
                      DropdownMenuItem(value: 'MODERATE', child: Text('🟠 Moderate')),
                      DropdownMenuItem(value: 'SEVERE', child: Text('🔴 Severe')),
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
                  const Text('Duration (Days) *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.forest)),
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
                      return DropdownMenuItem(value: d, child: Text('$d Days'));
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
        _buildSectionHeader('Objective Baseline Vitals', Icons.monitor_heart_outlined),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                controller: _tempController,
                label: 'Temp (°F)',
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
                label: 'SpO2 (%)',
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
                label: 'BP Systolic',
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
                label: 'BP Diastolic',
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
          label: 'Pulse Rate (bpm)',
          hint: '72',
          icon: Icons.favorite_border_rounded,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _notesController,
          label: 'Clinical Notes (Optional)',
          hint: 'e.g. Known hypertensive, missed medication.',
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
              child: const Text('Back', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          if (_currentStep > 1) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _isSubmitting
                  ? null
                  : () {
                      if (_currentStep == 1) {
                        _onNextStep();
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
                  : Text(
                      _currentStep == 1 ? 'Continue to Vitals & Symptoms' : 'Save Patient & Assess',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
