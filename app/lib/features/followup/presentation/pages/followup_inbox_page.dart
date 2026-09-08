import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/followup_model.dart';

class FollowUpInboxPage extends StatefulWidget {
  const FollowUpInboxPage({super.key});

  @override
  State<FollowUpInboxPage> createState() => _FollowUpInboxPageState();
}

class _FollowUpInboxPageState extends State<FollowUpInboxPage> {
  String _filter = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showCompleteDialog(AppState appState, FollowUpTask task) {
    final notesController = TextEditingController(text: 'Routine home visit completed. Vitals stable.');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          appState.translate('complete_task_for', args: {'name': task.patientName}),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              appState.translate('visit_notes_prompt'),
              style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: notesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: appState.translate('visit_notes_hint'),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                filled: true,
                fillColor: const Color(0xFFF9FAFB),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(appState.translate('cancel'), style: const TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.forest,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              final notes = notesController.text.trim();
              Navigator.pop(ctx);
              await appState.completeFollowUpTask(taskId: task.id, visitNotes: notes.isNotEmpty ? notes : 'Home visit completed');
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(appState.translate('task_completed_msg', args: {'name': task.patientName})),
                  backgroundColor: const Color(0xFF16A34A),
                ),
              );
            },
            child: Text(appState.translate('mark_complete')),
          ),
        ],
      ),
    );
  }

  void _showEscalateDialog(AppState appState, FollowUpTask task) {
    final reasonController = TextEditingController(text: 'Symptoms worsening or patient unresponsive to medication');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                appState.translate('escalate_to_mo'),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              appState.translate('escalate_mo_desc', args: {'name': task.patientName}),
              style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: appState.translate('escalate_reason_hint'),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                filled: true,
                fillColor: const Color(0xFFFEF2F2),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(appState.translate('cancel'), style: const TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              final reason = reasonController.text.trim();
              Navigator.pop(ctx);
              await appState.toggleEscalateFollowUp(task.id, reason: reason.isNotEmpty ? reason : 'Escalated by ASHA worker');
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(appState.translate('task_escalated_msg', args: {'name': task.patientName})),
                  backgroundColor: const Color(0xFFDC2626),
                ),
              );
            },
            child: Text(appState.translate('escalate_now')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final allTasks = appState.followUpTasks;
    final now = DateTime.now();

    final overdueCount = allTasks.where((t) => !t.isCompleted && (t.status.toUpperCase() == 'OVERDUE' || t.dueDate.isBefore(now))).length;
    final dueTodayCount = allTasks.where((t) => !t.isCompleted && t.dueDate.day == now.day && t.dueDate.month == now.month && t.dueDate.year == now.year).length;
    final completedCount = allTasks.where((t) => t.isCompleted).length;

    final filteredTasks = allTasks.where((t) {
      // Filter tab check
      if (_filter == 'PENDING' && t.isCompleted) return false;
      if (_filter == 'OVERDUE' && (t.isCompleted || (!t.dueDate.isBefore(now) && t.status.toUpperCase() != 'OVERDUE'))) return false;
      if (_filter == 'TODAY' && (t.isCompleted || t.dueDate.day != now.day || t.dueDate.month != now.month || t.dueDate.year != now.year)) return false;
      if (_filter == 'COMPLETED' && !t.isCompleted) return false;

      // Search query check
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchName = t.patientName.toLowerCase().contains(query);
        final matchReason = t.reason.toLowerCase().contains(query);
        final matchNotes = t.notes.toLowerCase().contains(query);
        if (!matchName && !matchReason && !matchNotes) return false;
      }

      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(appState.translate('referral_inbox_title'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
      ),
      body: Column(
        children: [
          // 1. Care Gap Metrics Summary Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              children: [
                _buildMetricCard(appState.translate('metric_all_tasks'), '${allTasks.length}', const Color(0xFF0284C7), const Color(0xFFE0F2FE)),
                const SizedBox(width: 8),
                _buildMetricCard(appState.translate('filter_overdue'), '$overdueCount', const Color(0xFFDC2626), const Color(0xFFFEE2E2)),
                const SizedBox(width: 8),
                _buildMetricCard(appState.translate('filter_today'), '$dueTodayCount', const Color(0xFFD97706), const Color(0xFFFEF3C7)),
                const SizedBox(width: 8),
                _buildMetricCard(appState.translate('filter_completed'), '$completedCount', const Color(0xFF16A34A), const Color(0xFFDCFCE7)),
              ],
            ),
          ),

          // 2. Search Field
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
              decoration: InputDecoration(
                hintText: appState.translate('search_tasks_hint'),
                hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.forest),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.mintLight,
                contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),

          // 3. Filter Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _filterChip('ALL', appState.translate('filter_all_count', args: {'count': '${allTasks.length}'})),
                  const SizedBox(width: 8),
                  _filterChip('OVERDUE', appState.translate('filter_overdue_count', args: {'count': '$overdueCount'})),
                  const SizedBox(width: 8),
                  _filterChip('TODAY', appState.translate('filter_today_count', args: {'count': '$dueTodayCount'})),
                  const SizedBox(width: 8),
                  _filterChip('PENDING', appState.translate('filter_active_count', args: {'count': '${allTasks.length - completedCount}'})),
                  const SizedBox(width: 8),
                  _filterChip('COMPLETED', appState.translate('filter_completed_count', args: {'count': '$completedCount'})),
                ],
              ),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),

          // 4. Tasks List
          Expanded(
            child: filteredTasks.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_outline_rounded, size: 56, color: Color(0xFF9CA3AF)),
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            _searchQuery.isNotEmpty
                                ? appState.translate('no_tasks_match', args: {'query': _searchQuery})
                                : appState.translate('no_tasks_found'),
                            style: const TextStyle(color: Color(0xFF6B7280), fontWeight: FontWeight.w500),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16.0),
                    itemCount: filteredTasks.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final task = filteredTasks[index];
                      final isOverdue = !task.isCompleted && (task.status.toUpperCase() == 'OVERDUE' || task.dueDate.isBefore(now));
                      final isCompleted = task.isCompleted;

                      return Card(
                        elevation: 0,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(
                            color: isOverdue
                                ? const Color(0xFFFCA5A5)
                                : (isCompleted ? const Color(0xFFBBF7D0) : const Color(0xFFE5E7EB)),
                            width: isOverdue ? 1.5 : 1.0,
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top Row: Status badge & Due Date
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isCompleted
                                          ? const Color(0xFFDCFCE7)
                                          : (isOverdue ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7)),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      isCompleted
                                          ? appState.translate('status_completed')
                                          : (isOverdue ? appState.translate('status_overdue') : appState.translate('status_due_soon')),
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: isCompleted
                                            ? const Color(0xFF166534)
                                            : (isOverdue ? const Color(0xFF991B1B) : const Color(0xFF92400E)),
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Icon(
                                    Icons.event_outlined,
                                    size: 14,
                                    color: isOverdue ? const Color(0xFFDC2626) : const Color(0xFF6B7280),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    appState.translate('due_date_label', args: {'date': '${task.dueDate.day}/${task.dueDate.month}/${task.dueDate.year}'}),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: isOverdue ? FontWeight.bold : FontWeight.w500,
                                      color: isOverdue ? const Color(0xFFDC2626) : const Color(0xFF6B7280),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 10),

                              // Patient Name & Reason
                              InkWell(
                                onTap: () => Navigator.pushNamed(context, '/followup/details', arguments: task),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            task.patientName,
                                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textDark),
                                          ),
                                        ),
                                        const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF), size: 22),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      task.reason,
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: isOverdue ? const Color(0xFF991B1B) : const Color(0xFF1F2937),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    if (task.notes.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        task.notes,
                                        style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              ),

                              // Prescribed medicines chips
                              if (task.prescribedMedicines.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 4,
                                  children: task.prescribedMedicines.take(2).map((med) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF3F4F6),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: const Color(0xFFE5E7EB)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.medication_outlined, size: 12, color: Color(0xFF4B5563)),
                                          const SizedBox(width: 4),
                                          Text(med, style: const TextStyle(fontSize: 10, color: Color(0xFF374151), fontWeight: FontWeight.w600)),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],

                              const SizedBox(height: 10),
                              const Divider(height: 1, color: Color(0xFFF3F4F6)),
                              const SizedBox(height: 10),

                              // Doctor Assignment & Quick Action Buttons
                              Row(
                                children: [
                                  Expanded(
                                    child: Row(
                                      children: [
                                        const Icon(Icons.medical_services_outlined, size: 14, color: AppColors.forest),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            '${task.doctorName} • ${task.doctorFacility}',
                                            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (!isCompleted) ...[
                                    // Escalate Button
                                    OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(color: Color(0xFFFCA5A5)),
                                        foregroundColor: const Color(0xFFDC2626),
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        minimumSize: const Size(60, 32),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      onPressed: () => _showEscalateDialog(appState, task),
                                      child: Text(appState.translate('btn_escalate'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                    ),
                                    const SizedBox(width: 8),
                                    // Complete Button
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.forest,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                        minimumSize: const Size(60, 32),
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      onPressed: () => _showCompleteDialog(appState, task),
                                      child: Text(appState.translate('btn_done'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                    ),
                                  ] else ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.check, size: 14, color: Color(0xFF166534)),
                                          const SizedBox(width: 4),
                                          Text(appState.translate('status_completed'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF166534))),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, Color textColor, Color bgColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textColor)),
            const SizedBox(height: 2),
            Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: textColor), textAlign: TextAlign.center, maxLines: 1),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String filterKey, String label) {
    final isSelected = _filter == filterKey;
    return InkWell(
      onTap: () => setState(() => _filter = filterKey),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.forest : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF4B5563),
          ),
        ),
      ),
    );
  }
}
