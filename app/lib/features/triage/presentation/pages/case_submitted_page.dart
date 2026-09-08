import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';

class CaseSubmittedPage extends StatelessWidget {
  const CaseSubmittedPage({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final referral = appState.lastSubmittedCase;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Referral Dispatched', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 48,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: const Icon(
                            Icons.check_circle_rounded,
                            size: 64,
                            color: Color(0xFF16A34A),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Referral Dispatched Successfully!',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textDark),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Case transmitted to ${referral?.facility.name ?? "Receiving Facility"} and placed on Doctor Live Queue.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 14, color: Color(0xFF4B5563), height: 1.4),
                      ),
                      const SizedBox(height: 24),

                      // Referral Token Box
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            const Text('Official Referral Tracking ID', style: TextStyle(color: Color(0xFF6B7280), fontSize: 11, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            Text(
                              referral?.referralId ?? 'REF-889412',
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.forest, letterSpacing: 1),
                            ),
                            const Divider(height: 20, color: Color(0xFFE5E7EB)),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Patient:', style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                                Text(referral?.patientName ?? '-', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Facility:', style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                                Text(referral?.facility.name ?? 'District Hospital', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Triage Urgency:', style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                                Text(
                                  referral?.triageUrgency ?? 'PRIORITY',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: (referral?.triageUrgency == 'EMERGENCY' || referral?.triageUrgency == 'CRITICAL')
                                        ? const Color(0xFFDC2626)
                                        : const Color(0xFFD97706),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Primary Action: View Slip
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.forest,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        onPressed: () {
                          Navigator.pushReplacementNamed(context, '/triage/case_status');
                        },
                        icon: const Icon(Icons.receipt_long_rounded),
                        label: const Text(
                          'View Referral Slip & Live Status',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Secondary Action: Return Home
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF4B5563),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          side: const BorderSide(color: Color(0xFFD1D5DB)),
                        ),
                        onPressed: () {
                          Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (route) => false);
                        },
                        icon: const Icon(Icons.home_rounded),
                        label: const Text(
                          'Return to Home Dashboard',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ),
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

