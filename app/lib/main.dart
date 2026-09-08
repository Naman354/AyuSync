import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/state/app_state.dart';
import 'core/theme/app_colors.dart';
import 'core/models/followup_model.dart';

import 'features/auth/presentation/pages/splash_page.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/dashboard/presentation/pages/home_dashboard_page.dart';
import 'features/patient/presentation/pages/new_patient_page.dart';
import 'features/patient/presentation/pages/patient_details_page.dart';
import 'features/patient/presentation/pages/patient_search_page.dart';
import 'features/patient/presentation/pages/patient_history_page.dart';
import 'features/assessment/presentation/pages/assessment_form_page.dart';
import 'features/assessment/presentation/pages/saved_offline_page.dart';
import 'features/sync/presentation/pages/sync_queue_page.dart';
import 'features/triage/presentation/pages/ai_triage_page.dart';
import 'features/triage/presentation/pages/worker_confirmation_page.dart';
import 'features/triage/presentation/pages/facility_routing_page.dart';
import 'features/triage/presentation/pages/case_submitted_page.dart';
import 'features/triage/presentation/pages/case_status_page.dart';
import 'features/followup/presentation/pages/followup_inbox_page.dart';
import 'features/followup/presentation/pages/followup_task_details_page.dart';
import 'features/followup/presentation/pages/record_followup_page.dart';
import 'core/sync/sync_engine.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SyncEngine().init();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: const AyuSyncApp(),
    ),
  );
}

class AyuSyncApp extends StatelessWidget {
  const AyuSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AyuSync',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.forest,
          primary: AppColors.forest,
          secondary: AppColors.mintBanner,
          surface: Colors.white,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.background,
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: false,
          backgroundColor: Colors.white,
          foregroundColor: AppColors.forest,
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashPage(),
        '/login': (context) => const LoginPage(),
        '/home': (context) => const HomeDashboardPage(),
        '/dashboard': (context) => const HomeDashboardPage(),
        '/new-patient': (context) => const NewPatientPage(),
        '/patient/new': (context) => const NewPatientPage(),
        '/patient-details': (context) => const PatientDetailsPage(),
        '/patient/details': (context) => const PatientDetailsPage(),
        '/patient-search': (context) => const PatientSearchPage(),
        '/patient/search': (context) => const PatientSearchPage(),
        '/patient-history': (context) => const PatientHistoryPage(),
        '/patient/history': (context) => const PatientHistoryPage(),
        '/assessment-form': (context) => const AssessmentFormPage(),
        '/assessment/form': (context) => const AssessmentFormPage(),
        '/saved-offline': (context) => const SavedOfflinePage(),
        '/assessment/saved_offline': (context) => const SavedOfflinePage(),
        '/sync-queue': (context) => const SyncQueuePage(),
        '/sync_queue': (context) => const SyncQueuePage(),
        '/ai-triage': (context) => const AiTriagePage(),
        '/triage/ai_result': (context) => const AiTriagePage(),
        '/worker-confirmation': (context) => const WorkerConfirmationPage(),
        '/triage/worker_confirm': (context) => const WorkerConfirmationPage(),
        '/facility-routing': (context) => const FacilityRoutingPage(),
        '/triage/facility_routing': (context) => const FacilityRoutingPage(),
        '/case-submitted': (context) => const CaseSubmittedPage(),
        '/triage/case_submitted': (context) => const CaseSubmittedPage(),
        '/case-status': (context) => const CaseStatusPage(),
        '/triage/case_status': (context) => const CaseStatusPage(),
        '/followup-inbox': (context) => const FollowUpInboxPage(),
        '/followup/inbox': (context) => const FollowUpInboxPage(),
        '/followup/details': (context) {
          final task = ModalRoute.of(context)?.settings.arguments as FollowUpTask?;
          return FollowUpTaskDetailsPage(task: task);
        },
        '/followup/record': (context) {
          final task = ModalRoute.of(context)?.settings.arguments as FollowUpTask?;
          return RecordFollowUpPage(task: task);
        },
      },
    );
  }
}
