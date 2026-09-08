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
    final activePatient = (appState.currentPatient?.id == patient.id || appState.currentPatient?.name == patient.name)
        ? appState.currentPatient!
        : appState.patients.firstWhere(
            (p) => p.id == patient.id || (p.name == patient.name && p.phone == patient.phone),
            orElse: () => patient,
          );

    final isSynced = activePatient.isSynced;
    final isOnline = appState.isOnline;

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
                            tooltip: appState.translate('return_to_dashboard'),
                            onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/home', (r) => false),
                          ),
                          Expanded(
                            child: Text(
                              appState.translate('patient_registration_title'),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
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
                      Text(
                        appState.translate('reg_success_title'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        appState.translate('patient_id_label', args: {'id': activePatient.id}),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.9),
                          letterSpacing: 0.5,
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Offline / Online / Syncing Status Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: (isOnline && isSynced)
                              ? Colors.white.withValues(alpha: 0.2)
                              : (isOnline && !isSynced)
                                  ? const Color(0xFFE0F2FE).withValues(alpha: 0.95)
                                  : const Color(0xFFFEF3C7).withValues(alpha: 0.95),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: (isOnline && isSynced)
                                ? Colors.white.withValues(alpha: 0.4)
                                : (isOnline && !isSynced)
                                    ? const Color(0xFFBAE6FD)
                                    : const Color(0xFFFDE68A),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              (isOnline && isSynced)
                                  ? Icons.cloud_done_rounded
                                  : (isOnline && !isSynced)
                                      ? Icons.cloud_sync_rounded
                                      : Icons.offline_pin_rounded,
                              size: 16,
                              color: (isOnline && isSynced)
                                  ? Colors.white
                                  : (isOnline && !isSynced)
                                      ? const Color(0xFF0369A1)
                                      : const Color(0xFF92400E),
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                (isOnline && isSynced)
                                    ? appState.translate('reg_synced_desc')
                                    : (isOnline && !isSynced)
                                        ? appState.translate('reg_syncing_desc')
                                        : appState.translate('reg_offline_desc'),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: (isOnline && isSynced)
                                      ? Colors.white
                                      : (isOnline && !isSynced)
                                          ? const Color(0xFF0369A1)
                                          : const Color(0xFF92400E),
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
                              activePatient.name,
                              style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${activePatient.age} yrs • ${activePatient.gender} • ${appState.translate('village_prefix', args: {'village': activePatient.village})}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: Colors.white.withValues(alpha: 0.95),
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              appState.translate('phone_prefix', args: {'phone': activePatient.phone}),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.85),
                              ),
                            ),
                            if (activePatient.abhaId != null && activePatient.abhaId!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  appState.translate('abha_prefix', args: {'abha': activePatient.abhaId!}),
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
                            appState.setCurrentPatient(activePatient);
                            Navigator.pushNamed(context, '/ai-triage');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 2,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Flexible(
                                child: Text(
                                  appState.translate('proceed_to_triage'),
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.arrow_forward_rounded, size: 20),
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
                          label: Text(
                            appState.translate('register_another'),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                            overflow: TextOverflow.ellipsis,
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
                          child: Text(
                            appState.translate('return_to_dashboard'),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                            overflow: TextOverflow.ellipsis,
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
