import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../followup/presentation/pages/followup_task_details_page.dart';

class HomeDashboardPage extends StatefulWidget {
  const HomeDashboardPage({super.key});

  @override
  State<HomeDashboardPage> createState() => _HomeDashboardPageState();
}

class _HomeDashboardPageState extends State<HomeDashboardPage> {
  int _selectedDateIndex = 2; // Default to '11 WED' (Today)

  final List<Map<String, String>> _dates = [
    {'day': '9', 'weekday': 'MON'},
    {'day': '10', 'weekday': 'TUE'},
    {'day': '11', 'weekday': 'WED'},
    {'day': '12', 'weekday': 'THU'},
    {'day': '13', 'weekday': 'FRI'},
    {'day': '14', 'weekday': 'SAT'},
  ];

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Top Header
              _buildHeader(context, appState),

              const SizedBox(height: 12),

              // 2. Connectivity & Sync Status Bar (Preserves Offline Functionality)
              _buildSyncBar(context, appState),

              const SizedBox(height: 14),

              // 3. Search Bar
              _buildSearchBar(context),

              const SizedBox(height: 18),

              // 4. To-Do List Card
              _buildTodoListCard(context, appState),

              const SizedBox(height: 20),

              // 5. Quick Actions: New Patient & Search Patients
              _buildQuickActionCards(context),

              const SizedBox(height: 20),

