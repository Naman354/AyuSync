import 'app_language.dart';

class AppTranslations {
  static const Map<String, String> _en = {
    // Common / Actions
    'save': 'Save',
    'cancel': 'Cancel',
    'close': 'Close',
    'back': 'Back',
    'next': 'Next',
    'continue_': 'Continue',
    'done': 'Done',
    'edit': 'Edit',
    'delete': 'Delete',
    'search': 'Search',
    'loading': 'Loading…',
    'offline': 'Offline',
    'online': 'Online',
    'poor_network': 'Poor Network',
    'retry': 'Retry',
    'view_all': 'View All',
    'status': 'Status',
    'welcome': 'Welcome',
    'or_text': 'or',
    'logout': 'Log Out',

    // Profile Dialog & Language Selector
    'profile_title': 'ASHA Worker Profile',
    'assigned_center': 'Assigned Center',
    'network_state': 'Network State',
    'registered_citizens': 'Total Registered Patients',
    'app_language': 'App Language',
    'language_desc': 'Select application language',
    'switch_success': 'Language switched successfully',

    // Dashboard
    'greeting_morning': 'Good Morning',
    'greeting_afternoon': 'Good Afternoon',
    'greeting_evening': 'Good Evening',
    'asha_worker': 'ASHA Worker',
    'metric_registered': 'Registered',
    'metric_citizens': 'Citizens',
    'metric_active_visits': 'Active Visits',
    'metric_due_visit': 'Due for visit',
    'metric_overdue': '{count} overdue',
    'metric_offline_sync': 'Offline Sync',
    'metric_all_synced': 'All Synced',
    'metric_pending_upload': 'Pending upload',
    'quick_actions_title': 'Quick Field Actions',
    'action_register': 'Register Patient',
    'action_register_sub': 'New camp intake',
    'action_vitals': 'Clinical Vitals',
    'action_vitals_sub': 'Assessment & Triage',
    'action_search': 'Search Citizens',
    'action_search_sub': 'By ABHA or phone',
    'action_care_gaps': 'Care Gaps Inbox',
    'action_care_gaps_sub': 'Doctor tasks loop',
    'today_visits_title': 'Today\'s Field Visits & Tasks',
    'filter_all': 'ALL',
    'filter_overdue': 'OVERDUE',
    'filter_today': 'TODAY',
    'filter_completed': 'COMPLETED',
    'no_tasks_found': 'No field tasks for this filter',
    'recent_referrals_title': 'Recent Referrals & Counter-referrals',
    'no_referrals_yet': 'No active referrals yet',
    'registered_citizens_section': 'Registered Citizens',
    'no_registered_yet': 'No registered patients yet. Tap "+ New Patient" to register.',
    'assess_button': 'Assess',

    // Citizen Registration Form
    'new_citizen_registration': 'New Citizen Registration',
    'step_1_title': 'Citizen Demographics',
    'step_1_subtitle': 'Step 1 of 2 · Citizen Demographics',
    'step_2_title': 'Symptoms & Baseline Vitals',
    'step_2_subtitle': 'Step 2 of 2 · Vitals & Clinical Intake',
    'full_name': 'Full Name *',
    'hint_full_name': 'e.g. Ramesh Patel',
    'age_years': 'Age (Yrs) *',
    'dob_label': 'DOB (DD/MM/YYYY)',
    'gender_label': 'Gender *',
    'gender_female': 'Female',
    'gender_male': 'Male',
    'gender_other': 'Other',
    'mobile_phone': 'Mobile Phone Number *',
    'village_ward': 'Village / Ward *',
    'abha_number': 'ABHA Number (Optional)',
    'continue_to_vitals': 'Continue to Vitals & Symptoms',
    'chief_complaint': 'Chief Clinical Complaint',
    'quick_symptoms_title': 'Quick Symptom Tap to Add:',
    'primary_symptom': 'Primary Symptom *',
    'hint_primary_symptom': 'e.g. High grade fever with chills & cough',
    'severity_label': 'Severity *',
    'severity_mild': '🟢 Mild',
    'severity_moderate': '🟠 Moderate',
    'severity_severe': '🔴 Severe',
    'duration_label': 'Duration (Days) *',
    'days_unit': '{count} Days',
    'baseline_vitals': 'Objective Baseline Vitals',
    'temp_label': 'Temp (°F)',
    'spo2_label': 'SpO2 (%)',
    'bp_systolic': 'BP Systolic',
    'bp_diastolic': 'BP Diastolic',
    'pulse_rate': 'Pulse Rate (bpm)',
    'clinical_notes': 'Clinical Notes (Optional)',
    'hint_clinical_notes': 'e.g. Known hypertensive, missed medication.',
    'save_patient_assess': 'Save Patient & Assess',

    // Quick Symptoms
    'symptom_high_fever': 'High Fever',
    'symptom_breathlessness': 'Severe Breathlessness',
    'symptom_cough': 'Persistent Cough',
    'symptom_chest_pain': 'Chest Pain',
    'symptom_dizziness': 'Dizziness / Syncope',
    'symptom_abdominal_pain': 'Abdominal Pain',
    'symptom_headache': 'Severe Headache',
    'symptom_vomiting': 'Vomiting / Diarrhea',

    // Validation Errors
    'err_name_required': 'Please enter the patient\'s full name',
    'err_name_min': 'Full name must be at least 2 characters',
    'err_name_letters': 'Name should only contain letters, spaces, dots, or hyphens',
    'err_name_numbers': 'Name should not contain numbers',
    'err_age_or_dob': 'Please enter age or select date of birth',
    'err_age_range': 'Age must be between 0 and 125 years',
    'err_phone_required': 'Please enter a 10-digit mobile phone number',
    'err_phone_prefix': 'Mobile number must start with 6, 7, 8, or 9',
    'err_village_required': 'Please enter or select patient village / ward',
    'err_symptom_required': 'Please describe the primary clinical symptom',

    // Auth / Login
    'login_title': 'Log In',
    'login_welcome': 'Welcome',
    'login_namaste': 'Namaste!',
    'login_asha_id': 'ASHA Id',
    'login_password': 'Password',
    'login_biometric': 'Biometric Authentication',
    'login_signup_prompt': 'Don\'t have an account? Sign up',

    // Follow-up & Triage & Sync
    'followup_inbox_title': 'Follow-Up Tasks',
    'complete_task': 'Complete Follow-Up',
    'visit_notes_hint': 'Enter visit observations & patient response:',
    'ai_triage_title': 'AI Triage & Reasoning',
    'sync_queue_title': 'Offline Sync Queue',
    'sync_now': 'Sync Now',
  };

