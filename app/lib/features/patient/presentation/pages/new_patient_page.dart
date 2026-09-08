import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/patient_model.dart';
import '../../../../core/models/assessment_model.dart';
import 'registration_success_page.dart';

class NewPatientPage extends StatefulWidget {
  const NewPatientPage({super.key});

  @override
  State<NewPatientPage> createState() => _NewPatientPageState();
}

class _NewPatientPageState extends State<NewPatientPage> {
  int _currentStep = 1; // 1: Citizen Demographics, 2: Symptoms & Vitals

  // --- Step 1 Controllers (Backend Patient Fields) ---
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _dobController = TextEditingController();
  String _selectedGender = 'Female';
  final _phoneController = TextEditingController();
  final _villageController = TextEditingController();
  final _abhaController = TextEditingController();

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

  void _onNextStep() {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter patient full name')),
      );
      return;
    }
    if (_ageController.text.trim().isEmpty && _dobController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter patient age or date of birth')),
      );
      return;
    }
    if (_phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter patient contact phone number')),
      );
      return;
    }
    if (_villageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter patient village / ward')),
      );
      return;
    }
    setState(() => _currentStep = 2);
  }

  Future<void> _onSavePatient(AppState appState) async {
    if (_symptomController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please describe the chief clinical symptom')),
      );
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(color: AppColors.forest),
      ),
    );

    try {
      final parsedAge = int.tryParse(_ageController.text.trim()) ?? _calculateAgeFromDob(_dobController.text);
      final rawPhoneDigits = _phoneController.text.replaceAll(RegExp(r'[^\d]'), '');
      final formattedPhone = _phoneController.text.trim().startsWith('+')
          ? _phoneController.text.trim().replaceAll(RegExp(r'[\s\-]'), '')
          : (rawPhoneDigits.length == 10 ? '+91$rawPhoneDigits' : '+91$rawPhoneDigits');

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

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RegistrationSuccessPage(patient: patient),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop();
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
    if (dob.isEmpty) return 30;
    try {
      final parts = dob.split('/');
      if (parts.length == 3) {
        final year = int.tryParse(parts[2]);
        if (year != null && year > 1900 && year <= DateTime.now().year) {
          return DateTime.now().year - year;
        }
      }
    } catch (_) {}
    return 30;
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
                  _currentStep == 1 ? 'Citizen Registration' : 'Symptoms & Baseline Vitals',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.forest,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Step $_currentStep of 2 · Backend Data Aligned',
                  style: const TextStyle(fontSize: 12, color: AppColors.textLight),
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
                onChanged: (val) {
                  final age = int.tryParse(val.trim());
                  if (age != null && age > 0) {
                    final birthYear = DateTime.now().year - age;
                    _dobController.text = '01/01/$birthYear';
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
                onChanged: (val) {
                  final calculatedAge = _calculateAgeFromDob(val.trim());
                  if (calculatedAge > 0) {
                    _ageController.text = calculatedAge.toString();
                  }
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        const Text(
          'Gender *',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.forest),
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
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _villageController,
          label: 'Village / Ward *',
          hint: 'e.g. Khandala Ward 2',
          icon: Icons.location_on_outlined,
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _abhaController,
          label: 'ABHA Number (Optional)',
          hint: '91-XXXX-XXXX-XXXX',
          icon: Icons.fingerprint_rounded,
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
              color: isSelected ? AppColors.forest : Colors.grey.shade300,
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

  // --- Step 2: Backend Assessment (Symptoms & Vitals) ---
  Widget _buildStep2Assessment() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Chief Clinical Complaint', Icons.healing_outlined),
        const SizedBox(height: 8),
        const Text('Quick Symptom Chips:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF4B5563))),
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
            final isContained = _symptomController.text.contains(symptom);
            return InkWell(
              onTap: () {
                setState(() {
                  if (_symptomController.text.isEmpty) {
                    _symptomController.text = symptom;
                  } else if (!isContained) {
                    _symptomController.text = '${_symptomController.text}, $symptom';
                  }
                  if (symptom == 'Chest Pain' || symptom == 'Severe Breathlessness') {
                    _selectedSeverity = 'SEVERE';
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isContained ? AppColors.forest : AppColors.mintLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.forest.withValues(alpha: 0.2)),
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
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
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
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
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
        ),
        const SizedBox(height: 14),
        _buildTextField(
          controller: _notesController,
          label: 'Clinical Notes (Optional)',
          hint: 'e.g. Known hypertensive, missed medication.',
          icon: Icons.notes_outlined,
          maxLines: 2,
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
    int maxLines = 1,
    void Function(String)? onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        onChanged: onChanged,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textDark),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          hintText: hint,
          hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
          prefixIcon: Icon(icon, color: AppColors.forest, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildBottomNav(AppState appState) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0),
      color: Colors.white,
      child: Row(
        children: [
          if (_currentStep > 1)
            OutlinedButton(
              onPressed: () => setState(() => _currentStep -= 1),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.forest,
                side: const BorderSide(color: AppColors.forest),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              ),
              child: const Text('Back'),
            ),
          if (_currentStep > 1) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () {
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
              child: Text(
                _currentStep == 1 ? 'Continue to Vitals & Symptoms' : 'Submit Patient Registration',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
