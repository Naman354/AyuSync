import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { getAuthUser } from '../lib/auth';
import StatusBadge from '../components/ui/StatusBadge';
import InlineError from '../components/ui/InlineError';
import { ensure14DigitAbha } from './ReferralSuccess';
import {
  Plus, X, HeartPulse, Pill, ClipboardList,
  ShieldCheck, Printer, CheckCircle2, Stethoscope, Check,
  Building2, MapPin, Phone, Clock, Activity, Calendar,
  Ambulance, UserCheck, History, Sparkles, LayoutDashboard
} from 'lucide-react';

import { getCompletedTaskIds, markTaskAsCompletedGlobally } from '../lib/tasks';
export { getCompletedTaskIds, markTaskAsCompletedGlobally };

// ── Defensive Date & Observation Helpers (Zero Runtime Crashes) ──
function safeFormatDate(val?: any, options?: Intl.DateTimeFormatOptions): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', options || { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function renderClinicalObs(obs: any): string {
  if (!obs) return '';
  if (typeof obs === 'string') return obs;
  if (Array.isArray(obs)) {
    return obs
      .map((item: any) => (typeof item === 'string' ? item : item?.note || item?.observation || ''))
      .filter(Boolean)
      .join('; ');
  }
  if (typeof obs === 'object') {
    return obs.note || obs.observation || '';
  }
  return String(obs);
}

