import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/patient_model.dart';
import '../../../followup/presentation/pages/followup_task_details_page.dart';

class PatientDetailsPage extends StatefulWidget {
  const PatientDetailsPage({super.key});

  @override
  State<PatientDetailsPage> createState() => _PatientDetailsPageState();
}

class _PatientDetailsPageState extends State<PatientDetailsPage> {
  bool _isLoadingTimeline = false;
  Map<String, dynamic>? _timeline;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTimeline();
    });
  }

  Future<void> _loadTimeline() async {
    final appState = Provider.of<AppState>(context, listen: false);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);
    if (patient == null) return;

    setState(() => _isLoadingTimeline = true);
    try {
      final data = await appState.fetchPatientTimeline(patient.id);
      if (mounted) {
        setState(() {
          _timeline = data;
          _isLoadingTimeline = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingTimeline = false);
    }
  }

  void _showAddConditionDialog(AppState appState, Patient patient) {
    final nameController = TextEditingController();
    String conditionStatus = 'ACTIVE';

    final commonConditions = [
      'Hypertension (High BP)',
      'Type 2 Diabetes Mellitus',
      'Chronic Asthma / COPD',
      'Severe Anemia',
      'Gestational Diabetes',
      'Hypothyroidism',
      'Ischemic Heart Disease',
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.healing_rounded, color: AppColors.forest),
              SizedBox(width: 8),
              Text('Add Medical Condition', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Select or type known diagnosed condition:', style: TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: commonConditions.take(4).map((cond) {
                    return InkWell(
                      onTap: () {
                        setDialogState(() {
                          nameController.text = cond;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.mintLight,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.forest.withValues(alpha: 0.2)),
                        ),
                        child: Text(cond, style: const TextStyle(fontSize: 11, color: AppColors.forest, fontWeight: FontWeight.w600)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: 'Condition Name',
                    hintText: 'e.g. Chronic Kidney Disease',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Clinical Status:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: conditionStatus,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'ACTIVE', child: Text('ACTIVE (Currently Symptomatic / Under Treatment)')),
                    DropdownMenuItem(value: 'CONTROLLED', child: Text('CONTROLLED (Stable on Maintenance)')),
                    DropdownMenuItem(value: 'RESOLVED', child: Text('RESOLVED (Cured / Inactive)')),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() => conditionStatus = val);
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () async {
                final name = nameController.text.trim();
                if (name.isEmpty) return;
                Navigator.pop(ctx);
                await appState.addPatientCondition(patient.id, name: name, status: conditionStatus);
                _loadTimeline();
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('✅ Condition "$name" added to patient profile!'),
                    backgroundColor: const Color(0xFF16A34A),
                  ),
                );
              },
              child: const Text('Save Condition'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);

    if (patient == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Patient Details')),
        body: const Center(child: Text('No patient selected')),
      );
    }

    final rawConditions = _timeline?['conditions'] as List<dynamic>? ?? [];
    final rawEncounters = _timeline?['encounters'] as List<dynamic>? ?? [];
    final patientTasks = appState.followUpTasks.where((t) => t.patientId == patient.id || t.patientName == patient.name).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(patient.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Reload Timeline',
            onPressed: _loadTimeline,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Patient Demographics & ABHA Identity Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppColors.forest.withValues(alpha: 0.15),
                        child: Text(
                          patient.name.isNotEmpty ? patient.name[0].toUpperCase() : 'P',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.forest),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              patient.name,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textDark),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '${patient.age} Yrs • ${patient.gender} • ${patient.village}',
                              style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Phone: ${patient.phone}',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: Color(0xFFF3F4F6)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified_user_outlined, size: 14, color: Color(0xFF2563EB)),
                            const SizedBox(width: 6),
                            Text(
                              'ABHA: ${patient.abhaId != null && patient.abhaId!.isNotEmpty ? patient.abhaId : "Not Linked"}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF1D4ED8)),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: patient.isSynced ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          patient.isSynced ? 'Synced Online' : 'Cached Offline',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: patient.isSynced ? const Color(0xFF166534) : const Color(0xFF92400E),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 2. Past Medical History / Known Conditions Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.favorite_outline_rounded, color: Color(0xFFE11D48), size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Past Medical History',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textDark),
                      ),
                      const Spacer(),
                      InkWell(
                        onTap: () => _showAddConditionDialog(appState, patient),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.mintLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.add, size: 14, color: AppColors.forest),
                              SizedBox(width: 4),
                              Text('Add', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.forest)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (rawConditions.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Text(
                        'No known pre-existing medical conditions recorded. Tap "+ Add" to record chronic diagnoses.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: rawConditions.map((cond) {
                        final name = cond['name']?.toString() ?? 'Condition';
                        final status = cond['status']?.toString() ?? 'ACTIVE';
                        final isActive = status.toUpperCase() == 'ACTIVE';

                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: isActive ? const Color(0xFFFFF1F2) : const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isActive ? const Color(0xFFFECDD3) : const Color(0xFFBBF7D0),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                name,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isActive ? const Color(0xFFBE123C) : const Color(0xFF15803D),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  status,
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: isActive ? const Color(0xFFBE123C) : const Color(0xFF15803D),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 3. Care Continuity / Follow-up Tasks for this patient
            if (patientTasks.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.assignment_turned_in_outlined, color: AppColors.forest, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Care Gap Follow-Ups (${patientTasks.length})',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textDark),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Column(
                      children: patientTasks.map((task) {
                        return InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => FollowUpTaskDetailsPage(task: task)),
                            );
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(task.reason, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                      Text(task.notes, style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)), maxLines: 1),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: task.isCompleted ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    task.status,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: task.isCompleted ? const Color(0xFF166534) : const Color(0xFF92400E),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 4. Clinical Timeline / Recent Encounters
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.history_edu_rounded, color: Color(0xFF4F46E5), size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Clinical Encounters & Timeline',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textDark),
                      ),
                      const Spacer(),
                      if (_isLoadingTimeline)
                        const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (rawEncounters.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Text(
                        'No previous clinical encounters or referrals recorded yet.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                    )
                  else
                    Column(
                      children: rawEncounters.take(3).map((enc) {
                        final type = enc['type']?.toString() ?? 'Triage Assessment';
                        final created = enc['createdAt']?.toString() ?? '';
                        final formattedDate = created.isNotEmpty ? created.split('T').first : 'Recent';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEEF2FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.monitor_heart_outlined, color: Color(0xFF4F46E5), size: 18),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(type, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                                    Text('Date: $formattedDate', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 5. Next Step Action Button -> Symptoms + Vitals Form
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: () {
                appState.selectPatient(patient);
                Navigator.pushNamed(context, '/assessment/form');
              },
              icon: const Icon(Icons.medical_services_outlined),
              label: const Text(
                'Start Clinical Triage Assessment',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 10),

            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              onPressed: () {
                Navigator.pushReplacementNamed(context, '/dashboard');
              },
              icon: const Icon(Icons.home_outlined, color: Color(0xFF4B5563)),
              label: const Text('Back to Home Dashboard', style: TextStyle(color: Color(0xFF4B5563))),
            ),
          ],
        ),
      ),
    );
  }
}
