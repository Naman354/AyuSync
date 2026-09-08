import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/assessment_model.dart';
import '../../../assessment/presentation/widgets/voice_input.dart';
import 'registration_success_page.dart';

class NewPatientPage extends StatefulWidget {
  const NewPatientPage({super.key});

  @override
  State<NewPatientPage> createState() => _NewPatientPageState();
}

class _NewPatientPageState extends State<NewPatientPage> {
  int _currentStep = 1; // 1: Demographics, 2: Basic Health, 3: Complaint & Vitals
  bool _isSaving = false;

  // --- Step 1 Controllers & State ---
  final _nameController = TextEditingController(text: '');
  final _dobController = TextEditingController(text: '');
  final _abhaController = TextEditingController(text: '');
  String? _selectedGender;
  final _phoneController = TextEditingController(text: '');
  final _emergencyPhoneController = TextEditingController(text: '');
  String? _selectedLanguage;
  final _villageController = TextEditingController(text: '');
  final _districtController = TextEditingController(text: '');
  String? _selectedState;
  final _pinController = TextEditingController(text: '');
  final _addressController = TextEditingController(text: '');

  // --- Step 2 Controllers & State ---
  String? _selectedBloodGroup;
  String? _selectedAllergy;
  final _existingConditionsController = TextEditingController(text: '');
  final _currentMedicationsController = TextEditingController(text: '');
  final _pastHistoryController = TextEditingController(text: '');

  // --- Step 3 Controllers & State ---
  String _selectedSeverity = 'Low'; // Low, Moderate, Critical
  String _duration = '3 Days';
  final _healthConcernController = TextEditingController(text: '');
  final _symptomsController = TextEditingController(text: '');
  final _observationsController = TextEditingController(text: '');

  // Vitals
  final _tempController = TextEditingController(text: '98.6');
  final _pulseController = TextEditingController(text: '72');
  final _respRateController = TextEditingController(text: '18');
  final _weightController = TextEditingController(text: '65');
  final _systolicController = TextEditingController(text: '120');
  final _diastolicController = TextEditingController(text: '80');
  final _spo2Controller = TextEditingController(text: '98');

  @override
  void dispose() {
    _nameController.dispose();
    _dobController.dispose();
    _abhaController.dispose();
    _phoneController.dispose();
    _emergencyPhoneController.dispose();
    _villageController.dispose();
    _districtController.dispose();
    _pinController.dispose();
    _addressController.dispose();
    _existingConditionsController.dispose();
    _currentMedicationsController.dispose();
    _pastHistoryController.dispose();
    _healthConcernController.dispose();
    _symptomsController.dispose();
    _observationsController.dispose();
    _tempController.dispose();
    _pulseController.dispose();
    _respRateController.dispose();
    _weightController.dispose();
    _systolicController.dispose();
    _diastolicController.dispose();
    _spo2Controller.dispose();
    super.dispose();
  }