  static const Map<String, String> _hi = {
    // Common / Actions
    'save': 'सुरक्षित करें',
    'cancel': 'रद्द करें',
    'close': 'बंद करें',
    'back': 'वापस',
    'next': 'आगे',
    'continue_': 'जारी रखें',
    'done': 'संपन्न',
    'edit': 'संपादित करें',
    'delete': 'हटाएं',
    'search': 'खोजें',
    'loading': 'लोड हो रहा है…',
    'offline': 'ऑफलाइन',
    'online': 'ऑनलाइन',
    'poor_network': 'कमजोर नेटवर्क',
    'retry': 'पुनः प्रयास करें',
    'view_all': 'सभी देखें',
    'status': 'स्थिति',
    'welcome': 'स्वागत है',
    'or_text': 'अथवा',
    'logout': 'लॉग आउट',

    // Profile Dialog & Language Selector
    'profile_title': 'आशा कार्यकर्ता प्रोफाइल',
    'assigned_center': 'आवंटित स्वास्थ्य केंद्र',
    'network_state': 'नेटवर्क स्थिति',
    'registered_citizens': 'कुल पंजीकृत नागरिक',
    'app_language': 'ऐप की भाषा',
    'language_desc': 'ऐप के लिए अपनी भाषा चुनें',
    'switch_success': 'भाषा सफलतापूर्वक बदल दी गई',

    // Dashboard
    'greeting_morning': 'शुभ प्रभात',
    'greeting_afternoon': 'शुभ दोपहर',
    'greeting_evening': 'शुभ संध्या',
    'asha_worker': 'आशा कार्यकर्ता',
    'metric_registered': 'पंजीकृत',
    'metric_citizens': 'नागरिक',
    'metric_active_visits': 'सक्रिय दौरे',
    'metric_due_visit': 'दौरे का समय',
    'metric_overdue': '{count} विलंबित',
    'metric_offline_sync': 'ऑफलाइन सिंक',
    'metric_all_synced': 'पूर्णतः सिंक',
    'metric_pending_upload': 'अपलोड बाकी',
    'quick_actions_title': 'त्वरित फील्ड कार्य',
    'action_register': 'नागरिक पंजीकरण',
    'action_register_sub': 'नया शिविर पंजीकरण',
    'action_vitals': 'नैदानिक वाइटल्स',
    'action_vitals_sub': 'जांच और ट्रायज',
    'action_search': 'नागरिक खोजें',
    'action_search_sub': 'आभा या फोन द्वारा',
    'action_care_gaps': 'फॉलो-अप इनबॉक्स',
    'action_care_gaps_sub': 'डॉक्टर निर्देश लूप',
    'today_visits_title': 'आज के फील्ड दौरे और कार्य',
    'filter_all': 'सभी',
    'filter_overdue': 'विलंबित',
    'filter_today': 'आज',
    'filter_completed': 'पूर्ण',
    'no_tasks_found': 'इस फ़िल्टर के लिए कोई कार्य नहीं है',
    'recent_referrals_title': 'हालिया रेफरल और डॉक्टर निर्देश',
    'no_referrals_yet': 'अभी कोई सक्रिय रेफरल नहीं है',
    'registered_citizens_section': 'पंजीकृत नागरिक',
    'no_registered_yet': 'अभी कोई पंजीकृत नागरिक नहीं है। पंजीकरण के लिए "+ नया नागरिक" दबाएं।',
    'assess_button': 'जांचें',

    // Citizen Registration Form
    'new_citizen_registration': 'नया नागरिक पंजीकरण',
    'step_1_title': 'नागरिक जनसांख्यिकी',
    'step_1_subtitle': 'चरण 1/2 · नागरिक जनसांख्यिकी',
    'step_2_title': 'लक्षण और आधारभूत वाइटल्स',
    'step_2_subtitle': 'चरण 2/2 · वाइटल्स और नैदानिक जांच',
    'full_name': 'पूरा नाम *',
    'hint_full_name': 'उदा. रमेश पटेल',
    'age_years': 'आयु (वर्ष) *',
    'dob_label': 'जन्म तिथि (दिन/माह/वर्ष)',
    'gender_label': 'लिंग *',
    'gender_female': 'महिला',
    'gender_male': 'पुरुष',
    'gender_other': 'अन्य',
    'mobile_phone': 'मोबाइल नंबर *',
    'village_ward': 'गाँव / वार्ड *',
    'abha_number': 'आभा संख्या (वैकल्पिक)',
    'continue_to_vitals': 'लक्षण और वाइटल्स पर जाएं',
    'chief_complaint': 'मुख्य नैदानिक शिकायत',
    'quick_symptoms_title': 'त्वरित लक्षण चुनने के लिए टैप करें:',
    'primary_symptom': 'प्राथमिक लक्षण *',
    'hint_primary_symptom': 'उदा. तेज बुखार, ठंड और खांसी',
    'severity_label': 'तीव्रता *',
    'severity_mild': '🟢 हल्का',
    'severity_moderate': '🟠 मध्यम',
    'severity_severe': '🔴 गंभीर',
    'duration_label': 'अवधि (दिन) *',
    'days_unit': '{count} दिन',
    'baseline_vitals': 'आधारभूत शारीरिक वाइटल्स',
    'temp_label': 'तापमान (°F)',
    'spo2_label': 'ऑक्सीजन SpO2 (%)',
    'bp_systolic': 'सिस्टोलिक बीपी',
    'bp_diastolic': 'डायस्टोलिक बीपी',
    'pulse_rate': 'पल्स रेट (bpm)',
    'clinical_notes': 'नैदानिक नोट्स (वैकल्पिक)',
    'hint_clinical_notes': 'उदा. उच्च रक्तचाप, छूटी हुई दवा।',
    'save_patient_assess': 'सुरक्षित करें और जांचें',

    // Quick Symptoms
    'symptom_high_fever': 'तेज बुखार',
    'symptom_breathlessness': 'सांस फूलना',
    'symptom_cough': 'लगातार खांसी',
    'symptom_chest_pain': 'सीने में दर्द',
    'symptom_dizziness': 'चक्कर आना / बेहोशी',
    'symptom_abdominal_pain': 'पेट दर्द',
    'symptom_headache': 'गंभीर सिरदर्द',
    'symptom_vomiting': 'उल्टी / दस्त',

    // Validation Errors
    'err_name_required': 'कृपया नागरिक का पूरा नाम दर्ज करें',
    'err_name_min': 'नाम कम से कम 2 अक्षरों का होना चाहिए',
    'err_name_letters': 'नाम में केवल अक्षर, रिक्त स्थान, बिंदु या हाइफ़न होने चाहिए',
    'err_name_numbers': 'नाम में अंक नहीं होने चाहिए',
    'err_age_or_dob': 'कृपया आयु दर्ज करें या जन्म तिथि चुनें',
    'err_age_range': 'आयु 0 से 125 वर्ष के बीच होनी चाहिए',
    'err_phone_required': 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें',
    'err_phone_prefix': 'मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए',
    'err_village_required': 'कृपया गाँव या वार्ड का नाम दर्ज करें',
    'err_symptom_required': 'कृपया प्राथमिक लक्षण दर्ज करें',

    // Auth / Login
    'login_title': 'लॉग इन',
    'login_welcome': 'स्वागत है',
    'login_namaste': 'नमस्ते!',
    'login_asha_id': 'आशा आईडी',
    'login_password': 'पासवर्ड',
    'login_biometric': 'बायोमेट्रिक प्रमाणीकरण',
    'login_signup_prompt': 'खाता नहीं है? साइन अप करें',

    // Follow-up & Triage & Sync
    'followup_inbox_title': 'फॉलो-अप कार्य',
    'complete_task': 'कार्य पूरा करें',
    'visit_notes_hint': 'दौरे के अवलोकन और नागरिक की प्रतिक्रिया दर्ज करें:',
    'ai_triage_title': 'एआई ट्रायज और विश्लेषण',
    'sync_queue_title': 'ऑफलाइन सिंक कतार',
    'sync_now': 'अभी सिंक करें',
  };

