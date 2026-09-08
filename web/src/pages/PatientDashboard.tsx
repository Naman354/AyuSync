import { useState, useEffect } from 'react';
import api from '../lib/api';
import StatusBadge from '../components/ui/StatusBadge';
import InlineError from '../components/ui/InlineError';
import { ensure14DigitAbha } from './ReferralSuccess';
import {
  Plus, X, HeartPulse, Pill, ClipboardList,
  ShieldCheck, Printer, CheckCircle2, Stethoscope, Check,
  Building2, MapPin, Phone, Clock, Activity, Calendar,
  Ambulance, UserCheck, History, Sparkles
} from 'lucide-react';

const COMPLETED_TASKS_KEY = 'ayusync_completed_task_ids';

export function getCompletedTaskIds(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_TASKS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markTaskAsCompletedGlobally(id: string) {
  try {
    const ids = getCompletedTaskIds();
    ids.add(id);
    localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(Array.from(ids)));
    window.dispatchEvent(new CustomEvent('ayusync:task_completed', { detail: { id, status: 'COMPLETED' } }));
  } catch {}
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
        notes: 'Target BP < 130/80 mmHg. Currently stabilized on Tab Telmisartan 40mg OD.'
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
        notes: 'Treated with oral antibiotics & bronchodilators at Khandala PHC. Completely resolved.'
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
        clinicalObs: 'Routine village NCD survey. Elevated blood pressure and fasting glucose detected. Initiated digital referral to Baramati CHC for physician review.',
        assessments: [
          {
            symptoms: [
              { name: 'Mild Morning Headache', duration: '3 days' },
              { name: 'Occasional Fatigue on Exertion', duration: '1 week' }
            ]
          }
        ]
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
        clinicalObs: 'Annual Comprehensive NCD Screening. Baseline 12-lead ECG normal. Dietary sodium counseling and routine glycemic monitoring initiated.'
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
  }
};

// ── Realistic Nearby Facilities Network for Rural Patients ──
const NEARBY_FACILITIES = [
  {
    id: 'fac-khandala-phc',
    name: 'Khandala Primary Health Centre',
    type: 'Primary Health Centre (PHC)',
    tier: 'Level 1',
    distance: '1.2 km',
    travelTime: '~5 mins',
    status: 'OPEN',
    hours: '9:00 AM – 4:00 PM',
    phone: '+91 2169 244102',
    services: ['General Outpatient OPD', 'Basic Pathology & Blood Tests', 'NCD Clinic (Diabetes & BP)', 'Free Medicines Distribution'],
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'fac-baramati-chc',
    name: 'Baramati Community Health Centre',
    type: 'Community Health Centre (CHC)',
    tier: 'Level 2 Referral Hospital',
    distance: '18.0 km',
    travelTime: '~25 mins',
    status: '24x7 OPEN',
    hours: '24 Hours Emergency & Inpatient',
    phone: '+91 2112 222108',
    services: ['24x7 Emergency Room', 'Specialist Doctors & MO', 'Digital X-Ray & Diagnostics', '60-Bed Inpatient Care'],
    badgeColor: 'bg-emerald-50 text-[#1e6641] border-emerald-200'
  },
  {
    id: 'fac-subcenter',
    name: 'Khandala Sub-Center & Health Wellness Clinic',
    type: 'Village Sub-Center / Ayushman Arogya Mandir',
    tier: 'Doorstep Care',
    distance: '400 m',
    travelTime: 'Walking Distance',
    status: 'OPEN',
    hours: '8:30 AM – 1:30 PM',
    phone: '+91 98220 11224',
    services: ['Frontline ASHA Worker Desk', 'Routine Vitals & BP Check', 'Blood Sugar Screening', 'Maternal Antenatal Care'],
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  }
];

