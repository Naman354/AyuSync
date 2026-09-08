import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';

class AiTriagePage extends StatelessWidget {
  const AiTriagePage({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final triage = appState.currentTriageResult;
    final patient = appState.currentPatient ?? (appState.patients.isNotEmpty ? appState.patients.first : null);
    final assessment = appState.currentAssessment;

    if (triage == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Health Urgency & Guidance', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.forest)),
          backgroundColor: Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.forest, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.psychology_outlined, size: 64, color: AppColors.textLight),
              const SizedBox(height: 12),
              const Text('No checkup results available for this session.', style: TextStyle(color: AppColors.textMedium)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/home'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.forest, foregroundColor: Colors.white),
                child: const Text('Return to Dashboard'),
              ),
            ],
          ),
        ),
      );
    }

    final isUrgent = triage.urgencyLevel == 'URGENT';
    final isPriority = triage.urgencyLevel == 'PRIORITY';
    final urgencyColor = isUrgent ? AppColors.criticalRed : (isPriority ? AppColors.moderateOrange : AppColors.lowGreen);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Health Urgency & Guidance', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.forest, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.forest, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Patient Header
            if (patient != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD6E4DB)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.mintBanner,
                      radius: 20,
                      child: Text(patient.name[0], style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.forest)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(patient.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textDark)),
                          Text(
                            '${patient.age} yrs • ${patient.gender} • ${patient.village}'
                            '${assessment != null ? " • ${assessment.primarySymptom}" : ""}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textMedium),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 16),

            // AI Urgency Score Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: urgencyColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: urgencyColor.withValues(alpha: 0.3), width: 1.5),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Icon(Icons.auto_awesome_rounded, color: urgencyColor, size: 22),
                            const SizedBox(width: 8),
                            const Expanded(
                              child: Text(
                                'Urgency & Risk Assessment',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textDark),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: urgencyColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          triage.urgencyLevel,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '${triage.urgencyScore}',
                        style: TextStyle(fontSize: 52, fontWeight: FontWeight.w900, color: urgencyColor),
                      ),
                      const Text(
                        ' / 100',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textLight),
                      ),
                    ],
                  ),
                  const Text('Urgency Score (Out of 100)', style: TextStyle(fontSize: 12, color: AppColors.textMedium, fontWeight: FontWeight.w600)),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // Contributing Risk Factors (XAI)
            const Text(
              'Key Factors & Symptoms Considered',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.forest),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFD6E4DB)),
              ),
              child: Column(
                children: triage.contributingFactors.map((factor) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline_rounded, size: 18, color: AppColors.forest),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(factor, style: const TextStyle(fontSize: 13, color: AppColors.textDark, fontWeight: FontWeight.w500)),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 18),

            // Recommended Action & Reasoning
            const Text(
              'Recommended Action & Advice',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.forest),
            ),
            const SizedBox(height: 8),
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
                  Row(
                    children: [
                      const Icon(Icons.medical_services_outlined, size: 18, color: AppColors.forest),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          triage.recommendedAction,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textDark),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    triage.explanationText,
                    style: const TextStyle(fontSize: 13, color: AppColors.textMedium, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Proceed Action Button
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/worker-confirmation');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.forest,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  elevation: 2,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        'Review & Confirm Recommendation',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(Icons.arrow_forward_rounded, size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
