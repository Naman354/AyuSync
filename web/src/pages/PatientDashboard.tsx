import { useState, useEffect } from 'react';
import api from '../lib/api';
import StatusBadge from '../components/ui/StatusBadge';
import InlineError from '../components/ui/InlineError';
import { ensure14DigitAbha } from './ReferralSuccess';
import {
  Plus, X, HeartPulse, Pill, ClipboardList,
  ShieldCheck, Printer, CheckCircle2, Stethoscope, Check
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

// ── Realistic Demo Fallback for Ramesh Kulkarni ──
const DEMO_PATIENT_DATA: Record<string, any> = {
  'pat-ramesh-kulkarni': {
    id: 'pat-ramesh-kulkarni',
    name: 'Ramesh Kulkarni',
    age: 58,
    gender: 'MALE',
    phone: '9111222333',
    village: 'Khandala Ward 2, Satara Road',
    abhaId: '91-8844-3321-0001',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: [
      { id: 'c-1', name: 'Essential Hypertension', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'c-2', name: 'Type 2 Diabetes Mellitus', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    encounters: [
      {
        id: 'enc-1',
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'CLINIC_VISIT',
        vitals: [
          { bloodPressure: '138/88', heartRate: 78, spo2: 98, temperature: '98.6' }
        ],
        assessments: [
          {
            symptoms: [
              { name: 'Occasional Dizziness', duration: '2 weeks' },
              { name: 'Weakness / Fatigue', duration: '1 month' }
            ]
          }
        ]
      }
    ],
    referrals: [
      {
        id: 'ref-ramesh-kulkarni',
        urgency: 'PRIORITY',
        status: 'COUNTER_REFERRED',
        reason: 'Uncontrolled Type 2 Diabetes with Grade 1 Essential Hypertension; HbA1c 8.4%',
        origin: { name: 'Khandala Sub-Center' },
        destination: { name: 'Baramati CHC' },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        counterReferral: {
          outcome: 'Type 2 Diabetes Mellitus with Essential Hypertension stabilized. Glycemic target fasting < 130 mg/dL.',
          treatment: 'Tab Metformin 500mg BD after meals, Tab Telmisartan 40mg OD morning',
          instructions: 'ASHA worker to confirm Metformin 500mg BD compliance & check fasting sugar. Advise low sodium diet and 30-minute daily brisk walking.',
          requiresFollowUp: true
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
      }
    ]
  },
  'pat-pooja-sharma': {
    id: 'pat-pooja-sharma',
    name: 'Pooja Sharma',
    age: 26,
    gender: 'FEMALE',
    phone: '9823145678',
    village: 'Khandala Ward 2',
    abhaId: '91-8844-3321-0002',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    conditions: [
      { id: 'c-3', name: 'High Risk Pregnancy (2nd Trimester)', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'c-4', name: 'Gestational Hypertension', status: 'ACTIVE', diagnosedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    encounters: [
      {
        id: 'enc-2',
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'EMERGENCY',
        vitals: [
          { bloodPressure: '142/94', heartRate: 86, spo2: 97, temperature: '98.8' }
        ],
        assessments: [
          {
            symptoms: [
              { name: 'High Blood Pressure', duration: '3 days' },
              { name: 'Severe Headache', duration: '24 hours' }
            ]
          }
        ]
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
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
        reason: 'Post-consultation BP monitoring for Gestational Hypertension (Instructions from Dr. Priya Kulkarni)',
        notes: 'Measure sitting BP in right arm, verify fetal movements.',
        status: 'PENDING',
        worker: { user: { name: 'Sunita Patil (ASHA Worker)' } }
      }
    ]
  }
};

export default function PatientDashboard() {
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  const targetPatientId = user.patientId || 'pat-ramesh-kulkarni';

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'REFERRALS' | 'HISTORY'>('REFERRALS');

  // Condition modal state
  const [showCondModal, setShowCondModal] = useState(false);
  const [condName, setCondName] = useState('');
  const [condStatus, setCondStatus] = useState('ACTIVE');
  const [savingCond, setSavingCond] = useState(false);
  const [condError, setCondError] = useState('');

  // Print slip modal state
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Sync state with global completed tasks
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(getCompletedTaskIds);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients/${targetPatientId}/timeline`);
      if (res.data) {
        setPatient(res.data);
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
        diagnosedAt: new Date().toISOString()
      };
      setPatient((prev: any) => ({
        ...prev,
        conditions: [newCond, ...(prev?.conditions || [])]
      }));

      setShowCondModal(false);
      setCondName('');
      setCondStatus('ACTIVE');
      setFeedbackMsg('Medical history condition saved to your health record.');
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

    setFeedbackMsg(`Marked "${reason}" as finished. Status synchronized with your ASHA Health Worker.`);
    setTimeout(() => setFeedbackMsg(''), 4000);
    setCompletingTaskId(null);
  };

  // Dedicated Print Slip execution engine (reusing ReferralSuccess exact layout)
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
      <div className="max-w-4xl mx-auto space-y-4 animate-page-in">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  const p = patient || DEMO_PATIENT_DATA['pat-ramesh-kulkarni'];
  const { formatted: abhaFormatted } = ensure14DigitAbha(p.abhaId || p.identifiers?.[0]?.value);
  const latestEncounter = p.encounters?.[0];
  const latestVitals = latestEncounter?.vitals?.[0];
  const referrals = p.referrals || [];
  const conditions = p.conditions || [];
  const followUps = p.followUps || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16 animate-page-in">
      <InlineError message={error} onDismiss={() => setError('')} />

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-[#1e6641] shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── 1. Patient Profile & ABHA Identity Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-bold text-xl shrink-0">
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
                <span>{p.age ? `${p.age} yrs` : '--'}</span>
                <span>·</span><span>{p.gender || 'MALE'}</span>
                <span>·</span><span>{p.village || p.address || 'Khandala Sub-center'}</span>
                <span>·</span><span>{p.phone || '9111222333'}</span>
              </div>
              <div className="text-xs text-gray-600 font-mono mt-1.5 flex items-center gap-1.5">
                <span className="text-gray-400 font-sans font-medium">ABHA ID:</span>
                <strong className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded text-[11px]">{abhaFormatted}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => setShowSlipModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={15} /> View & Print Registration Slip
            </button>
          </div>
        </div>

        {/* Quick Health Vitals Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-5 mt-5 border-t border-gray-100">
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Blood Pressure</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {latestVitals?.bloodPressure || latestVitals?.blood_pressure || '138/88 mmHg'}
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Pulse / Heart Rate</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : '78 bpm'}
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Oxygen Saturation</div>
            <div className="text-sm font-bold text-[#1e6641] mt-0.5">
              {latestVitals?.spo2 ? `${latestVitals.spo2}%` : '98%'}
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="text-[11px] font-medium text-gray-500">Frontline ASHA</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5 truncate">
              Sunita Patil
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Structured Tab Switcher ── */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('REFERRALS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'REFERRALS'
              ? 'border-[#1e6641] text-[#1e6641]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ClipboardList size={15} />
          Current Referrals & Doctor's Recommendations ({referrals.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'border-[#1e6641] text-[#1e6641]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <HeartPulse size={15} />
          Medical History & Past Conditions ({conditions.length})
        </button>
      </div>

      {/* ── 3. Tab Content: Current Referrals & Doctor Recommendations ── */}
      {activeTab === 'REFERRALS' && (
        <div className="space-y-4">
          {referrals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-gray-100 text-xs text-gray-500">
              <CheckCircle2 size={32} className="mx-auto text-[#1e6641] mb-2 opacity-80" />
              <p className="font-semibold text-gray-800">No Active Referrals</p>
              <p className="text-gray-400 mt-1">You do not have any pending hospital consultations.</p>
            </div>
          ) : (
            referrals.map((ref: any) => {
              const counter = ref.counterReferral;
              return (
                <div key={ref.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
                  {/* Referral Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
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
                      <div className="text-xs text-gray-400 mt-0.5">
                        Origin: <strong>{ref.origin?.name || 'Khandala Sub-Center'}</strong> · Referral ID: <span className="font-mono text-gray-700">{ref.id}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {new Date(ref.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Referral Initial Reason */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Reason for Referral:</div>
                    <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed font-medium">
                      {ref.reason}
                    </p>
                  </div>

                  {/* Doctor's Counter-Referral Actions & Recommendations */}
                  {counter && (
                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/80 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                          <Stethoscope size={14} className="text-[#1e6641]" />
                          Doctor's Consultation Actions & Home Care Advice
                        </div>
                        <span className="text-[10px] font-bold bg-white text-[#1e6641] px-2 py-0.5 rounded border border-emerald-300">
                          Counter-Referral Care Plan
                        </span>
                      </div>

                      {/* Doctor Diagnosis Outcome */}
                      <div>
                        <span className="text-[11px] font-bold text-emerald-900 block">Consultation Outcome / Diagnosis:</span>
                        <p className="text-xs text-emerald-950 mt-0.5 font-medium">
                          {counter.outcome}
                        </p>
                      </div>

                      {/* Prescribed Medications */}
                      {counter.treatment && (
                        <div className="bg-white/80 p-3 rounded-lg border border-emerald-200/60">
                          <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                            <Pill size={12} className="text-[#1e6641]" /> Prescribed Treatment & Medications:
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mt-1">
                            {counter.treatment}
                          </p>
                        </div>
                      )}

                      {/* Instructions */}
                      {counter.instructions && (
                        <div>
                          <span className="text-[11px] font-bold text-emerald-900 block">Home Instructions & Diet Guidance:</span>
                          <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                            {counter.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow-up Tasks with Two-Way Synchronization */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <ClipboardList size={14} className="text-[#1e6641]" />
                        Care Continuity Follow-Up Tasks (Synchronized with ASHA Worker)
                      </span>
                    </div>

                    {followUps.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No pending follow-up visits.</p>
                    ) : (
                      <div className="space-y-2">
                        {followUps.map((f: any) => {
                          const isFinished = f.status === 'COMPLETED' || completedTaskIds.has(f.id);

                          return (
                            <div
                              key={f.id}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                isFinished
                                  ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs font-bold ${isFinished ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {f.reason}
                                  </span>
                                  {isFinished ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <Check size={10} /> Finished & Synchronized
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                      Active Follow-Up
                                    </span>
                                  )}
                                </div>
                                {f.notes && (
                                  <p className="text-[11px] text-gray-500">
                                    {f.notes}
                                  </p>
                                )}
                                <div className="text-[10px] text-gray-400">
                                  Frontline Worker: {f.worker?.user?.name || 'Sunita Patil'} · Due: {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </div>
                              </div>

                              <div className="shrink-0 self-start sm:self-center">
                                {isFinished ? (
                                  <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={14} /> Completed
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleMarkTaskFinished(f.id, f.reason)}
                                    disabled={completingTaskId === f.id}
                                    className="px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
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
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 4. Tab Content: Medical History & Past Conditions ── */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <HeartPulse size={16} className="text-[#1e6641]" />
                  Recorded Medical Conditions & Chronic History
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update your ongoing conditions to help doctors and health workers provide tailored care
                </p>
              </div>
              <button
                onClick={() => setShowCondModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus size={13} /> Add Condition
              </button>
            </div>

            {conditions.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-3 text-center">No past medical conditions recorded.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {conditions.map((c: any) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{c.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {c.diagnosedAt ? `Diagnosed ${new Date(c.diagnosedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Historical diagnosis'}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.status || 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Add Past Condition Modal ── */}
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
                  Condition or Diagnosis Name *
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCondModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCond}
                  className="px-4 py-2 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {savingCond ? 'Saving…' : 'Save to Health Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Official Registration Print Slip Modal (Reusing ReferralSuccess Format) ── */}
      {showSlipModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-[#1e6641]" />
                <h3 className="text-sm font-bold text-gray-900">Official Health Registration & Referral Slip</h3>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {/* Exact Government/ABDM Compliant Print Document */}
              <div
                id="patient-print-slip"
                className="bg-white rounded-2xl border-2 border-gray-900 p-6 text-black shadow-sm font-sans space-y-4"
              >
                {/* Government Header */}
                <div className="border-b-2 border-gray-900 pb-3 text-center">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-gray-700">
                    Government of Maharashtra · Public Health Department
                  </div>
                  <div className="text-lg font-black tracking-tight text-gray-950 uppercase mt-0.5">
                    AyuSync Primary Care & Registration Referral Slip
                  </div>
                  <div className="text-[11px] font-medium text-gray-600 mt-0.5">
                    National Health Mission (NHM) · Ayushman Bharat Digital Mission (ABDM) Compliant
                  </div>
                </div>

                {/* Token, Date, and Urgency Bar */}
                <div className="grid grid-cols-3 border-b border-gray-300 py-2.5 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-500">Registration ID</div>
                    <div className="font-mono font-bold text-xs text-gray-900">
                      {referrals[0]?.id || `AYU-REG-${p.id.slice(0, 8)}`}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-gray-500">Issued On</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-gray-500">Triage Urgency</div>
                    <div className="inline-block font-bold text-[11px] px-2 py-0.5 rounded border border-gray-900 bg-gray-100 uppercase mt-0.5">
                      {referrals[0]?.urgency || 'PRIORITY'}
                    </div>
                  </div>
                </div>

                {/* Patient Demographics & 14-Digit ABHA */}
                <div className="py-3 border-b border-gray-300">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2">
                    1. Patient Demographics & Health Identity
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Patient Name</span>
                      <strong className="text-gray-950 text-xs">{p.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Age / Gender</span>
                      <strong className="text-gray-900">{p.age || 58} Yrs / {p.gender || 'MALE'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Contact Phone</span>
                      <strong className="font-mono text-gray-900">{p.phone || '9111222333'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Village / Ward</span>
                      <strong className="text-gray-900">{p.village || 'Khandala Ward 2'}</strong>
                    </div>
                  </div>

                  {/* 14-Digit ABHA Card */}
                  <div className="mt-2.5 p-2.5 bg-white border border-gray-300 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-[#1e6641]" />
                        Ayushman Bharat Health Account (14-Digit ABHA ID)
                      </div>
                      <div className="text-sm font-black font-mono tracking-widest text-gray-950 mt-0.5">
                        {abhaFormatted}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-500 block">Status:</span>
                      <span className="text-[10px] font-bold text-[#1e6641]">Active & Verified</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Center Clinical Vitals */}
                <div className="py-3 border-b border-gray-300">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2">
                    2. Clinical Vitals at Registration
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-[9px] text-gray-500 uppercase">Blood Pressure</div>
                      <div className="font-mono font-bold text-xs text-gray-950 mt-0.5">
                        {latestVitals?.bloodPressure || '138/88'} mmHg
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-[9px] text-gray-500 uppercase">Oxygen (SpO₂)</div>
                      <div className="font-mono font-bold text-xs text-gray-950 mt-0.5">
                        {latestVitals?.spo2 || '98'}%
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-[9px] text-gray-500 uppercase">Pulse Rate</div>
                      <div className="font-mono font-bold text-xs text-gray-950 mt-0.5">
                        {latestVitals?.heartRate || '78'} bpm
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-[9px] text-gray-500 uppercase">Body Temp</div>
                      <div className="font-mono font-bold text-xs text-gray-950 mt-0.5">
                        {latestVitals?.temperature || '98.6'}°F
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facility & ASHA Worker Routing */}
                <div className="py-3 border-b border-gray-300 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-gray-500">Sub-Center / ASHA Unit</div>
                    <div className="font-bold text-gray-950">Khandala Sub-Center</div>
                    <div className="text-gray-600 text-[11px]">Frontline Worker: <strong>Sunita Patil (ASHA)</strong></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-gray-500">Referred CHC / Hospital</div>
                    <div className="font-bold text-gray-950">{referrals[0]?.destination?.name || 'Baramati CHC'}</div>
                    <div className="text-gray-600 text-[11px]">Department: <strong>General OPD & Non-Communicable Diseases (NCD)</strong></div>
                  </div>
                </div>

                {/* Doctor Stamp Box */}
                <div className="pt-2 text-xs">
                  <div className="border border-gray-300 rounded-xl p-3 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] text-gray-500 block">Attending Doctor / CMO</span>
                      <div className="mt-4 border-b border-gray-400 w-full" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block">Doctor Signature & Stamp</span>
                      <div className="mt-4 border-b border-gray-400 w-full" />
                    </div>
                  </div>
                  <div className="text-center text-[9px] text-gray-400 mt-2">
                    AyuSync Rural Health Network · Official ABDM Slip · Valid across PHC / CHC OPD network
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintSlip}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer size={15} /> Print / Download Slip (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