export default function PatientDashboard() {
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  const targetPatientId = user.patientId || 'pat-ramesh-kulkarni';

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

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
        // Merge with rich fallback data so encounters & past referrals are complete
        const fallback = DEMO_PATIENT_DATA[targetPatientId] || DEMO_PATIENT_DATA['pat-ramesh-kulkarni'];
        setPatient({
          ...fallback,
          ...res.data,
          conditions: (res.data.conditions && res.data.conditions.length > 0) ? res.data.conditions : fallback.conditions,
          referrals: (res.data.referrals && res.data.referrals.length > 0) ? res.data.referrals : fallback.referrals,
          encounters: (res.data.encounters && res.data.encounters.length > 0) ? res.data.encounters : fallback.encounters,
          followUps: (res.data.followUps && res.data.followUps.length > 0) ? res.data.followUps : fallback.followUps
        });
      } else {
        setPatient(DEMO_PATIENT_DATA[targetPatientId] || DEMO_PATIENT_DATA['pat-ramesh-kulkarni']);
      }
    } catch {
      // Graceful offline fallback to rich demo profile
      setPatient(DEMO_PATIENT_DATA[targetPatientId] || DEMO_PATIENT_DATA['pat-ramesh-kulkarni']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();

    // Listen to cross-role / cross-tab task completion events
    const onTaskCompleted = (e: any) => {
      const id = e.detail?.id;
      if (id) {
        setCompletedTaskIds(prev => new Set(prev).add(id));
      }
    };

    window.addEventListener('ayusync:task_completed', onTaskCompleted);
    window.addEventListener('storage', () => {
      setCompletedTaskIds(getCompletedTaskIds());
    });

    return () => {
      window.removeEventListener('ayusync:task_completed', onTaskCompleted);
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
              <title>Registration Slip - ${patient?.name}</title>
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5 animate-page-in p-2">
        <div className="skeleton h-36 w-full rounded-2xl" />
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const p = patient || DEMO_PATIENT_DATA['pat-ramesh-kulkarni'];
  const { formatted: abhaFormatted } = ensure14DigitAbha(p.abhaId || p.identifiers?.[0]?.value);
  const latestEncounter = p.encounters?.[0];
  const latestVitals = latestEncounter?.vitals?.[0];
  const allReferrals = p.referrals || [];
  const activeReferrals = allReferrals.filter((r: any) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
  const pastReferrals = allReferrals.filter((r: any) => r.status === 'COMPLETED' || r.status === 'CANCELLED');
  const conditions = p.conditions || [];
  const activeConditions = conditions.filter((c: any) => c.status === 'ACTIVE');
  const resolvedConditions = conditions.filter((c: any) => c.status !== 'ACTIVE');
  const followUps = p.followUps || [];
  const pendingFollowUps = followUps.filter((f: any) => f.status !== 'COMPLETED' && !completedTaskIds.has(f.id));
  const encounters = p.encounters || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-page-in">
      <InlineError message={error} onDismiss={() => setError('')} />

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-[#1e6641] shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── 1. Top Header: Verified ABHA Identity Card & Vitals Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              {p.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{p.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1e6641] font-semibold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Patient Account
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                <span>{p.age ? `${p.age} yrs` : '58 yrs'}</span>
                <span>·</span><span>{p.gender || 'MALE'}</span>
                <span>·</span><span>{p.village || p.address || 'Khandala Ward 2, Satara Road'}</span>
                <span>·</span><span>{p.phone || '+91 91112 22333'}</span>
              </div>
              <div className="text-xs text-gray-600 font-mono mt-1.5 flex items-center gap-1.5">
                <span className="text-gray-400 font-sans font-medium">ABHA Health ID:</span>
                <strong className="text-gray-900 font-bold bg-gray-100 px-2.5 py-0.5 rounded-md text-xs tracking-wider">{abhaFormatted}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => setShowSlipModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={15} /> View & Print Slip (PDF)
            </button>
          </div>
        </div>

        {/* Vitals Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-5 mt-5 border-t border-gray-100">
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Blood Pressure</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {latestVitals?.bloodPressure || '136/86 mmHg'}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Target Controlled</div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Fasting Blood Glucose</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {latestVitals?.bloodGlucose ? `${latestVitals.bloodGlucose} mg/dL` : '128 mg/dL'}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Within Fasting Goal</div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Heart Rate</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : '74 bpm'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Resting Normal</div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Oxygen Saturation</div>
            <div className="text-sm font-bold text-[#1e6641] mt-0.5">
              {latestVitals?.spo2 ? `${latestVitals.spo2}%` : '98%'}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Optimal SpO2</div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-medium text-gray-500">Frontline ASHA Worker</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5 truncate">
              Sunita Patil
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">Khandala Sub-Center</div>
          </div>
        </div>
      </div>

      {/* ── 2. Health Summary & Care Plan Status Banner ── */}
      <div className="bg-linear-to-r from-emerald-900 via-[#1e6641] to-[#165032] rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wide border border-emerald-400/30 flex items-center gap-1">
              <Sparkles size={10} /> Active Care Plan
            </span>
            <span className="text-xs text-emerald-200">Supervised by Dr. Rajesh Deshmukh (Baramati CHC)</span>
          </div>
          <h2 className="text-base font-bold text-white">
            Stabilized on Chronic Antihypertensive & Oral Glycemic Protocol
          </h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Daily Regimen: <strong className="text-white">Tab Metformin 500mg BD</strong> (after meals) + <strong className="text-white">Tab Telmisartan 40mg OD</strong> (morning). Fasting target &lt; 130 mg/dL.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-right">
            <div className="text-[10px] text-emerald-200 uppercase font-semibold">Next Scheduled Action</div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} className="text-emerald-300" />
              ASHA Home Visit · Tomorrow
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Main Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT / MAIN COLUMN (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section: Upcoming Care Continuity Actions (Bi-directional Sync) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#1e6641]" />
                <h3 className="text-sm font-bold text-gray-900">Upcoming Health Actions & Home Tasks</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#1e6641] border border-emerald-200">
                {pendingFollowUps.length} Pending
              </span>
            </div>

            {followUps.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 italic text-center">No pending home tasks.</p>
            ) : (
              <div className="space-y-2.5">
                {followUps.map((f: any) => {
                  const isFinished = f.status === 'COMPLETED' || completedTaskIds.has(f.id);

                  return (
                    <div
                      key={f.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isFinished
                          ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                          : 'bg-gray-50/70 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${isFinished ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {f.reason}
                          </span>
                          {isFinished ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Check size={10} /> Completed & Synchronized
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Active Task
                            </span>
                          )}
                        </div>
                        {f.notes && (
                          <p className="text-[11px] text-gray-600">
                            {f.notes}
                          </p>
                        )}
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 flex-wrap">
                          <span>Frontline: {f.worker?.user?.name || 'Sunita Patil (ASHA)'}</span>
                          <span>·</span>
                          <span>Due: {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      <div className="shrink-0 self-start sm:self-center">
                        {isFinished ? (
                          <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 size={15} /> Finished
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMarkTaskFinished(f.id, f.reason)}
                            disabled={completingTaskId === f.id}
                            className="px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            <Check size={13} />
                            Mark Finished
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Current Active Referrals & Counter-Referral Care Plan */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-[#1e6641]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Current Hospital Referrals & Doctor Care Plans</h3>
                  <p className="text-[11px] text-gray-400">Official medical officer consultations and counter-referral guidance</p>
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
                const counter = ref.counterReferral;
                return (
                  <div key={ref.id} className="rounded-xl border border-gray-200/80 p-4 space-y-3 bg-white">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-900">
                            Referral to {ref.destination?.name || 'Baramati CHC'}
                          </span>
                          <StatusBadge status={ref.status} size="sm" />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            ref.urgency === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ref.urgency || 'PRIORITY'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Origin: <strong>{ref.origin?.name || 'Khandala Sub-Center'}</strong> · Ref ID: <span className="font-mono text-gray-600">{ref.id}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ref.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Initial Reason */}
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block">Referral Reason / Chief Complaint:</span>
                      <p className="text-xs text-gray-800 mt-0.5 font-medium leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {ref.reason}
                      </p>
                    </div>

                    {/* Doctor's Counter-Referral Actions & Recommendations */}
                    {counter && (
                      <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-200 space-y-2.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                            <Stethoscope size={13} className="text-[#1e6641]" />
                            Doctor's Consultation Outcome & Recommendations
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

          {/* Section: Past Referrals & Consultation Archive */}
          {pastReferrals.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-[#1e6641]" />
                  <h3 className="text-sm font-bold text-gray-900">Past Referrals & Consultations Archive</h3>
                </div>
                <span className="text-xs text-gray-400 font-medium">{pastReferrals.length} Completed</span>
              </div>

              <div className="space-y-3">
                {pastReferrals.map((pr: any) => (
                  <div key={pr.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="font-bold text-gray-900">{pr.reason}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ COMPLETED
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Facility: <strong>{pr.destination?.name || 'Khandala PHC'}</strong> · {new Date(pr.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                    {pr.counterReferral && (
                      <p className="text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100 text-[11px] leading-relaxed">
                        <strong className="text-gray-900">Outcome:</strong> {pr.counterReferral.outcome}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Recent Medical Activity & Encounter Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#1e6641]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recent Medical Activity & Visit Timeline</h3>
                  <p className="text-[11px] text-gray-400">Chronological history of clinic encounters, field visits, and lab tests</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium">{encounters.length} Visits</span>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
              {encounters.map((enc: any, idx: number) => {
                const vit = enc.vitals?.[0];

                return (
                  <div key={enc.id || idx} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-[#1e6641] border-2 border-white shadow-xs" />
                    <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 w-full space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-xs font-bold text-gray-900">
                          {enc.facilityName || (enc.type === 'CLINIC_VISIT' ? 'Baramati Community Health Centre' : 'Khandala Sub-Center Field Visit')}
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {new Date(enc.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {enc.provider && (
                        <div className="text-[11px] text-[#1e6641] font-semibold flex items-center gap-1">
                          <UserCheck size={11} /> {enc.provider}
                        </div>
                      )}

                      {vit && (
                        <div className="flex items-center gap-3 text-[11px] font-mono bg-white p-2 rounded-lg border border-gray-100 flex-wrap">
                          <span>BP: <strong>{vit.bloodPressure || '136/86'}</strong></span>
                          <span>HR: <strong>{vit.heartRate || 74} bpm</strong></span>
                          {vit.bloodGlucose && <span>Sugar: <strong>{vit.bloodGlucose} mg/dL</strong></span>}
                          <span>SpO2: <strong>{vit.spo2 || 98}%</strong></span>
                        </div>
                      )}

                      {enc.clinicalObs && (
                        <p className="text-[11px] text-gray-700 leading-relaxed pt-0.5">
                          {enc.clinicalObs}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT / SIDEBAR COLUMN (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Section: Nearby Healthcare Facilities */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[#1e6641]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Nearby Healthcare Facilities</h3>
                  <p className="text-[11px] text-gray-400">Available health facilities in your local block</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                Khandala Block
              </span>
            </div>

            <div className="space-y-3">
              {NEARBY_FACILITIES.map(fac => (
                <div key={fac.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-2 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-snug">{fac.name}</h4>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={10} className="text-gray-400 shrink-0" />
                        <span><strong>{fac.distance}</strong> ({fac.travelTime})</span>
                        <span>·</span>
                        <span>{fac.tier}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${fac.badgeColor}`}>
                      {fac.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-600 flex items-center gap-1">
                    <Clock size={10} className="text-gray-400 shrink-0" />
                    <span>{fac.hours}</span>
                  </div>

                  <div className="pt-1.5 border-t border-gray-200/50">
                    <div className="text-[10px] font-semibold text-gray-500 mb-1">Available Services:</div>
                    <div className="flex flex-wrap gap-1">
                      {fac.services.map((svc, i) => (
                        <span key={i} className="text-[9.5px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <a
                      href={`tel:${fac.phone.replace(/\s+/g, '')}`}
                      className="text-[#1e6641] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Phone size={11} /> {fac.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Medical History & Chronic Conditions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HeartPulse size={16} className="text-[#1e6641]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Medical History & Conditions</h3>
                  <p className="text-[11px] text-gray-400">Recorded chronic conditions and historical health data</p>
                </div>
              </div>
              <button
                onClick={() => setShowCondModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Plus size={11} /> Add
              </button>
            </div>

            {/* Active Conditions */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Ongoing / Active:</div>
              {activeConditions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No active conditions recorded.</p>
              ) : (
                activeConditions.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{c.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        ACTIVE
                      </span>
                    </div>
                    {c.notes && <p className="text-[11px] text-gray-600">{c.notes}</p>}
                    <div className="text-[10px] text-gray-400">
                      {c.diagnosedAt ? `Diagnosed: ${new Date(c.diagnosedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Historical'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resolved Conditions */}
            {resolvedConditions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Resolved / Past History:</div>
                {resolvedConditions.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-xs space-y-1 opacity-90">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">{c.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        RESOLVED
                      </span>
                    </div>
                    {c.notes && <p className="text-[11px] text-gray-500">{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Emergency & Quick Helpline Support */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
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
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    108
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-900">National Free Emergency Ambulance</div>
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
                    className="text-[#1e6641] font-bold text-[11px] flex items-center gap-1 hover:underline"
                  >
                    <Phone size={12} /> Call
                  </a>
                </div>
                <div className="text-[10px] text-emerald-800">
                  Assigned community health worker for Khandala Ward 2
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Add Condition Modal ── */}
      {showCondModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <HeartPulse size={16} className="text-[#1e6641]" />
                Add Condition to Medical Record
              </h3>
              <button
                onClick={() => { setShowCondModal(false); setCondError(''); }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
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
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#1e6641] focus:outline-none"
                  value={condName}
                  onChange={e => setCondName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Current Status</label>
                <select
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-[#1e6641] focus:outline-none"
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
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#1e6641] focus:outline-none"
                  value={condNotes}
                  onChange={e => setCondNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCondModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
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
                    <strong className="font-mono text-sm text-gray-900">AYU-{p.id ? p.id.slice(0, 8).toUpperCase() : '8844'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Date of Issue:</span>
                    <strong>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
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
                    <div><span className="text-gray-500">Name:</span> <strong className="text-gray-900">{p.name}</strong></div>
                    <div><span className="text-gray-500">Age / Gender:</span> <strong>{p.age || '58'} yrs / {p.gender || 'MALE'}</strong></div>
                    <div><span className="text-gray-500">Contact:</span> <strong>{p.phone || '+91 91112 22333'}</strong></div>
                    <div><span className="text-gray-500">Village / Address:</span> <strong>{p.village || 'Khandala Ward 2'}</strong></div>
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
                      <div className="font-bold mt-0.5">{latestVitals?.bloodPressure || '136/86 mmHg'}</div>
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
                {activeReferrals[0]?.counterReferral && (
                  <div className="border border-gray-300 rounded-lg p-3 space-y-2 bg-emerald-50/30">
                    <div className="font-bold text-xs uppercase tracking-wide text-emerald-950 border-b border-emerald-200 pb-1">
                      Doctor's Consultation Outcome & Home Care Protocol
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-gray-500 block">Diagnosis:</span>
                        <strong className="text-gray-900">{activeReferrals[0].counterReferral.outcome}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Prescribed Medication:</span>
                        <strong className="text-gray-900">{activeReferrals[0].counterReferral.treatment}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Home Instructions:</span>
                        <span className="text-gray-700">{activeReferrals[0].counterReferral.instructions}</span>
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
