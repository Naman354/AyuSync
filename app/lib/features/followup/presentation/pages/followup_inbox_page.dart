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
        title: Text('Complete Follow-Up for ${task.patientName}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter visit observations & patient response:', style: TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
            const SizedBox(height: 10),
            TextField(
              controller: notesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'e.g. Blood pressure 120/80, taking morning medication as advised.',
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
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
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
                  content: Text('✅ Follow-up completed for ${task.patientName}'),
                  backgroundColor: const Color(0xFF16A34A),
                ),
              );
            },
            child: const Text('Mark Complete'),
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
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626)),
            SizedBox(width: 8),
            Expanded(
              child: Text('Escalate to MO', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF991B1B))),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Escalate ${task.patientName} directly to the Medical Officer for urgent intervention.', style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
            const SizedBox(height: 10),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Enter reason for escalation...',
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
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
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
                  content: Text('🚨 Escalated ${task.patientName} to Medical Officer!'),
                  backgroundColor: const Color(0xFFDC2626),
                ),
              );
            },
            child: const Text('Escalate Now'),
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
        title: const Text('Follow-up Care Gaps', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
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
                _buildMetricCard('All Tasks', '${allTasks.length}', const Color(0xFF0284C7), const Color(0xFFE0F2FE)),
                const SizedBox(width: 8),
                _buildMetricCard('Overdue', '$overdueCount', const Color(0xFFDC2626), const Color(0xFFFEE2E2)),
                const SizedBox(width: 8),
                _buildMetricCard('Due Today', '$dueTodayCount', const Color(0xFFD97706), const Color(0xFFFEF3C7)),
                const SizedBox(width: 8),
                _buildMetricCard('Completed', '$completedCount', const Color(0xFF16A34A), const Color(0xFFDCFCE7)),
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
                hintText: 'Search by patient name, reason, or condition...',
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
                  _filterChip('ALL', 'All (${allTasks.length})'),
                  const SizedBox(width: 8),
                  _filterChip('OVERDUE', 'Overdue ($overdueCount)'),
                  const SizedBox(width: 8),
                  _filterChip('TODAY', 'Due Today ($dueTodayCount)'),
                  const SizedBox(width: 8),
                  _filterChip('PENDING', 'Active (${allTasks.length - completedCount})'),
                  const SizedBox(width: 8),
                  _filterChip('COMPLETED', 'Done ($completedCount)'),
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
                        Text(
                          _searchQuery.isNotEmpty
                              ? 'No follow-up tasks match "$_searchQuery"'
                              : 'No follow-up tasks in "$_filter"',
                          style: const TextStyle(color: Color(0xFF6B7280), fontWeight: FontWeight.w500),
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
                                      isCompleted ? 'COMPLETED' : (isOverdue ? 'OVERDUE' : 'DUE SOON'),
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
                                    'Due: ${task.dueDate.day}/${task.dueDate.month}/${task.dueDate.year}',
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
                                      child: const Text('Escalate', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
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
                                      child: const Text('Done', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                    ),
                                  ] else ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.check, size: 14, color: Color(0xFF166534)),
                                          SizedBox(width: 4),
                                          Text('Completed', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF166534))),
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
