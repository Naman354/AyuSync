import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';

class SyncQueuePage extends StatefulWidget {
  const SyncQueuePage({super.key});

  @override
  State<SyncQueuePage> createState() => _SyncQueuePageState();
}

class _SyncQueuePageState extends State<SyncQueuePage> {
  bool _isSyncing = false;

  void _triggerSync() async {
    setState(() => _isSyncing = true);
    final appState = Provider.of<AppState>(context, listen: false);

    // If currently marked offline, auto-switch to online for this sync
    if (!appState.isOnline) {
      appState.toggleOnlineStatus();
    }

    final success = await appState.syncAllQueueItems();

    if (!mounted) return;
    setState(() => _isSyncing = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Sync & Upload Successful! All local patient records uploaded to server.'),
          backgroundColor: AppColors.forest,
          duration: Duration(seconds: 3),
        ),
      );

      // If an assessment was recently created, proceed directly to AI Triage
      if (appState.currentAssessment != null) {
        await Future.delayed(const Duration(milliseconds: 500));
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/triage/ai_result');
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(appState.errorMessage ?? 'Sync encountered an issue. Check connection and try again.'),
          backgroundColor: Colors.red.shade700,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final items = appState.syncQueue;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Offline Sync Queue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Top Status Header
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.white,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: appState.isOnline ? Colors.green.shade50 : Colors.amber.shade50,
                  child: Icon(
                    appState.isOnline ? Icons.cloud_done : Icons.cloud_off,
                    color: appState.isOnline ? Colors.green : Colors.amber.shade800,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appState.isOnline ? 'Network Connected (Ready to Sync)' : 'Offline (Local Cache Active)',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${items.length} Pending Mutations in SQLite Queue',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Items List
          Expanded(
            child: items.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
                        const SizedBox(height: 14),
                        const Text(
                          'Sync Queue is Empty',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'All offline records are fully synchronized.',
                          style: TextStyle(color: Colors.grey),
                        ),
                        const SizedBox(height: 24),
                        if (appState.currentAssessment != null)
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.forest,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                            onPressed: () {
                              Navigator.pushReplacementNamed(context, '/triage/ai_result');
                            },
                            icon: const Icon(Icons.auto_awesome),
                            label: const Text('Proceed to AI Clinical Triage'),
                          ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16.0),
                    itemCount: items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      return Card(
                        elevation: 0,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: const BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(14.0),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.mintLight,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  item.entityType == 'PATIENT'
                                      ? Icons.person_add
                                      : (item.entityType == 'ASSESSMENT' ? Icons.healing : Icons.assignment),
                                  color: AppColors.forest,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${item.entityType} [${item.action}]',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      item.description,
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: item.status == 'SYNCING'
                                      ? const Color(0xFFEFF6FF)
                                      : const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  item.status,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: item.status == 'SYNCING' ? const Color(0xFF1D4ED8) : const Color(0xFF92400E),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.forest,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    onPressed: (items.isEmpty || _isSyncing) ? null : _triggerSync,
                    icon: _isSyncing
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.cloud_upload_rounded),
                    label: Text(
                      _isSyncing ? 'Syncing...' : 'Sync / Upload Queue Now',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF4B5563),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      side: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    onPressed: () => Navigator.pushReplacementNamed(context, '/dashboard'),
                    icon: const Icon(Icons.home_outlined, size: 18),
                    label: const Text(
                      'Back to Home Dashboard',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
