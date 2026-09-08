import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/models/followup_model.dart';
import '../../../../core/theme/app_colors.dart';

class FollowUpTaskDetailsPage extends StatelessWidget {
  final FollowUpTask? task;

  const FollowUpTaskDetailsPage({super.key, this.task});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final currentTask = task ?? (appState.followUpTasks.isNotEmpty ? appState.followUpTasks.first : null);

    if (currentTask == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Follow-up Task Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.forest,
          elevation: 0,
        ),
        body: const Center(child: Text('No follow-up task found')),
      );
    }

    final isOverdue = currentTask.status == 'OVERDUE';
    final isCompleted = currentTask.status == 'COMPLETED';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Follow-up Task Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isCompleted
                    ? Colors.green.shade50
                    : (isOverdue ? Colors.red.shade50 : Colors.orange.shade50),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isCompleted
                      ? Colors.green.shade300
                      : (isOverdue ? Colors.red.shade300 : Colors.orange.shade300),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isCompleted ? Icons.check_circle : (isOverdue ? Icons.error_outline : Icons.schedule),
                    color: isCompleted
                        ? Colors.green.shade800
                        : (isOverdue ? Colors.red.shade900 : Colors.orange.shade900),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Task Status: ${currentTask.status} • Due on ${currentTask.dueDate.day}/${currentTask.dueDate.month}/${currentTask.dueDate.year}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isCompleted
                            ? Colors.green.shade800
                            : (isOverdue ? Colors.red.shade900 : Colors.orange.shade900),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Patient Card
            Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Patient Target', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text(currentTask.patientName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 2),
                    Text('Phone: ${currentTask.patientPhone}', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Doctor Assignment Card
            Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Doctor Instructions', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text(currentTask.taskDescription, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(
                      currentTask.instructions,
                      style: const TextStyle(fontSize: 13, height: 1.4, color: Color(0xFF334155)),
                    ),
                    const Divider(height: 20),
                    Row(
                      children: [
                        const Icon(Icons.badge_outlined, size: 16, color: AppColors.forest),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${currentTask.doctorName} • ${currentTask.doctorFacility}',
                            style: const TextStyle(fontSize: 12, color: AppColors.forest, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Prescribed Medicines Checklist
            Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Prescribed Medication Regimen', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    ...currentTask.prescribedMedicines.map(
                      (med) => Padding(
                        padding: const EdgeInsets.only(bottom: 6.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.medication, size: 18, color: Colors.teal),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(med, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Action Button -> Record Follow-up Visit
            if (!isCompleted)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.forest,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    '/followup/record',
                    arguments: currentTask,
                  );
                },
                icon: const Icon(Icons.edit_calendar_rounded),
                label: const Text(
                  'Record Home Visit & Vitals',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Visit completed: "${currentTask.visitNotes ?? "Completed by ASHA"}"',
                  style: TextStyle(color: Colors.green.shade900, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
