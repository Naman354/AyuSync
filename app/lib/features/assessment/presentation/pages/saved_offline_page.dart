import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';

class SavedOfflinePage extends StatelessWidget {
  const SavedOfflinePage({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final pendingCount = appState.syncQueue.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Saved to Offline Storage', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.forest, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(22),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.offline_pin_rounded,
                    size: 64,
                    color: Color(0xFFD97706),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Assessment Saved Offline',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textDark),
              ),
              const SizedBox(height: 10),
              const Text(
                'Your assessment data is safely recorded in the local phone database. No internet connection was detected.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Color(0xFF4B5563), height: 1.4),
              ),
              const SizedBox(height: 24),

              // Queue Status Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.pending_actions_rounded, color: Color(0xFFD97706), size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Offline Sync Queue', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textDark)),
                          const SizedBox(height: 2),
                          Text(
                            '$pendingCount items awaiting mobile network',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Navigate to Sync Queue
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.forest,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.pushReplacementNamed(context, '/sync_queue');
                },
                icon: const Icon(Icons.sync_rounded),
                label: const Text(
                  'View Offline Sync Queue',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),

              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.forest,
                  side: const BorderSide(color: AppColors.forest, width: 1.2),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  Navigator.pushReplacementNamed(context, '/dashboard');
                },
                icon: const Icon(Icons.home_outlined),
                label: const Text(
                  'Return to Home Dashboard',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