              // 6. Inbox Card
              _buildInboxCard(context, appState),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AppState appState) {
    return Row(
      children: [
        // ASHA Worker Avatar
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFFE2F0D9),
            border: Border.all(color: AppColors.primaryLight.withValues(alpha: 0.3), width: 1.5),
          ),
          child: const Center(
            child: CircleAvatar(
              radius: 22,
              backgroundColor: Color(0xFFD4E8D4),
              child: Icon(Icons.face_3_rounded, color: AppColors.primary, size: 28),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Greetings and Subtitle
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Namaste, ${appState.workerName.split(" ").first}',
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text('👋', style: TextStyle(fontSize: 18)),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                'ASHA Worker · ${appState.workerCenter}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textMedium,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        // Profile Action Button
        _buildCircularIconButton(
          icon: Icons.person_outline_rounded,
          onTap: () {
            _showWorkerProfileDialog(context, appState);
          },
        ),
        const SizedBox(width: 8),
        // Settings Action Button
        _buildCircularIconButton(
          icon: Icons.settings_outlined,
          onTap: () {
            Navigator.pushNamed(context, '/sync-queue');
          },
        ),
      ],
    );
  }

  Widget _buildCircularIconButton({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFFE5F3EA),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), width: 1),
        ),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
    );
  }

  Widget _buildSyncBar(BuildContext context, AppState appState) {
    final queueCount = appState.syncQueue.length;
    final isOnline = appState.isOnline;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isOnline ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOnline ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
            size: 16,
            color: isOnline ? const Color(0xFF16A34A) : const Color(0xFFD97706),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              isOnline
                  ? (queueCount > 0
                      ? 'Online · $queueCount pending offline items'
                      : 'Online · Local database synchronized')
                  : 'Offline Mode · $queueCount items queued in SQLite',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isOnline ? const Color(0xFF15803D) : const Color(0xFFB45309),
              ),
            ),
          ),
          InkWell(
            onTap: () => appState.toggleOnlineStatus(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isOnline ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                isOnline ? 'Go Offline' : 'Go Online',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isOnline ? const Color(0xFF166534) : const Color(0xFF92400E),
                ),
              ),
            ),
          ),
          if (queueCount > 0) ...[
            const SizedBox(width: 6),
            InkWell(
              onTap: () => Navigator.pushNamed(context, '/sync-queue'),
              child: const Icon(Icons.sync_rounded, size: 18, color: AppColors.primary),
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, '/patient-search'),
      borderRadius: BorderRadius.circular(30),
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.mintLight,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          children: [
            const Icon(Icons.search_rounded, color: AppColors.primary, size: 24),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Search By Patient Name, ID Or Mobile Number',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF437053),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
              child: const Icon(Icons.tune_rounded, color: AppColors.primary, size: 18),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodoListCard(BuildContext context, AppState appState) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.mintBanner,
        borderRadius: BorderRadius.circular(22),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Icon + Title + View All
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF6B7280).withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.format_list_bulleted_rounded, color: Color(0xFF374151), size: 20),
              ),
              const SizedBox(width: 10),
              const Text(
                'To-Do List',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                '(5 Tasks Await)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF375543),
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: () => Navigator.pushNamed(context, '/followup-inbox'),
                child: const Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Date Selector Carousel
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(_dates.length, (index) {
              final item = _dates[index];
              final isSelected = index == _selectedDateIndex;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedDateIndex = index;
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 48,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.forest : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.forest.withValues(alpha: 0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            )
                          ]
                        : [],
                  ),
                  child: Column(
                    children: [
                      Text(
                        item['day']!,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? Colors.white : AppColors.textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item['weekday']!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? const Color(0xFFD4E8D4) : const Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),

          const SizedBox(height: 14),

          // Schedule Timeline Box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Timeline Subheader
                Row(
                  children: [
                    const Text(
                      '9 AM',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6B7280)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '11 Wednesday - Today',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.forest.withValues(alpha: 0.8),
                        ),
                        textAlign: TextAlign.end,
                      ),
                    ),
                  ],
                ),
                const Divider(color: Color(0xFFE5E7EB), thickness: 0.8, height: 12),

                // 10 AM Appointment Card
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(
                      width: 42,
                      child: Text(
                        '10 AM',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6B7280)),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFAFD6B8),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Expanded(
                                  child: Text(
                                    'Dr. Amit Patel',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textDark,
                                    ),
                                  ),
                                ),
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white,
                                  ),
                                  child: const Icon(Icons.check, size: 14, color: AppColors.forest),
                                ),
                                const SizedBox(width: 4),
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white,
                                  ),
                                  child: const Icon(Icons.close, size: 14, color: Color(0xFFDC2626)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Submit the health update after 3 days of observation.',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF2A5038),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),
                const Row(
                  children: [
                    Text(
                      '11 AM',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Row(
                  children: [
                    Text(
                      '12 AM',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCards(BuildContext context) {
    return Row(
      children: [
        // Left Card: New Patient
        Expanded(
          child: InkWell(
            onTap: () => Navigator.pushNamed(context, '/new-patient'),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              height: 145,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.mintLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.forest.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_add_alt_1_rounded, color: AppColors.forest, size: 30),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'New Patient',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Register A New Patient',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF4B6E57),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(width: 14),

        // Right Card: Search Patients
        Expanded(
          child: InkWell(
            onTap: () => Navigator.pushNamed(context, '/patient-search'),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              height: 145,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.mintLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.forest.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_search_rounded, color: AppColors.forest, size: 30),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Search Patients',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Find Existing Patients',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF4B6E57),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInboxCard(BuildContext context, AppState appState) {
    final followUps = appState.followUpTasks;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD6E4DB), width: 1.2),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Inbox Header
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF6B7280).withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.forward_to_inbox_rounded, color: Color(0xFF374151), size: 20),
              ),
              const SizedBox(width: 10),
              const Text(
                'Inbox',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                '(3 New)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6B7280),
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: () => Navigator.pushNamed(context, '/followup-inbox'),
                child: const Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.forest,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Message Item 1: Dr. Rahul Sharma
          _buildInboxItem(
            context,
            name: 'Dr. Rahul Sharma',
            subtitle: 'Follow Up For Ramesh Kumar',
            time: '10:30 AM',
            isUnread: true,
            avatarColor: const Color(0xFFDBEAFE),
            onTap: () {
              if (followUps.isNotEmpty) {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => FollowUpTaskDetailsPage(task: followUps.first)),
                );
              } else {
                Navigator.pushNamed(context, '/followup-inbox');
              }
            },
          ),

          const Divider(color: Color(0xFFF1F5F2), thickness: 1, height: 16),

          // Message Item 2: Dr. Neha Verma
          _buildInboxItem(
            context,
            name: 'Dr. Neha Verma',
            subtitle: 'Update Required For Meena Devi',
            time: 'Yesterday',
            isUnread: true,
            avatarColor: const Color(0xFFFCE7F3),
            onTap: () {
              if (followUps.length > 1) {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => FollowUpTaskDetailsPage(task: followUps[1])),
                );
              } else {
                Navigator.pushNamed(context, '/followup-inbox');
              }
            },
          ),

          const Divider(color: Color(0xFFF1F5F2), thickness: 1, height: 16),

          // Message Item 3: Dr. Amit Patel
          _buildInboxItem(
            context,
            name: 'Dr. Amit Patel',
            subtitle: 'Lab Report Received',
            time: '2 Days Ago',
            isUnread: false,
            avatarColor: const Color(0xFFE0E7FF),
            onTap: () => Navigator.pushNamed(context, '/followup-inbox'),
          ),
        ],
      ),
    );
  }

  Widget _buildInboxItem(
    BuildContext context, {
    required String name,
    required String subtitle,
    required String time,
    required bool isUnread,
    required Color avatarColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        child: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: avatarColor,
              child: const Icon(Icons.person_rounded, color: Color(0xFF475569), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  time,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
                const SizedBox(height: 4),
                if (isUnread)
                  Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.unreadDot,
                    ),
                  )
                else
                  const SizedBox(height: 7),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showWorkerProfileDialog(BuildContext context, AppState appState) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('ASHA Worker Profile', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(backgroundColor: AppColors.mintBanner, child: Icon(Icons.person, color: AppColors.forest)),
              title: Text(appState.workerName, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(appState.workerId),
            ),
            const Divider(),
            Text('Assigned Center: ${appState.workerCenter}', style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
            const SizedBox(height: 6),
            Text('Network State: ${appState.isOnline ? "Online" : "Offline (Local SQLite)"}', style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
            const SizedBox(height: 6),
            Text('Total Registered Patients: ${appState.patients.length}', style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: AppColors.forest, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }
}