  void _onNextStep() {
    if (_currentStep == 1) {
      if (_nameController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter patient full name')),
        );
        return;
      }
      setState(() => _currentStep = 2);
    } else if (_currentStep == 2) {
      setState(() => _currentStep = 3);
    }
  }

  void _onPreviousStep() {
    if (_currentStep > 1) {
      setState(() => _currentStep -= 1);
    } else {
      Navigator.pop(context);
    }
  }

  void _onSavePatient(AppState appState) async {
    if (_isSaving) return;
    setState(() => _isSaving = true);

    try {
      // 1. Register Patient with complete demographic and health history
      final age = _calculateAgeFromDob(_dobController.text);
      final patient = await appState.registerPatientAsync(
        name: _nameController.text.trim().isEmpty ? 'Citizen Patient' : _nameController.text.trim(),
        age: age,
        gender: _selectedGender ?? 'Female',
        phone: _phoneController.text.trim().isEmpty ? '+91 98765 43210' : '+91 ${_phoneController.text.trim()}',
        village: _villageController.text.trim().isEmpty ? 'Phulgaon' : _villageController.text.trim(),
        abhaId: _abhaController.text.trim().isNotEmpty ? _abhaController.text.trim() : null,
        bloodGroup: _selectedBloodGroup ?? 'O+',
        dob: _dobController.text.trim().isNotEmpty ? _dobController.text.trim() : null,
        emergencyContact: _emergencyPhoneController.text.trim().isNotEmpty ? _emergencyPhoneController.text.trim() : null,
        preferredLanguage: _selectedLanguage ?? 'Hindi',
        district: _districtController.text.trim().isNotEmpty ? _districtController.text.trim() : null,
        state: _selectedState ?? 'Chhattisgarh',
        pinCode: _pinController.text.trim().isNotEmpty ? _pinController.text.trim() : null,
        address: _addressController.text.trim().isNotEmpty ? _addressController.text.trim() : null,
        allergies: _selectedAllergy ?? 'None',
        existingConditions: _existingConditionsController.text.trim().isNotEmpty ? _existingConditionsController.text.trim() : null,
        currentMedications: _currentMedicationsController.text.trim().isNotEmpty ? _currentMedicationsController.text.trim() : null,
        pastHistory: _pastHistoryController.text.trim().isNotEmpty ? _pastHistoryController.text.trim() : null,
      );

      // 2. Create Assessment if symptoms/vitals entered
      final primarySymptomText = _symptomsController.text.trim().isNotEmpty
          ? _symptomsController.text.trim()
          : (_healthConcernController.text.trim().isNotEmpty
              ? _healthConcernController.text.trim()
              : 'General Health Assessment');

      final vitals = Vitals(
        temperature: double.tryParse(_tempController.text.trim()),
        systolicBp: int.tryParse(_systolicController.text.trim()),
        diastolicBp: int.tryParse(_diastolicController.text.trim()),
        pulseRate: int.tryParse(_pulseController.text.trim()),
        spo2: int.tryParse(_spo2Controller.text.trim()),
        respiratoryRate: int.tryParse(_respRateController.text.trim()),
        weight: double.tryParse(_weightController.text.trim()),
      );

      await appState.createAssessmentAsync(
        patientId: patient.id,
        primarySymptom: primarySymptomText,
        severity: _selectedSeverity.toUpperCase(),
        durationDays: int.tryParse(_duration.split(' ').first) ?? 3,
        vitals: vitals,
        clinicalNotes: _observationsController.text.trim().isNotEmpty
            ? _observationsController.text.trim()
            : 'Concerns: ${_healthConcernController.text.trim()}',
      );

      if (!mounted) return;

      // 3. Navigate to Success Screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => RegistrationSuccessPage(patient: patient),
        ),
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving patient: $e')),
        );
      }
    }
  }

  int _calculateAgeFromDob(String dob) {
    if (dob.isEmpty) return 32;
    try {
      final parts = dob.split('/');
      if (parts.length == 3) {
        final year = int.tryParse(parts[2]);
        if (year != null && year > 1900 && year <= DateTime.now().year) {
          return DateTime.now().year - year;
        }
      }
    } catch (_) {}
    return 32;
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context, listen: false);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Navigation Bar
            _buildAppBar(),

            // Step Content Scroll Area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_currentStep == 1) _buildStep1Demographics(),
                    if (_currentStep == 2) _buildStep2BasicHealth(),
                    if (_currentStep == 3) _buildStep3ComplaintAndVitals(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Bottom Floating Next/Save Button
            _buildBottomActionBar(appState),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 10.0),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.forest, size: 22),
            onPressed: _onPreviousStep,
          ),
          const SizedBox(width: 4),
          const Expanded(
            child: Text(
              'Register New Patient',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.forest,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.mintLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'Step $_currentStep of 3',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppColors.forest,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // STEP 1: Identification, Contact, Residence
  // ==========================================
  Widget _buildStep1Demographics() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section 1: Basic Details
        _buildSectionHeader('Basic Details'),
        const SizedBox(height: 6),
        _buildCardContainer(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildFormField(
                    label: 'Full Name:',
                    controller: _nameController,
                    placeholder: 'Enter Full Name',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildFormField(
                    label: 'Date Of Birth:',
                    controller: _dobController,
                    placeholder: 'MM/DD/YYYY',
                    keyboardType: TextInputType.datetime,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildFormField(
                    label: 'ABHA ID (Optional) :',
                    controller: _abhaController,
                    placeholder: 'Enter ABHA ID',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildDropdownField(
                    label: 'Gender:',
                    value: _selectedGender,
                    items: const ['Female', 'Male', 'Other'],
                    placeholder: 'Choose',
                    onChanged: (val) => setState(() => _selectedGender = val),
                  ),
                ),
              ],
            ),
          ],
        ),

        const SizedBox(height: 18),

        // Section 2: Phone & Contact
        _buildSectionHeader('Phone & Contact'),
        const SizedBox(height: 6),
        _buildCardContainer(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildPhoneField(
                    label: 'Mobile Number:',
                    controller: _phoneController,
                    placeholder: '2222-888-717',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildPhoneField(
                    label: 'Emergency Contact Number:',
                    controller: _emergencyPhoneController,
                    placeholder: '5555-888-777',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildDropdownField(
              label: 'Preferred Language:',
              value: _selectedLanguage,
              items: const ['Hindi', 'Chhattisgarhi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu'],
              placeholder: 'Choose',
              onChanged: (val) => setState(() => _selectedLanguage = val),
            ),
          ],
        ),

        const SizedBox(height: 18),

        // Section 3: Address & Location
        _buildSectionHeader('Address & Location'),
        const SizedBox(height: 6),
        _buildCardContainer(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildFormField(
                    label: 'Village:',
                    controller: _villageController,
                    placeholder: 'Eg. Kanpur',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildFormField(
                    label: 'District:',
                    controller: _districtController,
                    placeholder: 'Eg. Bilaspur',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildDropdownField(
                    label: 'State:',
                    value: _selectedState,
                    items: const [
                      'Chhattisgarh',
                      'Andhra Pradesh',
                      'Arunachal Pradesh',
                      'Assam',
                      'Bihar',
                      'Goa',
                      'Gujarat',
                      'Haryana',
                      'Himachal Pradesh',
                      'Jharkhand',
                      'Karnataka',
                      'Kerala',
                      'Madhya Pradesh',
                      'Maharashtra',
                      'Manipur',
                      'Meghalaya',
                      'Mizoram',
                      'Nagaland',
                      'Odisha',
                      'Punjab',
                      'Rajasthan',
                      'Sikkim',
                      'Tamil Nadu',
                      'Telangana',
                      'Tripura',
                      'Uttar Pradesh',
                      'Uttarakhand',
                      'West Bengal',
                      'Delhi',
                      'Jammu & Kashmir',
                      'Ladakh',
                      'Other',
                    ],
                    placeholder: 'Choose',
                    onChanged: (val) => setState(() => _selectedState = val),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildFormField(
              label: 'PIN Code :',
              controller: _pinController,
              placeholder: 'Enter PIN Code',
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            _buildFormField(
              label: 'Address / Landmark:',
              controller: _addressController,
              placeholder: 'Enter Complete Address',
            ),
          ],
        ),
      ],
    );
  }

  // ==========================================
  // STEP 2: Basic Health Information
  // ==========================================
  Widget _buildStep2BasicHealth() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Medical History & Health Details'),
        const SizedBox(height: 6),
        _buildCardContainer(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildDropdownField(
                    label: 'Blood Group:',
                    value: _selectedBloodGroup,
                    items: const ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                    placeholder: 'Eg. O+',
                    onChanged: (val) => setState(() => _selectedBloodGroup = val),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildDropdownField(
                    label: 'Known Allergies:',
                    value: _selectedAllergy,
                    items: const ['None', 'Eg. Pollen', 'Penicillin', 'Dust / Asthma', 'Peanuts', 'Sulfa Drugs', 'Other'],
                    placeholder: 'Eg. Pollen',
                    onChanged: (val) => setState(() => _selectedAllergy = val),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildTextAreaField(
              label: 'Known Illnesses / Long-term Conditions:',
              controller: _existingConditionsController,
              placeholder: 'e.g. Hypertension, Type-2 Diabetes, Asthma...',
              rows: 3,
            ),
            const SizedBox(height: 16),
            _buildTextAreaField(
              label: 'Current Medications:',
              controller: _currentMedicationsController,
              placeholder: 'e.g. Tab Amlodipine 5mg (1-0-0), Metformin 500mg...',
              rows: 3,
            ),
            const SizedBox(height: 16),
            _buildTextAreaField(
              label: 'Past Surgeries / Major Illnesses:',
              controller: _pastHistoryController,
              placeholder: 'e.g. Prior surgeries, hospitalizations, chronic ailments...',
              rows: 3,
            ),
          ],
        ),
      ],
    );
  }

  // ==========================================
  // STEP 3: Presenting Complaint & Vitals
  // ==========================================
  Widget _buildStep3ComplaintAndVitals() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section 1: Current Health Problem & Symptoms
        _buildSectionHeader('Current Health Problem & Symptoms'),
        const SizedBox(height: 6),
        _buildCardContainer(
          children: [
            // Severity Selection
            const Text(
              'Severity:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                _buildSeverityRadio('Low', AppColors.lowGreen),
                const SizedBox(width: 16),
                _buildSeverityRadio('Moderate', const Color(0xFF6B7280)),
                const SizedBox(width: 16),
                _buildSeverityRadio('Critical', AppColors.criticalRed),
              ],
            ),
            const SizedBox(height: 14),

            // Duration of Symptoms
            _buildDropdownField(
              label: 'Duration Of Symptoms:',
              value: _duration,
              items: const ['1 Day', '2 Days', '3 Days', '4 Days', '5 Days', '1 Week', '2 Weeks', 'More than 2 weeks'],
              placeholder: 'Eg. 3 Days',
              onChanged: (val) => setState(() => _duration = val ?? '3 Days'),
            ),
            const SizedBox(height: 14),

            // Primary Health Concern
            _buildTextAreaField(
              label: 'Main Problem (in patient\'s words):',
              controller: _healthConcernController,
              placeholder: 'Chief complaint in patient words...',
              rows: 2,
            ),
            const SizedBox(height: 14),

            // Symptoms with Voice Input Integration
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Symptoms:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                VoiceInputWidget(
                  onTranscriptReady: (spokenText) {
                    setState(() {
                      if (_symptomsController.text.isEmpty) {
                        _symptomsController.text = spokenText;
                      } else {
                        _symptomsController.text += ' $spokenText';
                      }
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 6),
            _buildInputContainer(
              height: 70,
              child: TextField(
                controller: _symptomsController,
                maxLines: 3,
                style: const TextStyle(fontSize: 13, color: AppColors.textDark),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  hintText: 'Type symptoms or tap mic to speak in Hindi/Chhattisgarhi...',
                  hintStyle: TextStyle(fontSize: 12, color: Color(0xFF6B7F72)),
                  isDense: true,
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Relevant Observations
            _buildTextAreaField(
              label: 'Physical Observations / Notes:',
              controller: _observationsController,
              placeholder: 'Physical appearance, pallor, edema, mobility...',
              rows: 2,
            ),
          ],
        ),

        const SizedBox(height: 18),

        // Section 2: Vital Signs
        _buildSectionHeader('Vital Signs (Health Readings)'),
        const SizedBox(height: 6),
        _buildCardContainer(
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildStepperField(
                    label: 'Temperature (°F/°C):',
                    controller: _tempController,
                    placeholder: '98.6',
                    onIncrement: () {
                      final val = (double.tryParse(_tempController.text) ?? 98.6) + 0.2;
                      _tempController.text = val.toStringAsFixed(1);
                    },
                    onDecrement: () {
                      final val = (double.tryParse(_tempController.text) ?? 98.6) - 0.2;
                      _tempController.text = val.toStringAsFixed(1);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStepperField(
                    label: 'Pulse Rate (bpm):',
                    controller: _pulseController,
                    placeholder: '72',
                    onIncrement: () {
                      final val = (int.tryParse(_pulseController.text) ?? 72) + 1;
                      _pulseController.text = val.toString();
                    },
                    onDecrement: () {
                      final val = (int.tryParse(_pulseController.text) ?? 72) - 1;
                      _pulseController.text = val.toString();
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStepperField(
                    label: 'Breathing Rate (breaths/min):',
                    controller: _respRateController,
                    placeholder: '18',
                    onIncrement: () {
                      final val = (int.tryParse(_respRateController.text) ?? 18) + 1;
                      _respRateController.text = val.toString();
                    },
                    onDecrement: () {
                      final val = (int.tryParse(_respRateController.text) ?? 18) - 1;
                      _respRateController.text = val.toString();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStepperField(
                    label: 'Weight (kg):',
                    controller: _weightController,
                    placeholder: '65.0',
                    onIncrement: () {
                      final val = (double.tryParse(_weightController.text) ?? 65.0) + 0.5;
                      _weightController.text = val.toStringAsFixed(1);
                    },
                    onDecrement: () {
                      final val = (double.tryParse(_weightController.text) ?? 65.0) - 0.5;
                      _weightController.text = val.toStringAsFixed(1);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Blood Pressure (High / Low):',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textDark,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      _buildInputContainer(
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _systolicController,
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textDark),
                                decoration: const InputDecoration(
                                  border: InputBorder.none,
                                  hintText: '120',
                                  hintStyle: TextStyle(fontSize: 11, color: Color(0xFF6B7F72)),
                                  isDense: true,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                            const Text('/', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF6B7F72))),
                            Expanded(
                              child: TextField(
                                controller: _diastolicController,
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textDark),
                                decoration: const InputDecoration(
                                  border: InputBorder.none,
                                  hintText: '80',
                                  hintStyle: TextStyle(fontSize: 11, color: Color(0xFF6B7F72)),
                                  isDense: true,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                            const Text(' mmHg', style: TextStyle(fontSize: 9, color: Color(0xFF6B7F72), fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildFormField(
                    label: 'Oxygen Level - SpO₂ (%):',
                    controller: _spo2Controller,
                    placeholder: '98%',
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  // ==========================================
  // Helper UI Builders
  // ==========================================

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.forest,
      ),
    );
  }

  Widget _buildCardContainer({required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD6E4DB), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildInputContainer({required Widget child, double height = 38}) {
    return Container(
      height: height,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      alignment: Alignment.centerLeft,
      decoration: BoxDecoration(
        color: AppColors.inputBg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: child,
    );
  }

  Widget _buildFormField({
    required String label,
    required TextEditingController controller,
    required String placeholder,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 4),
        _buildInputContainer(
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: const TextStyle(fontSize: 12, color: AppColors.textDark),
            decoration: InputDecoration(
              border: InputBorder.none,
              hintText: placeholder,
              hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF6B7F72)),
              isDense: true,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPhoneField({
    required String label,
    required TextEditingController controller,
    required String placeholder,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 4),
        _buildInputContainer(
          child: Row(
            children: [
              const Text(
                '+91 ▾',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textDark),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: TextField(
                  controller: controller,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(fontSize: 12, color: AppColors.textDark),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    hintText: placeholder,
                    hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF6B7F72)),
                    isDense: true,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required String placeholder,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 4),
        _buildInputContainer(
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: (value != null && items.contains(value)) ? value : null,
              isExpanded: true,
              hint: Text(
                placeholder,
                style: const TextStyle(fontSize: 11, color: Color(0xFF6B7F72)),
              ),
              icon: const Icon(Icons.arrow_drop_down, color: AppColors.forest, size: 20),
              style: const TextStyle(fontSize: 12, color: AppColors.textDark, fontWeight: FontWeight.w600),
              dropdownColor: Colors.white,
              onChanged: onChanged,
              items: items.map((item) {
                return DropdownMenuItem(
                  value: item,
                  child: Text(item),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextAreaField({
    required String label,
    required TextEditingController controller,
    required String placeholder,
    int rows = 3,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          height: rows * 26.0,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFE5ECE7),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFB8C8BD), width: 0.8),
          ),
          child: TextField(
            controller: controller,
            maxLines: rows,
            style: const TextStyle(fontSize: 12, color: AppColors.textDark),
            decoration: InputDecoration(
              border: InputBorder.none,
              hintText: placeholder,
              hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF6B7F72)),
              isDense: true,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSeverityRadio(String title, Color color) {
    final isSelected = _selectedSeverity == title;
    return InkWell(
      onTap: () => setState(() => _selectedSeverity = title),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepperField({
    required String label,
    required TextEditingController controller,
    required String placeholder,
    required VoidCallback onIncrement,
    required VoidCallback onDecrement,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 4),
        _buildInputContainer(
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(fontSize: 12, color: AppColors.textDark, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    hintText: placeholder,
                    hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF6B7F72)),
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InkWell(
                    onTap: onDecrement,
                    borderRadius: BorderRadius.circular(4),
                    child: const Padding(
                      padding: EdgeInsets.all(2.0),
                      child: Icon(Icons.remove_circle_outline_rounded, size: 16, color: AppColors.forest),
                    ),
                  ),
                  const SizedBox(width: 2),
                  InkWell(
                    onTap: onIncrement,
                    borderRadius: BorderRadius.circular(4),
                    child: const Padding(
                      padding: EdgeInsets.all(2.0),
                      child: Icon(Icons.add_circle_outline_rounded, size: 16, color: AppColors.forest),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // Bottom Action Bar
  // ==========================================
  Widget _buildBottomActionBar(AppState appState) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x0C000000),
            blurRadius: 10,
            offset: Offset(0, -4),
          )
        ],
      ),
      child: Center(
        child: _currentStep < 3
            ? InkWell(
                onTap: _onNextStep,
                borderRadius: BorderRadius.circular(30),
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  decoration: BoxDecoration(
                    color: AppColors.mintPill,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Next',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.forest,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.forest,
                        ),
                        child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                      ),
                    ],
                  ),
                ),
              )
            : InkWell(
                onTap: _isSaving ? null : () => _onSavePatient(appState),
                borderRadius: BorderRadius.circular(30),
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  decoration: BoxDecoration(
                    color: AppColors.forest,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.forest.withValues(alpha: 0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      )
                    ],
                  ),
                  child: Center(
                    child: _isSaving
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                          )
                        : const Text(
                            'Save Patient',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                  ),
                ),
              ),
      ),
    );
  }
}
