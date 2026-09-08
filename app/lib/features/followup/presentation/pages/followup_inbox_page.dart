import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';

class FollowUpInboxPage extends StatefulWidget {
  const FollowUpInboxPage({super.key});

  @override
  State<FollowUpInboxPage> createState() => _FollowUpInboxPageState();
}

class _FollowUpInboxPageState extends State<FollowUpInboxPage> {
  String _filter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final allTasks = appState.followUpTasks;

    final filteredTasks = allTasks.where((t) {
      if (_filter == 'PENDING') return t.status == 'PENDING';
      if (_filter == 'OVERDUE') return t.status == 'OVERDUE';
      if (_filter == 'COMPLETED') return t.status == 'COMPLETED';
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('06 Follow-up Inbox'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Row(
              children: [
                _filterChip('ALL', 'All (${allTasks.length})'),
                const SizedBox(width: 8),
                _filterChip('PENDING', 'Pending'),
                const SizedBox(width: 8),
                _filterChip('OVERDUE', 'Overdue'),
                const SizedBox(width: 8),
                _filterChip('COMPLETED', 'Done'),
              ],
            ),
          ),
          const Divider(height: 1),

          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
            child: Row(
              children: [
                Icon(Icons.arrow_downward, size: 16, color: Color(0xFF2563EB)),
                SizedBox(width: 6),
                Text(
                  'Doctor Counter-Referral Assignments',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                ),
                Spacer(),
                Text('Tap for 17 Details', style: TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),

          // Tasks List
          Expanded(
            child: filteredTasks.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inbox_outlined, size: 56, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text('No follow-up tasks in "$_filter"', style: const TextStyle(color: Colors.grey)),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16.0),
                    itemCount: filteredTasks.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final task = filteredTasks[index];
                      final isOverdue = task.status == 'OVERDUE';
                      final isCompleted = task.status == 'COMPLETED';

                      return Card(
                        elevation: 0,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(
                            color: isOverdue ? Colors.red.shade300 : Colors.grey.shade200,
                            width: isOverdue ? 1.5 : 1.0,
                          ),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            // Navigate to 17 Follow-up Task Details
                            Navigator.pushNamed(
                              context,
                              '/followup/details',
                              arguments: task,
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: isCompleted
                                            ? Colors.green.shade50
                                            : (isOverdue ? Colors.red.shade50 : Colors.orange.shade50),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: isCompleted
                                              ? Colors.green.shade300
                                              : (isOverdue ? Colors.red.shade300 : Colors.orange.shade300),
                                        ),
                                      ),
                                      child: Text(
                                        task.status,
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: isCompleted
                                              ? Colors.green.shade800
                                              : (isOverdue ? Colors.red.shade900 : Colors.orange.shade900),
                                        ),
                                      ),
                                    ),
                                    const Spacer(),
                                    Text(
                                      'Due: ${task.dueDate.day}/${task.dueDate.month}/${task.dueDate.year}',
                                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  task.patientName,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  task.taskDescription,
                                  style: TextStyle(fontSize: 13, color: Colors.grey.shade800, fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.local_hospital_outlined, size: 14, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Assigned by: ${task.doctorName} (${task.doctorFacility})',
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ],
                            ),
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

  Widget _filterChip(String filterKey, String label) {
    final isSelected = _filter == filterKey;
    return InkWell(
      onTap: () => setState(() => _filter = filterKey),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }
}
