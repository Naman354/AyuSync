import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/followup_model.dart';
import '../../../../core/models/patient_model.dart';
import '../../../../core/network/network_quality_service.dart';
import '../../../../core/localization/app_language.dart';
import '../../../followup/presentation/pages/followup_task_details_page.dart';
import '../../../../core/widgets/subtle_background_scaffold.dart';

class HomeDashboardPage extends StatefulWidget {
  const HomeDashboardPage({super.key});

  @override
  State<HomeDashboardPage> createState() => _HomeDashboardPageState();
}

class _HomeDashboardPageState extends State<HomeDashboardPage> {
  String _taskFilter = 'TODAY'; // TODAY, OVERDUE, ALL, COMPLETED
  int _selectedDateIndex = 2; // Default to Today in date strip
  late final List<Map<String, dynamic>> _dateStrip;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _dateStrip = [];
    const weekdayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    for (int i = -2; i <= 3; i++) {
      final d = now.add(Duration(days: i));
      _dateStrip.add({
        'day': d.day.toString(),
        'weekday': weekdayNames[d.weekday - 1],
        'date': d,
        'isToday': i == 0,
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SubtleHealthcareBackground(
        type: BackgroundIllustrationType.medicalPattern,
        opacity: 0.05,
        backgroundColor: const Color(0xFFF8FAFC),
        child: SafeArea(
          child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Worker Identity & Top Header
              _buildHeader(context, appState),

              const SizedBox(height: 12),

              // 2. Connectivity & Sync Status Strip
              _buildSyncBar(context, appState),

              const SizedBox(height: 12),

              // 3. Overdue Clinical Alert (Conditional)
              _buildOverdueAlert(context, appState),

              const SizedBox(height: 14),

              // 4. Glancing Field Metrics Summary Pulse
              _buildMetricsSummary(context, appState),

              const SizedBox(height: 16),

              // 5. High-Impact Primary Actions
              _buildPrimaryActions(context, appState),

              const SizedBox(height: 20),

              // 6. Unified Today's Schedule & Care Gaps
              _buildUnifiedTasksSection(context, appState),

              const SizedBox(height: 20),

              // 7. Recent Patient Encounters
              _buildRecentPatientsSection(context, appState),

              const SizedBox(height: 80), // Clearance for floating button
            ],
          ),
        ),
      ),
    ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.forest,
        foregroundColor: Colors.white,
        elevation: 4,
        icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
        label: Text(
          appState.translate('action_register'),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.2),
        ),
        onPressed: () => Navigator.pushNamed(context, '/new-patient'),
      ),
    );
  }

  // 1. Top Header: Warm greeting, worker name, center, and avatar
  Widget _buildHeader(BuildContext context, AppState appState) {
    final firstName = appState.workerName.split(' ').first;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // ASHA Worker Badge / Avatar
          GestureDetector(
            onTap: () => _showWorkerProfileDialog(context, appState),
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: const Color(0xFFE8F5E9),
                  child: Text(
                    firstName.isNotEmpty ? firstName[0].toUpperCase() : 'A',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.forest,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: appState.isOnline
                          ? const Color(0xFF16A34A)
                          : (appState.networkStatus == NetworkStatus.poor
                              ? const Color(0xFFD97706)
                              : const Color(0xFFDC2626)),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Greeting & Workplace
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  appState.workerName,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF64748B)),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        appState.workerCenter,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          // Language Switcher Action
          InkWell(
            onTap: () => _showWorkerProfileDialog(context, appState),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              height: 38,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.forest.withValues(alpha: 0.2)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.language_rounded, color: AppColors.forest, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    appState.currentLanguage.code.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppColors.forest,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 6),
          // Search Icon Action
          _buildHeaderAction(
            icon: Icons.search_rounded,
            tooltip: 'Search Patients',
            onTap: () => Navigator.pushNamed(context, '/patient-search'),
          ),
          const SizedBox(width: 6),
          // Sync / Settings Action
          _buildHeaderAction(
            icon: Icons.sync_rounded,
            tooltip: 'Offline Sync',
            badgeCount: appState.syncQueue.length,
            onTap: () => Navigator.pushNamed(context, '/sync-queue'),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderAction({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
    int badgeCount = 0,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF334155), size: 20),
          ),
          if (badgeCount > 0)
            Positioned(
              top: -4,
              right: -4,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Color(0xFFDC2626),
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                child: Text(
                  badgeCount > 9 ? '9+' : '$badgeCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // 2. Connectivity & Sync Status Bar
  Widget _buildSyncBar(BuildContext context, AppState appState) {
    final queueCount = appState.syncQueue.length;
    final isOnline = appState.isOnline;
    final networkStatus = appState.networkStatus;
    final isManual = appState.isManualOverride;

    // Determine visual style according to network quality and state
    Color bg;
    Color border;
    Color iconColor;
    IconData icon;
    String statusTitle;

    if (!isOnline) {
      if (networkStatus == NetworkStatus.poor && !isManual) {
        bg = const Color(0xFFFFFBEB);
        border = const Color(0xFFFDE68A);
        iconColor = const Color(0xFFD97706);
        icon = Icons.network_check_rounded;
        statusTitle = 'Offline · Weak Internet Detected';
      } else if (networkStatus == NetworkStatus.offline && !isManual) {
        bg = const Color(0xFFFEF2F2);
        border = const Color(0xFFFECACA);
        iconColor = const Color(0xFFDC2626);
        icon = Icons.wifi_off_rounded;
        statusTitle = 'Offline · Network Disconnected';
      } else {
        bg = const Color(0xFFFFFBEB);
        border = const Color(0xFFFDE68A);
        iconColor = const Color(0xFFD97706);
        icon = Icons.wifi_off_rounded;
        statusTitle = 'Offline Mode (Manual)';
      }
    } else {
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFFBBF7D0);
      iconColor = const Color(0xFF16A34A);
      icon = Icons.wifi_rounded;
      statusTitle = isManual ? 'Online (Manual Override)' : 'Live Connected · Online';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          // Icon with tooltip / tap to re-check
          InkWell(
            onTap: () => appState.refreshNetworkQuality(),
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.all(2.0),
              child: Icon(icon, size: 18, color: iconColor),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  statusTitle,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: iconColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  queueCount > 0
                      ? '$queueCount item${queueCount > 1 ? "s" : ""} queued in SQLite'
                      : (isOnline ? 'Local database synchronized' : 'Data safely saved on phone'),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: isOnline ? const Color(0xFF166534) : const Color(0xFF78350F),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Mode Toggle (Manual or Auto indicator)
          if (isManual) ...[
            InkWell(
              onTap: () => appState.resetToAutoNetwork(),
              borderRadius: BorderRadius.circular(6),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: const Text(
                  'Reset Auto',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF475569),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 4),
          ],
          InkWell(
            onTap: () => appState.toggleOnlineStatus(),
            borderRadius: BorderRadius.circular(6),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isOnline ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: isOnline ? const Color(0xFF86EFAC) : const Color(0xFFFCD34D),
                ),
              ),
              child: Text(
                isOnline ? 'Go Offline' : 'Go Online',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isOnline ? const Color(0xFF15803D) : const Color(0xFFB45309),
                ),
              ),
            ),
          ),
          if (queueCount > 0) ...[
            const SizedBox(width: 6),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                minimumSize: const Size(60, 28),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              onPressed: () => Navigator.pushNamed(context, '/sync-queue'),
              icon: const Icon(Icons.cloud_upload_rounded, size: 13),
              label: Text(
                'Sync ($queueCount)',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // 3. Overdue Clinical Care Gap Alert
  Widget _buildOverdueAlert(BuildContext context, AppState appState) {
    final now = DateTime.now();
    final overdueTasks = appState.followUpTasks.where((t) {
      if (t.isCompleted) return false;
      return t.status.toUpperCase() == 'OVERDUE' || t.dueDate.isBefore(now);
    }).toList();

    if (overdueTasks.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFFF87171).withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${overdueTasks.length} Overdue Patient Follow-Up${overdueTasks.length > 1 ? 's' : ''}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF991B1B),
                  ),
                ),
                Text(
                  'Immediate home visit required for medicine adherence',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.red.shade800,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              minimumSize: const Size(60, 32),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pushNamed(context, '/followup-inbox'),
            child: const Text('Review', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // 4. Glancing Field Metrics Summary
  Widget _buildMetricsSummary(BuildContext context, AppState appState) {
    final now = DateTime.now();
    final allTasks = appState.followUpTasks;
    final pendingCount = allTasks.where((t) => !t.isCompleted).length;
    final overdueCount = allTasks.where((t) => !t.isCompleted && (t.status.toUpperCase() == 'OVERDUE' || t.dueDate.isBefore(now))).length;
    final totalPatients = appState.patients.length;

    return Row(
      children: [
        // Registered Citizens
        Expanded(
          child: _buildMetricCard(
            title: appState.translate('metric_registered'),
            value: '$totalPatients',
            caption: appState.translate('metric_citizens'),
            icon: Icons.people_alt_rounded,
            color: const Color(0xFF0284C7),
            bgColor: const Color(0xFFE0F2FE),
            onTap: () => Navigator.pushNamed(context, '/patient-search'),
          ),
        ),
        const SizedBox(width: 10),
        // Today's Follow-up Visits
        Expanded(
          child: _buildMetricCard(
            title: appState.translate('metric_active_visits'),
            value: '$pendingCount',
            caption: overdueCount > 0
                ? appState.translate('metric_overdue', args: {'count': '$overdueCount'})
                : appState.translate('metric_due_visit'),
            icon: Icons.assignment_outlined,
            color: overdueCount > 0 ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
            bgColor: overdueCount > 0 ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
            onTap: () => Navigator.pushNamed(context, '/followup-inbox'),
          ),
        ),
        const SizedBox(width: 10),
        // Sync Mutations Queue
        Expanded(
          child: _buildMetricCard(
            title: appState.translate('metric_offline_sync'),
            value: '${appState.syncQueue.length}',
            caption: appState.syncQueue.isEmpty
                ? appState.translate('metric_all_synced')
                : appState.translate('metric_pending_upload'),
            icon: Icons.cloud_done_outlined,
            color: appState.syncQueue.isEmpty ? const Color(0xFF16A34A) : const Color(0xFFD97706),
            bgColor: appState.syncQueue.isEmpty ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
            onTap: () => Navigator.pushNamed(context, '/sync-queue'),
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String caption,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 16, color: color),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
              maxLines: 1,
            ),
            Text(
              caption,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: color,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // 5. Primary Quick Actions: Large, clear touch targets
  Widget _buildPrimaryActions(BuildContext context, AppState appState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          appState.translate('quick_actions_title'),
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            // Register Patient
            Expanded(
              child: _buildActionTile(
                title: appState.translate('action_register'),
                subtitle: appState.translate('action_register_sub'),
                icon: Icons.person_add_alt_1_rounded,
                isPrimary: true,
                onTap: () => Navigator.pushNamed(context, '/new-patient'),
              ),
            ),
            const SizedBox(width: 10),
            // Clinical Triage
            Expanded(
              child: _buildActionTile(
                title: appState.translate('action_vitals'),
                subtitle: appState.translate('action_vitals_sub'),
                icon: Icons.monitor_heart_outlined,
                iconColor: const Color(0xFF0284C7),
                iconBg: const Color(0xFFE0F2FE),
                onTap: () => Navigator.pushNamed(context, '/assessment-form'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            // Search Citizens
            Expanded(
              child: _buildActionTile(
                title: appState.translate('action_search'),
                subtitle: appState.translate('action_search_sub'),
                icon: Icons.person_search_rounded,
                iconColor: const Color(0xFF6366F1),
                iconBg: const Color(0xFFEEF2FF),
                onTap: () => Navigator.pushNamed(context, '/patient-search'),
              ),
            ),
            const SizedBox(width: 10),
            // Follow-up Inbox
            Expanded(
              child: _buildActionTile(
                title: appState.translate('action_care_gaps'),
                subtitle: appState.translate('action_care_gaps_sub'),
                icon: Icons.mark_chat_unread_outlined,
                iconColor: const Color(0xFFD97706),
                iconBg: const Color(0xFFFEF3C7),
                onTap: () => Navigator.pushNamed(context, '/followup-inbox'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
    bool isPrimary = false,
    Color? iconColor,
    Color? iconBg,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isPrimary ? AppColors.forest : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isPrimary ? AppColors.forest : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: isPrimary
                  ? AppColors.forest.withValues(alpha: 0.25)
                  : Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isPrimary ? Colors.white.withValues(alpha: 0.2) : (iconBg ?? const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isPrimary ? Colors.white : (iconColor ?? AppColors.forest),
                size: 22,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: isPrimary ? Colors.white : const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isPrimary ? const Color(0xFFD1FAE5) : const Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 6. Unified Today's Schedule & Care Gaps (Fixes the ToDo / Inbox Duplication!)
  Widget _buildUnifiedTasksSection(BuildContext context, AppState appState) {
    final allTasks = appState.followUpTasks;
    final now = DateTime.now();

    // Dynamically retrieve the selected date from the date strip
    final selectedDateIndex = _selectedDateIndex.clamp(0, _dateStrip.length - 1);
    final selectedDateItem = _dateStrip[selectedDateIndex];
    final selectedDate = selectedDateItem['date'] as DateTime;
    final isSelectedDateToday = selectedDateItem['isToday'] == true;

    bool isSameCalendarDay(DateTime a, DateTime b) {
      return a.year == b.year && a.month == b.month && a.day == b.day;
    }

    // Filter tasks for the selected date
    final dateTasks = allTasks.where((t) {
      final onDate = isSameCalendarDay(t.dueDate, selectedDate);
      if (isSelectedDateToday) {
        // Today's view includes tasks due today OR past overdue tasks requiring urgent action
        return onDate || (!t.isCompleted && t.dueDate.isBefore(now));
      } else {
        // Other calendar dates show tasks specifically scheduled on that date
        return onDate;
      }
    }).toList();

    final completedCount = dateTasks.where((t) => t.isCompleted).length;
    final pendingCount = dateTasks.where((t) => !t.isCompleted).length;
    final overdueCount = dateTasks.where((t) => !t.isCompleted && (t.status.toUpperCase() == 'OVERDUE' || t.dueDate.isBefore(now))).length;
    final double progress = dateTasks.isEmpty ? 0.0 : (completedCount / dateTasks.length);

    // Apply Filter Tab
    final filteredTasks = dateTasks.where((t) {
      if (_taskFilter == 'OVERDUE') {
        return !t.isCompleted && (t.status.toUpperCase() == 'OVERDUE' || t.dueDate.isBefore(now));
      }
      if (_taskFilter == 'TODAY') {
        return !t.isCompleted;
      }
      if (_taskFilter == 'COMPLETED') {
        return t.isCompleted;
      }
      return true; // ALL
    }).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title + View All
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.mintLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.event_note_rounded, size: 18, color: AppColors.forest),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  appState.translate('today_visits_title'),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              InkWell(
                onTap: () => Navigator.pushNamed(context, '/followup-inbox'),
                child: Text(
                  appState.translate('view_all'),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.forest,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Progress Bar: Selected date's checklist
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Visits Completed: $completedCount of ${dateTasks.length}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF334155)),
                    ),
                    Text(
                      dateTasks.isEmpty ? '0%' : '${(progress * 100).toInt()}%',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.forest),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 6,
                    backgroundColor: const Color(0xFFE2E8F0),
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.forest),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Date Selection Strip (Filters & Highlights)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(_dateStrip.length, (index) {
              final item = _dateStrip[index];
              final isSelected = index == _selectedDateIndex;
              final dayStr = item['day'].toString();
              final weekdayStr = item['weekday'].toString();
              final isToday = item['isToday'] == true;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedDateIndex = index;
                    if (_taskFilter == 'OVERDUE') {
                      _taskFilter = 'TODAY';
                    }
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 46,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.forest : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.forest
                          : (isToday ? AppColors.forest.withValues(alpha: 0.6) : const Color(0xFFE2E8F0)),
                      width: isToday ? 1.5 : 1.0,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        dayStr,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isToday ? (appState.currentLanguage == AppLanguage.english ? 'TODAY' : appState.translate('filter_today')) : weekdayStr,
                        style: TextStyle(
                          fontSize: isToday ? 8 : 10,
                          fontWeight: FontWeight.w700,
                          color: isSelected
                              ? Colors.white.withValues(alpha: 0.8)
                              : (isToday ? AppColors.forest : const Color(0xFF64748B)),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),

          const SizedBox(height: 14),

          // Filter Tabs: TODAY, OVERDUE, ALL, COMPLETED
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip('TODAY', '${appState.translate('filter_today')} ($pendingCount)'),
                const SizedBox(width: 8),
                _filterChip('OVERDUE', '${appState.translate('filter_overdue')} ($overdueCount)'),
                const SizedBox(width: 8),
                _filterChip('ALL', '${appState.translate('filter_all')} (${dateTasks.length})'),
                const SizedBox(width: 8),
                _filterChip('COMPLETED', '${appState.translate('filter_completed')} ($completedCount)'),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Task Items List
          if (filteredTasks.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              alignment: Alignment.center,
              child: Column(
                children: [
                  const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF16A34A), size: 36),
                  const SizedBox(height: 8),
                  Text(
                    _taskFilter == 'COMPLETED' ? 'No completed visits on this date' : 'No pending visits on this date!',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                  ),
                ],
              ),
            )
          else
            Column(
              children: filteredTasks.map((task) {
                return _buildTaskCard(context, appState, task);
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _filterChip(String filterKey, String label) {
    final isSelected = _taskFilter == filterKey;
    return InkWell(
      onTap: () => setState(() => _taskFilter = filterKey),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.forest : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildTaskCard(BuildContext context, AppState appState, FollowUpTask task) {
    final now = DateTime.now();
    final isOverdue = !task.isCompleted && (task.status.toUpperCase() == 'OVERDUE' || task.dueDate.isBefore(now));
    final isCompleted = task.isCompleted;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCompleted
            ? const Color(0xFFF8FAFC)
            : (isOverdue ? const Color(0xFFFEF2F2) : Colors.white),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOverdue
              ? const Color(0xFFFECACA)
              : (isCompleted ? const Color(0xFFE2E8F0) : const Color(0xFFE2E8F0)),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick Complete Action Button
          InkWell(
            onTap: () async {
              if (isCompleted) return;
              await appState.completeFollowUpTask(
                taskId: task.id,
                visitNotes: 'Completed via dashboard schedule',
              );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('✅ Completed visit for ${task.patientName}'),
                    backgroundColor: AppColors.forest,
                    duration: const Duration(seconds: 2),
                  ),
                );
              }
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(top: 2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isCompleted
                    ? const Color(0xFF16A34A)
                    : (isOverdue ? const Color(0xFFFEE2E2) : const Color(0xFFF1F5F9)),
                border: Border.all(
                  color: isCompleted
                      ? const Color(0xFF16A34A)
                      : (isOverdue ? const Color(0xFFFCA5A5) : const Color(0xFFCBD5E1)),
                ),
              ),
              child: Icon(
                Icons.check_rounded,
                size: 18,
                color: isCompleted ? Colors.white : (isOverdue ? const Color(0xFFDC2626) : const Color(0xFF94A3B8)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Task Content
          Expanded(
            child: InkWell(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => FollowUpTaskDetailsPage(task: task)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          task.patientName,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: isCompleted ? const Color(0xFF64748B) : const Color(0xFF0F172A),
                            decoration: isCompleted ? TextDecoration.lineThrough : null,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isCompleted
                              ? const Color(0xFFDCFCE7)
                              : (isOverdue ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isCompleted ? 'DONE' : (isOverdue ? 'OVERDUE' : 'DUE SOON'),
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: isCompleted
                                ? const Color(0xFF166534)
                                : (isOverdue ? const Color(0xFF991B1B) : const Color(0xFF92400E)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    task.reason,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isOverdue ? const Color(0xFF991B1B) : const Color(0xFF334155),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.medical_services_outlined, size: 12, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${task.doctorName} · ${task.doctorFacility}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 18),
        ],
      ),
    );
  }

  // 7. Recent Patient Encounters Section
  Widget _buildRecentPatientsSection(BuildContext context, AppState appState) {
    final recentPatients = appState.patients.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.people_outline_rounded, size: 18, color: Color(0xFF0284C7)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  appState.translate('registered_citizens_section'),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              InkWell(
                onTap: () => Navigator.pushNamed(context, '/patient-search'),
                child: Text(
                  appState.translate('view_all'),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.forest,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (recentPatients.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: Center(
                child: Text(
                  appState.translate('no_registered_yet'),
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else
            Column(
              children: recentPatients.map((patient) {
                return _buildPatientItem(context, appState, patient);
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildPatientItem(BuildContext context, AppState appState, Patient patient) {
    return InkWell(
      onTap: () {
        appState.selectPatient(patient);
        Navigator.pushNamed(context, '/patient-details');
      },
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFFE0F2FE),
              child: Text(
                patient.name.isNotEmpty ? patient.name[0].toUpperCase() : 'P',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0284C7)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    patient.name,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${patient.age} yrs · ${patient.gender} · Village: ${patient.village}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            // Fast Assessment Shortcut Button
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.forest,
                side: const BorderSide(color: Color(0xFFBBF7D0)),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                minimumSize: const Size(60, 30),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              onPressed: () {
                appState.selectPatient(patient);
                Navigator.pushNamed(context, '/assessment-form');
              },
              child: Text(appState.translate('assess_button'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showWorkerProfileDialog(BuildContext context, AppState appState) {
    showDialog(
      context: context,
      builder: (ctx) => Consumer<AppState>(
        builder: (ctx, state, _) {
          final currentLang = state.currentLanguage;
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Row(
              children: [
                const Icon(Icons.account_circle_outlined, color: AppColors.forest, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    state.translate('profile_title'),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
                  ),
                ),
              ],
            ),
            content: SizedBox(
              width: double.maxFinite,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const CircleAvatar(
                        backgroundColor: Color(0xFFE8F5E9),
                        child: Icon(Icons.person, color: AppColors.forest),
                      ),
                      title: Text(state.workerName, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(state.workerId),
                    ),
                    const Divider(height: 20),
                    Text(
                      '${state.translate('assigned_center')}: ${state.workerCenter}',
                      style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${state.translate('network_state')}: ${state.isOnline ? state.translate('online') : state.translate('offline')}',
                      style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${state.translate('registered_citizens')}: ${state.patients.length}',
                      style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
                    ),
                    const SizedBox(height: 16),
                    const Divider(height: 1),
                    const SizedBox(height: 14),

                    // Language Selector Header
                    Row(
                      children: [
                        const Icon(Icons.language_rounded, color: AppColors.forest, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          state.translate('app_language'),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.forest,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      state.translate('language_desc'),
                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 12),

                    // Language Option Buttons (English, Hindi, Marathi)
                    Column(
                      children: AppLanguage.values.map((lang) {
                        final isSelected = lang == currentLang;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: InkWell(
                            onTap: () async {
                              await state.setLanguage(lang);
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.forest.withValues(alpha: 0.1) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? AppColors.forest : const Color(0xFFE2E8F0),
                                  width: isSelected ? 1.8 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 12,
                                    backgroundColor: isSelected ? AppColors.forest : const Color(0xFFCBD5E1),
                                    child: isSelected
                                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                                        : Text(
                                            lang.code.toUpperCase(),
                                            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                                          ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          lang.nativeName,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: isSelected ? AppColors.forest : const Color(0xFF1E293B),
                                          ),
                                        ),
                                        Text(
                                          '${lang.name} · ${lang.description}',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: isSelected ? AppColors.forest : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (isSelected)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.forest,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Text(
                                        'Active',
                                        style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    const Divider(height: 1),
                    const SizedBox(height: 16),

                    // Clearly visible Logout button in Profile Section
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        key: const ValueKey('profile_logout_button'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFDC2626),
                          backgroundColor: const Color(0xFFFEF2F2),
                          side: const BorderSide(color: Color(0xFFFCA5A5), width: 1.2),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () async {
                          Navigator.pop(ctx);
                          await state.logout();
                          if (context.mounted) {
                            Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                          }
                        },
                        icon: const Icon(Icons.logout_rounded, size: 20, color: Color(0xFFDC2626)),
                        label: Text(
                          state.translate('logout'),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.2,
                            color: Color(0xFFDC2626),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(
                  state.translate('close'),
                  style: const TextStyle(color: AppColors.forest, fontWeight: FontWeight.bold),
                ),
              )
            ],
          );
        },
      ),
    );
  }
}