  static const Map<String, String> _mr = {
    // Common / Actions
    'save': 'जतन करा',
    'cancel': 'रद्द करा',
    'close': 'बंद करा',
    'back': 'मागे',
    'next': 'पुढे',
    'continue_': 'पुढे चला',
    'done': 'झाले',
    'edit': 'संपादित करा',
    'delete': 'हटवा',
    'search': 'शोधा',
    'loading': 'लोड होत आहे…',
    'offline': 'ऑफलाइन',
    'online': 'ऑनलाइन',
    'poor_network': 'कमकुवत नेटवर्क',
    'retry': 'पुन्हा प्रयत्न करा',
    'view_all': 'सर्व पहा',
    'status': 'स्थिती',
    'welcome': 'स्वागत आहे',
    'or_text': 'किंवा',
    'logout': 'लॉग आउट',

    // Profile Dialog & Language Selector
    'profile_title': 'आशा सेविका प्रोफाइल',
    'assigned_center': 'नेमलेले प्राथमिक उपकेंद्र',
    'network_state': 'नेटवर्क स्थिती',
    'registered_citizens': 'एकूण नोंदणीकृत नागरिक',
    'app_language': 'ॲपची भाषा',
    'language_desc': 'ॲपसाठी तुमची पसंतीची भाषा निवडा',
    'switch_success': 'भाषा यशस्वीरित्या बदलली',

    // Dashboard
    'greeting_morning': 'शुभ सकाळ',
    'greeting_afternoon': 'शुभ दुपार',
    'greeting_evening': 'शुभ संध्याकाळ',
    'asha_worker': 'आशा सेविका',
    'metric_registered': 'नोंदणीकृत',
    'metric_citizens': 'नागरिक',
    'metric_active_visits': 'सक्रिय भेटी',
    'metric_due_visit': 'भेटीची वेळ',
    'metric_overdue': '{count} थकीत',
    'metric_offline_sync': 'ऑफलाइन सिंक',
    'metric_all_synced': 'सर्व समक्रमित',
    'metric_pending_upload': 'अपलोड बाकी',
    'quick_actions_title': 'जलद फील्ड कृती',
    'action_register': 'नागरिक नोंदणी',
    'action_register_sub': 'नवीन शिबिर नोंदणी',
    'action_vitals': 'वैद्यकीय वाइटल्स',
    'action_vitals_sub': 'तपासणी आणि ट्रायज',
    'action_search': 'नागरिक शोधा',
    'action_search_sub': 'आभा किंवा फोनद्वारे',
    'action_care_gaps': 'काळजी अंतर इनबॉक्स',
    'action_care_gaps_sub': 'डॉक्टरांचे कार्य लूप',
    'today_visits_title': 'आजच्या फील्ड भेटी आणि कार्ये',
    'filter_all': 'सर्व',
    'filter_overdue': 'थकीत',
    'filter_today': 'आज',
    'filter_completed': 'पूर्ण',
    'no_tasks_found': 'या फिल्टरसाठी कोणतीही कार्ये नाहीत',
    'recent_referrals_title': 'अलीकडील संदर्भ आणि डॉक्टरांचे निर्देश',
    'no_referrals_yet': 'अद्याप कोणतेही सक्रिय संदर्भ नाहीत',
    'registered_citizens_section': 'नोंदणीकृत नागरिक',
    'no_registered_yet': 'अद्याप नोंदणीकृत नागरिक नाहीत. नोंदणीसाठी "+ नवीन नागरिक" टॅप करा.',
    'assess_button': 'तपासा',

    // Citizen Registration Form
    'new_citizen_registration': 'नवीन नागरिक नोंदणी',
    'step_1_title': 'नागरिक तपशील',
    'step_1_subtitle': 'टप्पा 1/2 · नागरिक तपशील',
    'step_2_title': 'लक्षणे आणि मूलभूत वाइटल्स',
    'step_2_subtitle': 'टप्पा 2/2 · वाइटल्स आणि वैद्यकीय तपासणी',
    'full_name': 'पूर्ण नाव *',
    'hint_full_name': 'उदा. रमेश पाटील',
    'age_years': 'वय (वर्षे) *',
    'dob_label': 'जन्मतारीख (दि/महिना/वर्ष)',
    'gender_label': 'लिंग *',
    'gender_female': 'महिला',
    'gender_male': 'पुरुष',
    'gender_other': 'इतर',
    'mobile_phone': 'मोबाइल नंबर *',
    'village_ward': 'गाव / प्रभाग *',
    'abha_number': 'आभा क्रमांक (पर्यायी)',
    'continue_to_vitals': 'लक्षणे आणि वाइटल्सकडे पुढे जा',
    'chief_complaint': 'मुख्य वैद्यकीय तक्रार',
    'quick_symptoms_title': 'जलद लक्षण निवडण्यासाठी टॅप करा:',
    'primary_symptom': 'प्राथमिक लक्षण *',
    'hint_primary_symptom': 'उदा. तीव्र ताप, थंडी आणि खोकला',
    'severity_label': 'तीव्रता *',
    'severity_mild': '🟢 सौम्य',
    'severity_moderate': '🟠 मध्यम',
    'severity_severe': '🔴 गंभीर',
    'duration_label': 'कालावधी (दिवस) *',
    'days_unit': '{count} दिवस',
    'baseline_vitals': 'मूलभूत शारीरिक वाइटल्स',
    'temp_label': 'तापमान (°F)',
    'spo2_label': 'ऑक्सिजन SpO2 (%)',
    'bp_systolic': 'सिस्टोलिक बीपी',
    'bp_diastolic': 'डायस्टोलिक बीपी',
    'pulse_rate': 'नाडी दर (bpm)',
    'clinical_notes': 'वैद्यकीय नोंदी (पर्यायी)',
    'hint_clinical_notes': 'उदा. उच्च रक्तदाब, औषध चुकले.',
    'save_patient_assess': 'जतन करा आणि तपासा',

    // Quick Symptoms
    'symptom_high_fever': 'तीव्र ताप',
    'symptom_breathlessness': 'तीव्र श्वास घेण्यास त्रास',
    'symptom_cough': 'सतत खोकला',
    'symptom_chest_pain': 'छातीत दुखणे',
    'symptom_dizziness': 'चक्कर येणे / भोवळ',
    'symptom_abdominal_pain': 'पोटात दुखणे',
    'symptom_headache': 'तीव्र डोकेदुखी',
    'symptom_vomiting': 'उलट्या / जुलाब',

    // Validation Errors
    'err_name_required': 'कृपया नागरिकाचे पूर्ण नाव प्रविष्ट करा',
    'err_name_min': 'नाव किमान 2 अक्षरांचे असावे',
    'err_name_letters': 'नावात फक्त अक्षरे, जागा किंवा डॅश असावेत',
    'err_name_numbers': 'नावात अंक नसावेत',
    'err_age_or_dob': 'कृपया वय प्रविष्ट करा किंवा जन्मतारीख निवडा',
    'err_age_range': 'वय 0 ते 125 वर्षे दरम्यान असावे',
    'err_phone_required': 'कृपया 10 अंकी मोबाइल नंबर प्रविष्ट करा',
    'err_phone_prefix': 'मोबाइल नंबर 6, 7, 8 किंवा 9 ने सुरू झाला पाहिजे',
    'err_village_required': 'कृपया गाव किंवा प्रभागाचे नाव प्रविष्ट करा',
    'err_symptom_required': 'कृपया प्राथमिक लक्षण प्रविष्ट करा',

    // Auth / Login
    'login_title': 'लॉग इन',
    'login_welcome': 'स्वागत आहे',
    'login_namaste': 'नमस्ते!',
    'login_asha_id': 'आशा आयडी',
    'login_password': 'पासवर्ड',
    'login_biometric': 'बायोमेट्रिक प्रमाणीकरण',
    'login_signup_prompt': 'खाते नाही? साइन अप करा',

    // Follow-up & Triage & Sync
    'followup_inbox_title': 'पाठपुरावा कार्ये',
    'complete_task': 'कार्य पूर्ण करा',
    'visit_notes_hint': 'भेटीच्या नोंदी आणि नागरिकाचा प्रतिसाद प्रविष्ट करा:',
    'ai_triage_title': 'एआय ट्रायज आणि विश्लेषण',
    'sync_queue_title': 'ऑफलाइन सिंक रांग',
    'sync_now': 'आता सिंक करा',
  };

  static String get(AppLanguage language, String key, {Map<String, String>? args}) {
    Map<String, String> dict;
    switch (language) {
      case AppLanguage.hindi:
        dict = _hi;
        break;
      case AppLanguage.marathi:
        dict = _mr;
        break;
      case AppLanguage.english:
      default:
        dict = _en;
        break;
    }

    String result = dict[key] ?? _en[key] ?? key;
    if (args != null && args.isNotEmpty) {
      args.forEach((placeholder, value) {
        result = result.replaceAll('{$placeholder}', value);
      });
    }
    return result;
  }

  /// Exposes dictionaries for testing coverage
  static Map<String, String> getDictionary(AppLanguage language) {
    switch (language) {
      case AppLanguage.hindi:
        return _hi;
      case AppLanguage.marathi:
        return _mr;
      case AppLanguage.english:
        return _en;
    }
  }

  /// Returns all translation keys for a given language
  static Iterable<String> allKeys(AppLanguage language) => getDictionary(language).keys;
}