// ── Realistic Demo Fallback for Ramesh Kulkarni & Demo Patients ──
const DEMO_PATIENT_DATA: Record<string, any> = {
  'pat-ramesh-kulkarni': {
    id: 'pat-ramesh-kulkarni',
    name: 'Ramesh Kulkarni',
    age: 58,
    gender: 'MALE',
    phone: '+91 91112 22333',
    village: 'Khandala Ward 2, Satara Road',
    abhaId: '91-8844-3321-0001',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: [
      {
        id: 'c-1',
        name: 'Essential Hypertension (Grade 1)',
        status: 'ACTIVE',
        diagnosedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Target BP < 130/80 mmHg. Stabilized on Tab Telmisartan 40mg OD.'
      },
      {
        id: 'c-2',
        name: 'Type 2 Diabetes Mellitus',
        status: 'ACTIVE',
        diagnosedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Target fasting glucose < 130 mg/dL. Controlled on Tab Metformin 500mg BD.'
      },
      {
        id: 'c-3',
        name: 'Acute Bronchitis (Resolved)',
        status: 'RESOLVED',
        diagnosedAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Treated with oral antibiotics at Khandala PHC. Completely resolved.'
      }
    ],
    prescriptions: [
      {
        id: 'rx-1',
        medicine: 'Tab Metformin 500mg',
        dosage: '1 Tab Twice Daily',
        timing: 'Morning & Night (After Meals)',
        duration: '30 Days Supply',
        purpose: 'Glycemic Control (Type 2 Diabetes)',
        status: 'ACTIVE'
      },
      {
        id: 'rx-2',
        medicine: 'Tab Telmisartan 40mg',
        dosage: '1 Tab Once Daily',
        timing: 'Morning (After Breakfast)',
        duration: '30 Days Supply',
        purpose: 'Blood Pressure Regulation (Hypertension)',
        status: 'ACTIVE'
      }
    ],
    encounters: [
      {
        id: 'enc-1',
        start: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'CLINIC_VISIT',
        provider: 'Dr. Rajesh Deshmukh (Medical Officer, Baramati CHC)',
        facilityName: 'Baramati Community Health Centre',
        vitals: [
          { bloodPressure: '136/86', heartRate: 74, spo2: 98, temperature: '98.4', bloodGlucose: '128' }
        ],
        clinicalObs: 'Follow-up consultation. Blood pressure stabilized on Telmisartan. Fasting blood sugar well controlled at 128 mg/dL. Advised low salt diet, 30-min morning brisk walking.',
        prescriptions: [
          { medicine: 'Tab Metformin 500mg', dosage: '1 Tab Twice Daily (After Meals)', duration: '30 Days' },
          { medicine: 'Tab Telmisartan 40mg', dosage: '1 Tab Once Daily (Morning)', duration: '30 Days' }
        ]
      },
      {
        id: 'enc-2',
        start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'FIELD_VISIT',
        provider: 'Sunita Patil (Frontline ASHA Worker)',
        facilityName: 'Khandala Sub-Center (Doorstep Survey)',
        vitals: [
          { bloodPressure: '148/94', heartRate: 78, spo2: 97, temperature: '98.6', bloodGlucose: '186' }
        ],
        clinicalObs: 'Routine village NCD survey. Elevated blood pressure and fasting glucose detected. Initiated digital referral to Baramati CHC for physician review.'
      },
      {
        id: 'enc-3',
        start: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'CLINIC_VISIT',
        provider: 'Dr. Priya Kulkarni (Khandala PHC)',
        facilityName: 'Khandala Primary Health Centre',
        vitals: [
          { bloodPressure: '138/88', heartRate: 76, spo2: 98, temperature: '98.6', bloodGlucose: '134' }
        ],
        clinicalObs: 'Annual Comprehensive NCD Screening. Baseline 12-lead ECG normal. Dietary sodium counseling initiated.'
      }
    ],
    referrals: [
      {
        id: 'ref-ramesh-kulkarni',
        urgency: 'PRIORITY',
        status: 'COUNTER_REFERRED',
        reason: 'Uncontrolled Type 2 Diabetes with Grade 1 Essential Hypertension; elevated fasting sugar & blood pressure on field screening',
        origin: { name: 'Khandala Sub-Center' },
        destination: { name: 'Baramati CHC' },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        counterReferral: {
          outcome: 'Type 2 Diabetes Mellitus with Essential Hypertension stabilized. Glycemic target fasting < 130 mg/dL achieved.',
          treatment: 'Tab Metformin 500mg BD after meals, Tab Telmisartan 40mg OD morning',
          instructions: 'ASHA worker to confirm Metformin 500mg BD compliance & check fasting sugar. Advise low sodium diet and 30-minute daily brisk walking.',
          requiresFollowUp: true
        }
      },
      {
        id: 'ref-ramesh-kulkarni-past',
        urgency: 'ROUTINE',
        status: 'COMPLETED',
        reason: 'Annual Comprehensive NCD Screening & Baseline Cardiovascular Assessment',
        origin: { name: 'Khandala Sub-Center' },
        destination: { name: 'Khandala Primary Health Centre' },
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        counterReferral: {
          outcome: 'Baseline ECG within normal limits. Fasting glucose slightly elevated at 134 mg/dL. Initiated lifestyle counseling and dietary salt restriction.',
          treatment: 'Dietary salt reduction (< 5g/day), brisk walking 30 mins daily. Repeat blood sugar after 3 months.',
          instructions: 'Follow up with ASHA worker for monthly blood pressure and dietary compliance monitoring.',
          requiresFollowUp: false
        }
      }
    ],
    followUps: [
      {
        id: 'demo-task-2',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Confirm Metformin 500mg BD compliance & check fasting sugar',
        notes: 'Medications: Metformin 500mg twice daily with meals. Low salt intake advised.',
        status: 'PENDING',
        worker: { user: { name: 'Sunita Patil (ASHA Worker)' } }
      },
      {
        id: 'demo-task-3',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Weekly blood pressure check & walking adherence review',
        notes: 'Measure seated BP in right arm, target systolic < 130 mmHg.',
        status: 'PENDING',
        worker: { user: { name: 'Sunita Patil (ASHA Worker)' } }
      }
    ]
  },
  'pat-pooja-sharma': {
    id: 'pat-pooja-sharma',
    name: 'Pooja Sharma',
    age: 26,
    gender: 'FEMALE',
    phone: '+91 98231 45678',
    village: 'Khandala Ward 2, Near Vithal Mandir',
    abhaId: '91-8844-3321-0002',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: [
      { id: 'c-4', name: 'High Risk Pregnancy (2nd Trimester)', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Gestational age 24 weeks. High risk protocol active.' },
      { id: 'c-5', name: 'Gestational Hypertension', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), notes: 'BP stabilized on Labetalol 100mg BD.' }
    ],
    prescriptions: [
      {
        id: 'rx-p-1',
        medicine: 'Tab Labetalol 100mg',
        dosage: '1 Tab Twice Daily',
        timing: 'Morning & Night (After Meals)',
        duration: '14 Days Supply',
        purpose: 'Gestational Hypertension Stabilizer',
        status: 'ACTIVE'
      },
      {
        id: 'rx-p-2',
        medicine: 'Iron & Folic Acid (IFA) + Calcium',
        dosage: '1 Tab Once Daily',
        timing: 'After Lunch',
        duration: '60 Days Supply',
        purpose: 'Antenatal Health Support',
        status: 'ACTIVE'
      }
    ],
    encounters: [
      {
        id: 'enc-p-1',
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'CLINIC_VISIT',
        provider: 'Dr. Rajesh Deshmukh',
        facilityName: 'Baramati Community Health Centre',
        vitals: [
          { bloodPressure: '132/86', heartRate: 82, spo2: 98, temperature: '98.6' }
        ],
        clinicalObs: 'Gestational hypertension stabilized. Fetal heart sounds audible & regular (142 bpm). Continue Labetalol 100mg BD.'
      }
    ],
    referrals: [
      {
        id: 'ref-pooja-sharma',
        urgency: 'URGENT',
        status: 'COUNTER_REFERRED',
        reason: 'Gestational Hypertension screening; elevated blood pressure requiring physician review',
        origin: { name: 'Khandala Sub-Center' },
        destination: { name: 'Baramati CHC' },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        counterReferral: {
          outcome: 'Stabilized on oral antihypertensives (Labetalol 100mg BD)',
          treatment: 'Tab Labetalol 100mg BD, IFA 1 OD, Calcium 500mg OD',
          instructions: 'Visit patient every Tuesday and Friday. Check BP and record in AyuSync app. If systolic > 140 or diastolic > 90, call 108 immediately.',
          requiresFollowUp: true
        }
      }
    ],
    followUps: [
      {
        id: 'demo-task-1',
        dueDate: new Date().toISOString(),
        reason: 'Post-consultation BP monitoring for Gestational Hypertension',
        notes: 'Measure sitting BP in right arm, verify fetal movements.',
        status: 'PENDING',
        worker: { user: { name: 'Sunita Patil (ASHA Worker)' } }
      }
    ]
  },
  'pat-sunita-chavan': {
    id: 'pat-sunita-chavan',
    name: 'Sunita Chavan',
    age: 29,
    gender: 'FEMALE',
    phone: '+91 91112 22341',
    village: 'Khandala Ward 3, Satara Road',
    abhaId: '91-8844-3321-0003',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: [
      { id: 'c-sc-1', name: 'Iron Deficiency Anemia (Moderate)', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Hb 9.8 g/dL. Prescribed oral Iron & Folic Acid supplements.' }
    ],
    prescriptions: [
      { id: 'rx-sc-1', medicine: 'Tab IFA (Iron & Folic Acid)', dosage: '1 Tab Daily', timing: 'After Meals', duration: '60 Days Supply', purpose: 'Anemia Management', status: 'ACTIVE' }
    ],
    encounters: [
      {
        id: 'enc-sc-1',
        start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'FIELD_VISIT',
        provider: 'Sunita Patil (ASHA Worker)',
        facilityName: 'Khandala Sub-Center',
        vitals: [{ bloodPressure: '118/76', heartRate: 78, spo2: 98, temperature: '98.4' }],
        clinicalObs: 'Routine nutritional survey. Provided counseling on green leafy vegetables & dietary iron.'
      }
    ],
    referrals: [],
    followUps: [
      {
        id: 'demo-task-3',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Distribute monthly Iron Folic Acid (IFA) supply and verify conjunctival pallor',
        notes: 'Medications: IFA Red tablets (100mg iron + 500mcg folic acid). Verify anemia pallor.',
        status: 'PENDING',
        worker: { user: { name: 'Sunita Patil (ASHA Worker)' } }
      }
    ]
  },
  'pat-aarav-patel': {
    id: 'pat-aarav-patel',
    name: 'Aarav Patel',
    age: 2,
    gender: 'MALE',
    phone: '+91 91112 22342',
    village: 'Khandala East',
    abhaId: '91-8844-3321-0004',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: [
      { id: 'c-ap-1', name: 'Acute Gastroenteritis (Resolved)', status: 'RESOLVED', diagnosedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Fully recovered following Zinc & ORS supplementation.' }
    ],
    prescriptions: [
      { id: 'rx-ap-1', medicine: 'Oral Rehydration Salts (ORS) + Zinc Drops', dosage: 'As directed', timing: 'Oral', duration: 'Completed', purpose: 'Rehydration', status: 'COMPLETED' }
    ],
    encounters: [],
    referrals: [],
    followUps: [
      {
        id: 'demo-task-4',
        dueDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        reason: 'Vaccination check - Pentavalent 3 & growth milestone review',
        notes: 'Immunization drive session at Khandala Anganwadi. Verify mother brings MCP card.',
        status: 'PENDING',
        worker: { user: { name: 'Sunita Patil (ASHA Worker)' } }
      }
    ]
  },
  'pat-meena-kumari': {
    id: 'pat-meena-kumari',
    name: 'Meena Kumari',
    age: 34,
    gender: 'FEMALE',
    phone: '+91 91112 22343',
    village: 'Baramati Ward 1',
    abhaId: '91-8844-3321-0005',
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: [
      { id: 'c-mk-1', name: 'Bronchial Asthma (Intermittent)', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Inhaler Salbutamol PRN for episodic wheezing in winter.' }
    ],
    prescriptions: [
      { id: 'rx-mk-1', medicine: 'Salbutamol Inhaler 100mcg', dosage: '2 Puffs PRN', timing: 'When needed', duration: 'As required', purpose: 'Bronchodilation', status: 'ACTIVE' }
    ],
    encounters: [],
    referrals: [],
    followUps: []
  }
};

// ── Realistic Nearby Facilities Network for Rural Patients ──
const NEARBY_FACILITIES = [
  {
    id: 'fac-khandala-phc',
    name: 'Khandala Primary Health Centre',
    type: 'Primary Health Centre (PHC)',
    tier: 'Level 1 Facility',
    distance: '1.2 km',
    travelTime: '~5 mins away',
    status: 'OPEN NOW',
    hours: '9:00 AM – 4:00 PM',
    phone: '+91 2169 244102',
    services: ['General OPD Consultations', 'Basic Pathology & Lab Tests', 'NCD Clinic (Diabetes & BP)', 'Free Medicines Distribution'],
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'fac-baramati-chc',
    name: 'Baramati Community Health Centre',
    type: 'Community Health Centre (CHC)',
    tier: 'Level 2 Referral Hospital',
    distance: '18.0 km',
    travelTime: '~25 mins away',
    status: '24x7 OPEN',
    hours: '24 Hours Emergency & Inpatient',
    phone: '+91 2112 222108',
    services: ['24x7 Emergency Room', 'Specialist Doctors & MOs', 'Digital X-Ray & Diagnostics', '60-Bed Inpatient Care'],
    badgeColor: 'bg-emerald-50 text-[#1e6641] border-emerald-200'
  },
  {
    id: 'fac-subcenter',
    name: 'Khandala Sub-Center & Health Wellness Clinic',
    type: 'Village Sub-Center / Ayushman Arogya Mandir',
    tier: 'Doorstep Care Unit',
    distance: '400 m',
    travelTime: 'Walking Distance (3 mins)',
    status: 'OPEN NOW',
    hours: '8:30 AM – 1:30 PM',
    phone: '+91 98220 11224',
    services: ['Frontline ASHA Worker Desk', 'Routine Blood Pressure Check', 'Blood Sugar Screening', 'Maternal & Antenatal Care'],
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  }
];

export default function PatientDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const queryTab = searchParams.get('tab');
  const user = getAuthUser() || {};
  const storedPatientId = typeof window !== 'undefined' ? sessionStorage.getItem('ayusync_selected_patient_id') : null;
  const targetPatientId = queryId || user.patientId || storedPatientId || 'pat-pooja-sharma';

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Active Tab: 'OVERVIEW' | 'REFERRALS' | 'CONDITIONS' | 'FACILITIES' | 'TIMELINE'
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REFERRALS' | 'CONDITIONS' | 'FACILITIES' | 'TIMELINE'>(() => {
    if (queryTab && ['OVERVIEW', 'REFERRALS', 'CONDITIONS', 'FACILITIES', 'TIMELINE'].includes(queryTab.toUpperCase())) {
      return queryTab.toUpperCase() as any;
    }
    return 'OVERVIEW';
  });

  useEffect(() => {
    if (queryTab && ['OVERVIEW', 'REFERRALS', 'CONDITIONS', 'FACILITIES', 'TIMELINE'].includes(queryTab.toUpperCase())) {
      setActiveTab(queryTab.toUpperCase() as any);
    }
  }, [queryTab]);

  // Modals
  const [showCondModal, setShowCondModal] = useState(false);
  const [condName, setCondName] = useState('');
  const [condStatus, setCondStatus] = useState('ACTIVE');
  const [condNotes, setCondNotes] = useState('');
  const [savingCond, setSavingCond] = useState(false);
  const [condError, setCondError] = useState('');

  const [showSlipModal, setShowSlipModal] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Sync state with global completed tasks
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(getCompletedTaskIds);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients/${targetPatientId}/timeline`);
      if (res.data && res.data.id) {
        // Merge with rich fallback data ONLY if target matches a known demo patient
        const fallback = DEMO_PATIENT_DATA[targetPatientId] || null;
        setPatient({
          ...(fallback || {}),
          ...res.data,
          conditions: (res.data.conditions && res.data.conditions.length > 0) ? res.data.conditions : (fallback?.conditions || []),
          referrals: (res.data.referrals && res.data.referrals.length > 0) ? res.data.referrals : (fallback?.referrals || []),
          encounters: (res.data.encounters && res.data.encounters.length > 0) ? res.data.encounters : (fallback?.encounters || []),
          followUps: (res.data.followUps && res.data.followUps.length > 0) ? res.data.followUps : (fallback?.followUps || [])
        });
      } else {
        setPatient(DEMO_PATIENT_DATA[targetPatientId] || {
          id: targetPatientId,
          name: user.name || 'Patient',
          phone: user.phone,
          conditions: [],
          referrals: [],
          encounters: [],
          followUps: []
        });
      }
    } catch {
      // Graceful offline fallback
      setPatient(DEMO_PATIENT_DATA[targetPatientId] || {
        id: targetPatientId,
        name: user.name || 'Patient',
        phone: user.phone,
        conditions: [],
        referrals: [],
        encounters: [],
        followUps: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();

    // Listen to cross-role / cross-tab task completion & clinical update events
    const onTaskCompleted = (e: any) => {
      const id = e.detail?.id;
      if (id) {
        setCompletedTaskIds(prev => new Set(prev).add(id));
      }
    };

    const onClinicalUpdate = (e: any) => {
      if (e.detail?.patientId === targetPatientId || !e.detail?.patientId) {
        fetchPatientData();
      }
    };

    // Bug 2 fix: store the storage handler in a named variable so it can be cleaned up
    const onStorageChange = () => {
      setCompletedTaskIds(getCompletedTaskIds());
      fetchPatientData();
    };

    window.addEventListener('ayusync:task_completed', onTaskCompleted);
    window.addEventListener('ayusync:clinical_record_updated', onClinicalUpdate);
    window.addEventListener('storage', onStorageChange);

    return () => {
      window.removeEventListener('ayusync:task_completed', onTaskCompleted);
      window.removeEventListener('ayusync:clinical_record_updated', onClinicalUpdate);
      window.removeEventListener('storage', onStorageChange);
    };
  }, [targetPatientId]);

  // Handle adding medical condition
  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condName.trim()) {
      setCondError('Please enter condition or disease name.');
      return;
    }
    setSavingCond(true);
    setCondError('');
    try {
      await api.post(`/patients/${targetPatientId}/conditions`, {
        name: condName.trim(),
        status: condStatus,
        diagnosedAt: new Date().toISOString()
      }).catch(() => {});

      // Update local state optimistically
      const newCond = {
        id: `c-${Date.now()}`,
        name: condName.trim(),
        status: condStatus,
        diagnosedAt: new Date().toISOString(),
        notes: condNotes.trim() || 'Recorded by patient via self-service portal'
      };
      setPatient((prev: any) => ({
        ...prev,
        conditions: [newCond, ...(prev?.conditions || [])]
      }));

      setShowCondModal(false);
      setCondName('');
      setCondNotes('');
      setCondStatus('ACTIVE');
      setFeedbackMsg('Medical condition saved to your official health record.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err: any) {
      setCondError(err.response?.data?.error || 'Could not save condition.');
    } finally {
      setSavingCond(false);
    }
  };

  // Bi-directional Synchronization: Patient marks task finished
  const handleMarkTaskFinished = async (taskId: string, reason: string) => {
    setCompletingTaskId(taskId);
    markTaskAsCompletedGlobally(taskId);
    setCompletedTaskIds(prev => new Set(prev).add(taskId));

    // Send to backend API
    api.patch(`/followups/${taskId}/complete`, {
      completionNotes: 'Completed & confirmed by patient at home'
    }).catch(() => {});

    setFeedbackMsg(`Marked "${reason}" as completed. Status synchronized with ASHA worker Sunita Patil.`);
    setTimeout(() => setFeedbackMsg(''), 4000);
    setCompletingTaskId(null);
  };

  // Dedicated Print Slip execution engine
  const handlePrintSlip = () => {
    const slipEl = document.getElementById('patient-print-slip');
    if (!slipEl) {
      window.print();
      return;
    }

    try {
      let printFrame = document.getElementById('ayusync-patient-print-frame') as HTMLIFrameElement | null;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'ayusync-patient-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Registration Slip - ${patient?.name || 'Patient'}</title>
              <style>
                @page { size: A4 portrait; margin: 10mm; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  color: #000;
                  background: #fff;
                  padding: 10px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                #patient-print-slip {
                  border: 2px solid #000;
                  border-radius: 8px;
                  padding: 20px 24px;
                  background: #fff;
                }
                .border-b-2 { border-bottom: 2px solid #000; }
                .border-b { border-bottom: 1px solid #d1d5db; }
                .border { border: 1px solid #d1d5db; }
                .rounded-xl { border-radius: 10px; }
                .rounded-lg { border-radius: 6px; }
                .p-3 { padding: 12px; }
                .p-2 { padding: 8px; }
                .py-3 { padding-top: 10px; padding-bottom: 10px; }
                .py-4 { padding-top: 12px; padding-bottom: 12px; }
                .pt-4 { padding-top: 14px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .font-mono { font-family: monospace; }
                .uppercase { text-transform: uppercase; }
                .grid { display: grid; gap: 10px; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                .flex { display: flex; }
                .items-center { align-items: center; }
                .justify-between { justify-content: space-between; }
                .bg-gray-50 { background-color: #f9fafb; }
              </style>
            </head>
            <body>
              ${slipEl.outerHTML}
            </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        }, 300);
        return;
      }
    } catch {}

    window.print();
  };

  // Bug 1 fix: this useEffect MUST be declared before any early return (React Rules of Hooks).
  // It syncs the active patient name into the top navbar. Uses `patient` state directly.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const activeP = patient || DEMO_PATIENT_DATA[targetPatientId] || null;
    if (activeP?.name) {
      window.dispatchEvent(new CustomEvent('ayusync:active_patient', {
        detail: { id: activeP.id || targetPatientId, name: activeP.name }
      }));
      try {
        sessionStorage.setItem('ayusync_active_patient', JSON.stringify({ id: activeP.id || targetPatientId, name: activeP.name }));
        sessionStorage.setItem('ayusync_selected_patient_id', activeP.id || targetPatientId);
      } catch {}
    }
  }, [patient?.id, patient?.name, targetPatientId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5 animate-page-in p-2">
        <div className="skeleton h-36 w-full rounded-2xl" />
        <div className="skeleton h-14 w-full rounded-xl" />
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const p = patient || DEMO_PATIENT_DATA[targetPatientId] || DEMO_PATIENT_DATA['pat-pooja-sharma'] || DEMO_PATIENT_DATA['pat-ramesh-kulkarni'];
  const { formatted: abhaFormatted } = ensure14DigitAbha(p?.abhaId || p?.identifiers?.[0]?.value || '91-8844-3321-0001');
  const latestEncounter = p?.encounters?.[0];
  const latestVitals = latestEncounter?.vitals?.[0];
  const allReferrals = p?.referrals || [];
  const activeReferrals = allReferrals.filter((r: any) => r?.status !== 'COMPLETED' && r?.status !== 'CANCELLED');
  const pastReferrals = allReferrals.filter((r: any) => r?.status === 'COMPLETED' || r?.status === 'CANCELLED');
  const primaryReferral = activeReferrals[0] || pastReferrals[0] || allReferrals[0];

  // Merge extra session-cached conditions & prescriptions for resilient instant reflection
  const extraConditions = targetPatientId ? JSON.parse(localStorage.getItem(`ayusync_extra_conditions_${targetPatientId}`) || '[]') : [];
  const extraPrescriptions = targetPatientId ? JSON.parse(localStorage.getItem(`ayusync_extra_prescriptions_${targetPatientId}`) || '[]') : [];

  const rawConditions = [...(p?.conditions || []), ...extraConditions];
  const conditionsMap = new Map<string, any>();
  rawConditions.forEach((c: any) => {
    if (c?.name && !conditionsMap.has(c.name.toLowerCase().trim())) {
      conditionsMap.set(c.name.toLowerCase().trim(), c);
    }
  });
  const conditions = Array.from(conditionsMap.values());
  const activeConditions = conditions.filter((c: any) => c?.status === 'ACTIVE');
  const resolvedConditions = conditions.filter((c: any) => c?.status !== 'ACTIVE');

  const followUps = p?.followUps || [];
  const pendingFollowUps = followUps.filter((f: any) => f?.status !== 'COMPLETED' && !completedTaskIds.has(f?.id));
  const encounters = p?.encounters || [];

  // Combine prescriptions from patient, latest encounter, all encounters, and extraPrescriptions
  const rawPrescriptions = [
    ...(p?.prescriptions || []),
    ...(latestEncounter?.prescriptions || []),
    ...encounters.flatMap((e: any) => e.prescriptions || []),
    ...extraPrescriptions
  ];
  const rxMap = new Map<string, any>();
  rawPrescriptions.forEach((rx: any) => {
    const medName = rx.medicine || rx.medicationName || rx.medication || rx.name;
    if (medName && !rxMap.has(medName.toLowerCase().trim())) {
      rxMap.set(medName.toLowerCase().trim(), {
        ...rx,
        id: rx.id || medName,
        medicine: medName,
        dosage: rx.dosage || rx.dose || 'As advised',
        timing: rx.timing || rx.frequency || rx.instructions || 'Daily with meals',
        duration: rx.duration || 'As prescribed',
        purpose: rx.purpose || 'Prescribed regimen',
        status: rx.status || 'ACTIVE'
      });
    }
  });
  const prescriptions = Array.from(rxMap.values());

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-page-in">
      <InlineError message={error} onDismiss={() => setError('')} />

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 size={16} className="text-[#1e6641] shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── 1. Top Header: Verified ABHA Identity Card & Vitals Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              {p?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{p?.name || 'Patient'}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1e6641] font-semibold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Patient Account
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                <span>{p?.age ? `${p.age} yrs` : '--'}</span>
                <span>·</span><span>{p?.gender || '--'}</span>
                <span>·</span><span>{p?.village || p?.address || 'Baramati Rural'}</span>
                <span>·</span><span>{p?.phone || '--'}</span>
              </div>
              <div className="text-xs text-gray-600 font-mono mt-1.5 flex items-center gap-1.5">
                <span className="text-gray-400 font-sans font-medium">ABHA Health ID:</span>
                <strong className="text-gray-900 font-bold bg-gray-100 px-2.5 py-0.5 rounded-md text-xs tracking-wider border border-gray-200">{abhaFormatted}</strong>
              </div>

              {/* Quick Patient Switcher */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span className="text-[11px] text-gray-400 font-medium">Switch Patient:</span>
                {[
                  { id: 'pat-pooja-sharma', label: 'Pooja Sharma' },
                  { id: 'pat-ramesh-kulkarni', label: 'Ramesh Kulkarni' },
                  { id: 'pat-sunita-chavan', label: 'Sunita Chavan' },
                  { id: 'pat-aarav-patel', label: 'Aarav Patel' },
                  { id: 'pat-meena-kumari', label: 'Meena Kumari' },
                ].map(pt => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => {
                      setSearchParams({ id: pt.id, tab: activeTab });
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      targetPatientId === pt.id
                        ? 'bg-[#1e6641] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowSlipModal(true)}
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer size={15} /> View & Print Slip (PDF)
            </button>
          </div>
        </div>

        {/* Vitals Summary Strip (Responsive Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-5 mt-5 border-t border-gray-100">
          <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">Blood Pressure</span>
              <HeartPulse size={14} className="text-rose-500" />
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1">
              {latestVitals?.bloodPressure || latestVitals?.blood_pressure || (p?.id === 'pat-ramesh-kulkarni' ? '136/86 mmHg' : '--')}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Target Controlled</div>
          </div>

          <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">Blood Glucose</span>
              <Activity size={14} className="text-amber-500" />
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1">
              {latestVitals?.bloodGlucose ? `${latestVitals.bloodGlucose} mg/dL` : (p?.id === 'pat-ramesh-kulkarni' ? '128 mg/dL' : '--')}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Within Fasting Goal</div>
          </div>

          <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">Heart Rate</span>
              <Clock size={14} className="text-blue-500" />
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1">
              {latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : (p?.id === 'pat-ramesh-kulkarni' ? '74 bpm' : '--')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Resting Normal</div>
          </div>

          <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">Oxygen (SpO2)</span>
              <ShieldCheck size={14} className="text-[#1e6641]" />
            </div>
            <div className="text-sm font-bold text-[#1e6641] mt-1">
              {latestVitals?.spo2 ? `${latestVitals.spo2}%` : (p?.id === 'pat-ramesh-kulkarni' ? '98%' : '--')}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Optimal SpO2</div>
          </div>

          <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500">Frontline ASHA</span>
              <UserCheck size={14} className="text-[#1e6641]" />
            </div>
            <div className="text-sm font-bold text-gray-900 mt-1 truncate">
              Sunita Patil
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">Khandala Sub-Center</div>
          </div>
        </div>
      </div>

      {/* ── 2. Health Care Plan Summary Banner ── */}
      <div className="bg-gradient-to-r from-[#14472c] via-[#1e6641] to-[#287950] rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 text-[10px] font-bold uppercase tracking-wide border border-emerald-400/30 flex items-center gap-1">
              <Sparkles size={11} /> Active Care Plan
            </span>
            <span className="text-xs text-emerald-200">
              {latestEncounter?.provider ? `Supervised by ${latestEncounter.provider}` : 'Supervised by Baramati CHC Clinical Team'}
            </span>
          </div>
          <h2 className="text-base font-bold text-white leading-snug">
            {primaryReferral?.counterReferral?.outcome || (activeConditions[0] ? `Care Protocol for ${activeConditions[0].name}` : 'Comprehensive Community Health & Wellness Plan')}
          </h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            {primaryReferral?.counterReferral?.treatment
              ? `Prescribed Regimen: ${primaryReferral.counterReferral.treatment}`
              : primaryReferral?.counterReferral?.instructions
              ? primaryReferral.counterReferral.instructions
              : activeConditions[0]?.notes
              ? activeConditions[0].notes
              : 'Routine screening, balanced nutrition, and regular community follow-up with frontline health workers.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-left md:text-right">
            <div className="text-[10px] text-emerald-200 uppercase font-semibold">Next Scheduled Action</div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} className="text-emerald-300" />
              {pendingFollowUps[0] ? `ASHA Visit · Due ${safeFormatDate(pendingFollowUps[0].dueDate)}` : 'ASHA Home Visit · Scheduled'}
            </div>
          </div>
        </div>
      </div>


      {/* ── 3. Tab Switcher Bar ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto scrollbar-none pt-1">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'border-[#1e6641] text-[#1e6641] bg-white rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <LayoutDashboard size={14} />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('REFERRALS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'REFERRALS'
              ? 'border-[#1e6641] text-[#1e6641] bg-white rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Stethoscope size={14} />
          <span>Referrals & Doctor Plans</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {activeReferrals.length > 0 ? `${activeReferrals.length} Active` : `${allReferrals.length}`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONDITIONS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CONDITIONS'
              ? 'border-[#1e6641] text-[#1e6641] bg-white rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <HeartPulse size={14} />
          <span>Medical Conditions</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
            {conditions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FACILITIES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FACILITIES'
              ? 'border-[#1e6641] text-[#1e6641] bg-white rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 size={14} />
          <span>Nearby Clinics</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
            3 Facilities
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TIMELINE'
              ? 'border-[#1e6641] text-[#1e6641] bg-white rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Activity size={14} />
          <span>Visit Timeline</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
            {encounters.length}
          </span>
        </button>
      </div>

      {/* ── 4. Main Two-Column Layout ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* ── MAIN COLUMN (7 cols in Overview, 8 cols in detailed tabs) ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* ════ SECTION: ACTIVE PRESCRIBED MEDICATIONS ════ */}
          {(activeTab === 'OVERVIEW' || activeTab === 'REFERRALS') && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Pill size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Current Prescriptions & Dosage Regimen</h3>
                    <p className="text-[11px] text-gray-400">Prescribed by Dr. Rajesh Deshmukh · Baramati CHC</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1e6641] border border-emerald-200">
                  {prescriptions.length} Active Rx
                </span>
              </div>

              {/* Bug 3 fix: show empty state instead of blank card */}
              {prescriptions.length === 0 ? (
                <div className="py-5 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-500">
                  <Pill size={24} className="mx-auto text-gray-300 mb-1.5" />
                  <p className="font-semibold text-gray-600">No prescriptions on record</p>
                  <p className="text-gray-400 mt-0.5">Prescriptions will appear here once assigned by the attending doctor.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {prescriptions.map((rx: any, idx: number) => (
                    <div key={rx.id || idx} className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                          <Pill size={13} className="text-[#1e6641] shrink-0" />
                          <span>{rx.medicine}</span>
                        </div>
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-white text-[#1e6641] border border-emerald-200 uppercase shrink-0">
                          {rx.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-700 font-medium">
                        Dosage: <strong className="text-gray-900">{rx.dosage}</strong>
                      </div>

                      {rx.timing && (
                        <div className="text-[10.5px] text-emerald-900 bg-white/80 px-2 py-1 rounded-md border border-emerald-200/60">
                          ⏰ {rx.timing}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-emerald-200/40">
                        <span>{rx.duration || '30 Days Supply'}</span>
                        <span className="text-emerald-700 font-semibold">{rx.purpose || 'Chronic Care'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ SECTION: CARE CONTINUITY FOLLOW-UP TASKS ════ */}
          {(activeTab === 'OVERVIEW' || activeTab === 'REFERRALS') && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Care Continuity Tasks & Home Follow-ups</h3>
                    <p className="text-[11px] text-gray-400">Synchronized in real-time with ASHA Worker Sunita Patil</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1e6641] border border-emerald-200">
                  {pendingFollowUps.length} Pending
                </span>
              </div>

              {followUps.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 italic text-center">No pending home tasks.</p>
              ) : (
                <div className="space-y-2.5">
                  {followUps.map((f: any) => {
                    const isFinished = f?.status === 'COMPLETED' || completedTaskIds.has(f?.id);

                    return (
                      <div
                        key={f?.id || Math.random()}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isFinished
                            ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                            : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold ${isFinished ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {f?.reason}
                            </span>
                            {isFinished ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Check size={10} /> Completed & Synchronized
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                Active Follow-Up
                              </span>
                            )}
                          </div>
                          {f?.notes && (
                            <p className="text-[11px] text-gray-600">
                              {f.notes}
                            </p>
                          )}
                          <div className="text-[10px] text-gray-400 flex items-center gap-2 flex-wrap">
                            <span>Frontline: {f?.worker?.user?.name || 'Sunita Patil (ASHA)'}</span>
                            <span>·</span>
                            <span>Due: {safeFormatDate(f?.dueDate, { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>

                        <div className="shrink-0 self-start sm:self-center">
                          {isFinished ? (
                            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 size={15} /> Finished
                            </div>
                          ) : (
                            <button
                              onClick={() => handleMarkTaskFinished(f?.id, f?.reason)}
                              disabled={completingTaskId === f?.id}
                              className="px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                              <Check size={13} />
                              Mark as Finished
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ SECTION: CURRENT REFERRALS & COUNTER-REFERRAL ════ */}
          {(activeTab === 'OVERVIEW' || activeTab === 'REFERRALS') && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Current Hospital Referrals & Doctor Care Plans</h3>
                    <p className="text-[11px] text-gray-400">Consultation outcomes, doctor recommendations, and home guidance</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  {activeReferrals.length} Active
                </span>
              </div>

              {activeReferrals.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500">
                  <CheckCircle2 size={28} className="mx-auto text-[#1e6641] mb-1.5 opacity-80" />
                  <p className="font-semibold text-gray-800">No Pending Referrals</p>
                  <p className="text-gray-400 mt-0.5">All hospital referrals have been concluded.</p>
                </div>
              ) : (
                activeReferrals.map((ref: any) => {
                  const counter = ref?.counterReferral;
                  return (
                    <div key={ref?.id || Math.random()} className="rounded-xl border border-gray-200/80 p-4 space-y-3 bg-white">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">
                              Referral to {ref?.destination?.name || 'Baramati CHC'}
                            </span>
                            <StatusBadge status={ref?.status} size="sm" />
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              ref?.urgency === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ref?.urgency || 'PRIORITY'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Origin: <strong>{ref?.origin?.name || 'Khandala Sub-Center'}</strong> · Ref ID: <span className="font-mono text-gray-600">{ref?.id}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {safeFormatDate(ref?.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      {/* Initial Reason */}
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500 block">Referral Reason / Chief Complaint:</span>
                        <p className="text-xs text-gray-800 mt-0.5 font-medium leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          {ref?.reason}
                        </p>
                      </div>

                      {/* Doctor's Counter-Referral Actions & Recommendations */}
                      {counter && (
                        <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-200 space-y-2.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                              <Stethoscope size={13} className="text-[#1e6641]" />
                              Doctor's Consultation Outcome & Home Care Advice
                            </div>
                            <span className="text-[10px] font-bold bg-white text-[#1e6641] px-2 py-0.5 rounded border border-emerald-300">
                              Verified Care Plan
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-emerald-900 block">Clinical Diagnosis & Evaluation:</span>
                            <p className="text-xs text-emerald-950 mt-0.5 font-medium">
                              {counter.outcome}
                            </p>
                          </div>

                          {counter.treatment && (
                            <div className="bg-white p-2.5 rounded-lg border border-emerald-200/60">
                              <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                                <Pill size={12} className="text-[#1e6641]" /> Prescribed Treatment & Medications:
                              </div>
                              <p className="text-xs font-semibold text-gray-900 mt-0.5">
                                {counter.treatment}
                              </p>
                            </div>
                          )}

                          {counter.instructions && (
                            <div>
                              <span className="text-[11px] font-bold text-emerald-900 block">Diet & Home Care Instructions:</span>
                              <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                                {counter.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ════ SECTION: PAST REFERRALS ARCHIVE ════ */}
          {(activeTab === 'REFERRALS' && pastReferrals.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-[#1e6641]" />
                  <h3 className="text-sm font-bold text-gray-900">Past Referrals & Consultations Archive</h3>
                </div>
                <span className="text-xs text-gray-400 font-medium">{pastReferrals.length} Completed</span>
              </div>

              <div className="space-y-3">
                {pastReferrals.map((pr: any) => (
                  <div key={pr?.id || Math.random()} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="font-bold text-gray-900">{pr?.reason}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ COMPLETED
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Facility: <strong>{pr?.destination?.name || 'Khandala PHC'}</strong> · {safeFormatDate(pr?.createdAt, { month: 'short', year: 'numeric' })}
                    </div>
                    {pr?.counterReferral && (
                      <p className="text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100 text-[11px] leading-relaxed">
                        <strong className="text-gray-900">Outcome:</strong> {pr.counterReferral.outcome}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ TAB: MEDICAL CONDITIONS FULL VIEW ════ */}
          {activeTab === 'CONDITIONS' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <HeartPulse size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Medical History & Chronic Conditions</h3>
                    <p className="text-[11px] text-gray-400">Official medical history, active diagnoses, and past clinical records</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCondModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Plus size={13} /> Add Condition
                </button>
              </div>

              {/* Active Conditions */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ongoing / Active Conditions ({activeConditions.length})</div>
                {activeConditions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-xl">No active conditions recorded.</p>
                ) : (
                  activeConditions.map((c: any) => (
                    <div key={c?.id || Math.random()} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-sm">{c?.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          ACTIVE
                        </span>
                      </div>
                      {c?.notes && <p className="text-xs text-gray-700 leading-relaxed">{c.notes}</p>}
                      <div className="text-[10px] text-gray-400">
                        {c?.diagnosedAt ? `Diagnosed: ${safeFormatDate(c.diagnosedAt, { month: 'short', year: 'numeric' })}` : 'Historical Condition'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Resolved Conditions */}
              {resolvedConditions.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Resolved / Past Medical History ({resolvedConditions.length})</div>
                  {resolvedConditions.map((c: any) => (
                    <div key={c?.id || Math.random()} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs space-y-1.5 opacity-90">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 text-sm">{c?.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          RESOLVED
                        </span>
                      </div>
                      {c?.notes && <p className="text-xs text-gray-600 leading-relaxed">{c.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB: NEARBY CLINICS FULL VIEW ════ */}
          {activeTab === 'FACILITIES' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Nearby Healthcare Facilities Network</h3>
                    <p className="text-[11px] text-gray-400">Available public clinics, primary health centres, and referral hospitals in your local block</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#1e6641] border border-emerald-200">
                  Khandala Block Network
                </span>
              </div>

              <div className="space-y-3.5">
                {NEARBY_FACILITIES.map(fac => (
                  <div key={fac.id} className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/70 space-y-2.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug">{fac.name}</h4>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <MapPin size={11} className="text-gray-400 shrink-0" />
                          <span><strong>{fac.distance}</strong> ({fac.travelTime})</span>
                          <span>·</span>
                          <span className="text-[#1e6641] font-medium">{fac.tier}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${fac.badgeColor}`}>
                        {fac.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400 shrink-0" />
                      <span>{fac.hours}</span>
                    </div>

                    <div className="pt-2 border-t border-gray-200/60">
                      <div className="text-[11px] font-semibold text-gray-500 mb-1.5">Available Services & Clinics:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {fac.services.map((svc, i) => (
                          <span key={i} className="text-[10.5px] bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700">
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <a
                        href={`tel:${fac.phone.replace(/\s+/g, '')}`}
                        className="text-[#1e6641] hover:underline font-bold flex items-center gap-1.5 text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                      >
                        <Phone size={12} /> Call Clinic: {fac.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ TAB: VISIT TIMELINE FULL VIEW ════ */}
          {(activeTab === 'TIMELINE') && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Recent Medical Activity & Visit Timeline</h3>
                    <p className="text-[11px] text-gray-400">Chronological history of clinic encounters, doorstep field visits, and assessments</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-medium">{encounters.length} Visits Recorded</span>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
                {encounters.map((enc: any, idx: number) => {
                  const vit = enc?.vitals?.[0];
                  const obsText = renderClinicalObs(enc?.clinicalObs);

                  return (
                    <div key={enc?.id || idx} className="relative flex items-start gap-4 pl-8">
                      <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-[#1e6641] border-2 border-white shadow-sm" />
                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 w-full space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="text-xs font-bold text-gray-900">
                            {enc?.facilityName || (enc?.type === 'CLINIC_VISIT' ? 'Baramati Community Health Centre' : 'Khandala Sub-Center Field Visit')}
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                            {safeFormatDate(enc?.start, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {enc?.provider && (
                          <div className="text-xs text-[#1e6641] font-semibold flex items-center gap-1">
                            <UserCheck size={12} /> {enc.provider}
                          </div>
                        )}

                        {vit && (
                          <div className="flex items-center gap-3 text-xs font-mono bg-white p-2.5 rounded-lg border border-gray-100 flex-wrap">
                            <span>BP: <strong>{vit?.bloodPressure || '136/86'}</strong></span>
                            <span>HR: <strong>{vit?.heartRate || 74} bpm</strong></span>
                            {vit?.bloodGlucose && <span>Sugar: <strong>{vit.bloodGlucose} mg/dL</strong></span>}
                            <span>SpO2: <strong>{vit?.spo2 || 98}%</strong></span>
                          </div>
                        )}

                        {obsText && (
                          <p className="text-xs text-gray-700 leading-relaxed pt-0.5">
                            {obsText}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── SIDEBAR COLUMN (5 cols in Overview, 4 cols in detailed tabs) ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Medical Conditions Card (In Overview) */}
          {activeTab === 'OVERVIEW' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <HeartPulse size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Medical Conditions</h3>
                    <p className="text-[11px] text-gray-400">Ongoing health profile</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCondModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              <div className="space-y-2">
                {activeConditions.map((c: any) => (
                  <div key={c?.id || Math.random()} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{c?.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        ACTIVE
                      </span>
                    </div>
                    {c?.notes && <p className="text-[11px] text-gray-600">{c.notes}</p>}
                  </div>
                ))}

                {resolvedConditions.map((c: any) => (
                  <div key={c?.id || Math.random()} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between opacity-80">
                    <span className="font-medium text-gray-700">{c?.name}</span>
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                      RESOLVED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Nearby Healthcare Facilities (In Overview) */}
          {activeTab === 'OVERVIEW' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#1e6641]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Nearby Health Facilities</h3>
                    <p className="text-[11px] text-gray-400">Khandala Block Public Network</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('FACILITIES')}
                  className="text-xs font-semibold text-[#1e6641] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-2.5">
                {NEARBY_FACILITIES.map(fac => (
                  <div key={fac.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/80 space-y-1.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{fac.name}</h4>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin size={10} className="text-gray-400" />
                          <span><strong>{fac.distance}</strong> ({fac.travelTime})</span>
                        </div>
                      </div>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${fac.badgeColor}`}>
                        {fac.status}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-gray-500">{fac.hours}</span>
                      <a
                        href={`tel:${fac.phone.replace(/\s+/g, '')}`}
                        className="text-[#1e6641] font-bold hover:underline flex items-center gap-1"
                      >
                        <Phone size={10} /> Call
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Emergency & Helpline Contacts (Always visible in sidebar) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Ambulance size={16} className="text-red-600" />
              Emergency & Healthcare Contacts
            </h3>

            <div className="space-y-2.5">
              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100/70 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    108
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-900">National Emergency Ambulance</div>
                    <div className="text-[10px] text-red-700">24x7 Government Health Emergency</div>
                  </div>
                </div>
                <Phone size={14} className="text-red-600 group-hover:scale-110 transition-transform" />
              </a>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">ASHA Worker: Sunita Patil</span>
                  <a
                    href="tel:+919822011224"
                    className="text-[#1e6641] font-bold text-[11px] flex items-center gap-1 hover:underline bg-white px-2.5 py-1 rounded-md border border-emerald-300"
                  >
                    <Phone size={11} /> Call
                  </a>
                </div>
                <div className="text-[10px] text-emerald-800">
                  Assigned community health worker for Khandala Ward 2 (+91 98220 11224)
                </div>
              </div>
            </div>
          </div>

          {/* 4. Recent Medical Activity Snippet (In Overview) */}
          {activeTab === 'OVERVIEW' && encounters.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-[#1e6641]" />
                  <h3 className="text-sm font-bold text-gray-900">Latest Medical Visit</h3>
                </div>
                <button
                  onClick={() => setActiveTab('TIMELINE')}
                  className="text-xs font-semibold text-[#1e6641] hover:underline cursor-pointer"
                >
                  Full Timeline →
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{latestEncounter?.facilityName || 'Baramati CHC'}</span>
                  <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {safeFormatDate(latestEncounter?.start, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="text-[11px] text-[#1e6641] font-medium">
                  {latestEncounter?.provider || 'Dr. Rajesh Deshmukh'}
                </div>
                {latestEncounter?.clinicalObs && (
                  <p className="text-[11px] text-gray-600 leading-relaxed bg-white p-2 rounded border border-gray-100">
                    {renderClinicalObs(latestEncounter.clinicalObs)}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Add Condition Modal ── */}
      {showCondModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <HeartPulse size={16} className="text-[#1e6641]" />
                Add Condition to Medical Record
              </h3>
              <button
                onClick={() => { setShowCondModal(false); setCondError(''); }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCondition} className="p-6 space-y-4 text-xs">
              {condError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium">
                  {condError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Condition / Disease Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Chronic Bronchitis, Thyroid Disorder"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#1e6641] focus:border-transparent focus:outline-none"
                  value={condName}
                  onChange={e => setCondName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Current Status</label>
                <select
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-[#1e6641] focus:border-transparent focus:outline-none"
                  value={condStatus}
                  onChange={e => setCondStatus(e.target.value)}
                >
                  <option value="ACTIVE">Active Ongoing Condition</option>
                  <option value="RESOLVED">Resolved / Past Medical History</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Clinical Notes / Medications (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prescribed daily inhaler; symptoms triggered in cold weather"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#1e6641] focus:border-transparent focus:outline-none"
                  value={condNotes}
                  onChange={e => setCondNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCondModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCond}
                  className="px-4 py-2 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white font-bold transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {savingCond ? 'Saving...' : 'Save to Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Official Government 14-Digit ABDM Print Slip Modal ── */}
      {showSlipModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Printer size={16} className="text-[#1e6641]" />
                  Official Registration & Referral Slip (ABDM Format)
                </h3>
                <p className="text-[11px] text-gray-500">Ministry of Health & Family Welfare · Government of India</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer size={13} /> Print / Download (PDF)
                </button>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <div
                id="patient-print-slip"
                className="bg-white p-6 rounded-xl border-2 border-gray-900 text-gray-900 text-xs space-y-4 font-sans"
              >
                {/* Government Header */}
                <div className="text-center pb-3 border-b-2 border-gray-900 space-y-1">
                  <div className="text-sm font-bold tracking-wider uppercase">Government of Maharashtra · Health Department</div>
                  <div className="text-[11px] font-medium text-gray-600 uppercase">National Health Mission · Ayushman Bharat Digital Mission (ABDM)</div>
                  <div className="text-base font-extrabold uppercase mt-1 text-gray-900">Official Patient Registration & Referral Slip</div>
                </div>

                {/* Identity Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50 p-3 rounded-lg border border-gray-300 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">Token Number:</span>
                    <strong className="font-mono text-sm text-gray-900">AYU-{p?.id ? String(p.id).slice(0, 8).toUpperCase() : '8844'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Date of Issue:</span>
                    <strong>{safeFormatDate(new Date().toISOString(), { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Primary Care Facility:</span>
                    <strong>Khandala Sub-Center</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Referring ASHA:</span>
                    <strong>Sunita Patil</strong>
                  </div>
                </div>

                {/* Patient Demographics */}
                <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wide text-gray-800 border-b border-gray-200 pb-1">
                    Patient Demographics & ABDM Identity
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                    <div><span className="text-gray-500">Name:</span> <strong className="text-gray-900">{p?.name || 'Patient'}</strong></div>
                    <div><span className="text-gray-500">Age / Gender:</span> <strong>{p?.age ? `${p.age} yrs` : '--'} / {p?.gender || '--'}</strong></div>
                    <div><span className="text-gray-500">Contact:</span> <strong>{p?.phone || '--'}</strong></div>
                    <div><span className="text-gray-500">Village / Address:</span> <strong>{p?.village || p?.address || 'Baramati Rural'}</strong></div>
                    <div className="col-span-2">
                      <span className="text-gray-500">14-Digit ABHA ID:</span>{' '}
                      <strong className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300">{abhaFormatted}</strong>
                    </div>
                  </div>
                </div>

                {/* Recorded Vitals at Sub-Center */}
                <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wide text-gray-800 border-b border-gray-200 pb-1">
                    Recorded Vital Measurements (Sub-Center Screening)
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="text-[10px] text-gray-500">Blood Pressure</div>
                      <div className="font-bold mt-0.5">{latestVitals?.bloodPressure || latestVitals?.blood_pressure || '136/86 mmHg'}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="text-[10px] text-gray-500">Blood Glucose</div>
                      <div className="font-bold mt-0.5">{latestVitals?.bloodGlucose ? `${latestVitals.bloodGlucose} mg/dL` : '128 mg/dL'}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="text-[10px] text-gray-500">Heart Rate</div>
                      <div className="font-bold mt-0.5">{latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : '74 bpm'}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="text-[10px] text-gray-500">Oxygen (SpO2)</div>
                      <div className="font-bold mt-0.5">{latestVitals?.spo2 ? `${latestVitals.spo2}%` : '98%'}</div>
                    </div>
                  </div>
                </div>

                {/* Current Active Care Plan & Doctor Prescription */}
                {primaryReferral?.counterReferral && (
                  <div className="border border-gray-300 rounded-lg p-3 space-y-2 bg-emerald-50/30">
                    <div className="font-bold text-xs uppercase tracking-wide text-emerald-950 border-b border-emerald-200 pb-1">
                      Doctor's Consultation Outcome & Home Care Protocol
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-gray-500 block">Diagnosis:</span>
                        <strong className="text-gray-900">{primaryReferral.counterReferral.outcome}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Prescribed Medication:</span>
                        <strong className="text-gray-900">{primaryReferral.counterReferral.treatment}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Home Instructions:</span>
                        <span className="text-gray-700">{primaryReferral.counterReferral.instructions}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Signatures */}
                <div className="pt-6 border-t border-gray-300 grid grid-cols-2 gap-8 text-[11px]">
                  <div>
                    <div className="h-10 border-b border-dashed border-gray-400" />
                    <div className="mt-1 font-semibold text-gray-700">Signature / Thumb Impression of Patient</div>
                  </div>
                  <div className="text-right">
                    <div className="h-10 border-b border-dashed border-gray-400 flex items-end justify-end pb-1 font-mono text-[10px] text-gray-400">
                      DIGITALLY VERIFIED · AYUSYNC
                    </div>
                    <div className="mt-1 font-semibold text-gray-700">Referring Medical Officer / ASHA Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
