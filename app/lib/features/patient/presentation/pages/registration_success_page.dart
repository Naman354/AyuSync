import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/models/patient_model.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';

class RegistrationSuccessPage extends StatelessWidget {
  final Patient patient;

  const RegistrationSuccessPage({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isOnline = appState.isOnline && patient.isSynced;

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 32,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    children: [
                      // Top Bar
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.close_rounded, color: Colors.white, size: 24),
                            tooltip: 'Return to Dashboard',
                            onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/home', (r) => false),
                          ),
                          const Expanded(
                            child: Text(
                              'Patient Registration',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 48), // Balance close button
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Large White Circle with Checkmark
                      Container(
                        width: 110,
                        height: 110,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.15),
                          border: Border.all(color: Colors.white, width: 4),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.check_rounded,
                            color: Colors.white,
                            size: 64,
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Success Title
                      const Text(
                        'Registration Successful',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Patient ID: ${patient.id}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.9),
                          letterSpacing: 0.5,
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Offline / Online Status Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isOnline
                              ? Colors.white.withValues(alpha: 0.2)
                              : const Color(0xFFFEF3C7).withValues(alpha: 0.95),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isOnline ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFFDE68A),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isOnline ? Icons.cloud_done_rounded : Icons.offline_pin_rounded,
                              size: 16,
                              color: isOnline ? Colors.white : const Color(0xFF92400E),
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                isOnline
                                    ? 'Synchronized with Central Health Registry'
                                    : 'Saved locally in phone database · Queued to sync',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isOnline ? Colors.white : const Color(0xFF92400E),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 18),

                      // Patient Summary Card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 1.5),
                        ),
                        child: Column(
                          children: [
                            Text(
                              patient.name,
                              style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${patient.age} yrs • ${patient.gender} • Village: ${patient.village}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: Colors.white.withValues(alpha: 0.95),
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Phone: ${patient.phone}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.85),
                              ),
                            ),
                            if (patient.abhaId != null && patient.abhaId!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'ABHA ID: ${patient.abhaId}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),

                      const Spacer(),
                      const SizedBox(height: 20),

                      // Action 1: Proceed to AI Triage & Referral
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            appState.setCurrentPatient(patient);
                            Navigator.pushNamed(context, '/ai-triage');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 2,
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Proceed to AI Triage & Referral',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward_rounded, size: 20),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Action 2: Register Another Patient (Crucial for Field Camps / Immunization drives)
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pushReplacementNamed(context, '/new-patient');
                          },
                          icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
                          label: const Text(
                            'Register Another Patient',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.mintLight,
                            foregroundColor: AppColors.forest,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Action 3: Return to Dashboard
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: OutlinedButton(
                          onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/home', (r) => false),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.white, width: 1.5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Text(
                            'Return to Dashboard',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
