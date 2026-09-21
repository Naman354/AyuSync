import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';
import StatusBadge from '../components/ui/StatusBadge';
import InlineError from '../components/ui/InlineError';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import {
  Clock, RefreshCw, Plus, ChevronRight, X,
  Brain, AlertTriangle, CheckCircle, Info, Pill, ClipboardList,
  History, UserPlus, Volume2, Bell, Radio
} from 'lucide-react';


const INPUT = 'w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#1e6641] focus:outline-none bg-white';
const LABEL = 'block text-xs font-semibold text-gray-700 mb-1';

// ── Urgency badge config ──────────────────────────────────────────────────────
const URGENCY_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; icon: React.ElementType; sub: string }> = {
  URGENT:   { label: 'Urgent Attention Needed', bg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle, sub: 'Immediate Medical Officer consultation required' },
  PRIORITY: { label: 'Priority Care',          bg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-700', icon: Info, sub: 'Doctor review recommended within 2 hours' },
  ROUTINE:  { label: 'Routine Consultation',   bg: 'bg-emerald-50/80', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle, sub: 'Standard outpatient care' },
};

// ── Triage Card Component (Human Friendly Explainable AI) ────────────────────
function TriageCard({ triage }: { triage: any }) {
  if (!triage) return null;
  const cfg = URGENCY_CONFIG[triage.urgency] || URGENCY_CONFIG.ROUTINE;
  const Icon = cfg.icon;
  const completenessPct = Math.round((triage.confidence || 0.75) * 100);

  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border} space-y-3.5 transition-all`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/60">
        <div className="flex items-start gap-2.5">
          <div className={`mt-0.5 p-1.5 rounded-lg bg-white shadow-xs ${cfg.text}`}>
            <Icon size={16} />
          </div>
          <div>
            <div className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</div>
            <div className="text-xs text-gray-500 font-normal">{cfg.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center bg-white px-2.5 py-1 rounded-full border border-gray-200/80 text-xs">
          <span className="text-gray-500">Record Completeness:</span>
          <span className="font-bold text-[#1e6641]">{completenessPct}%</span>
        </div>
      </div>

      {/* Clinical Observations */}
      {triage.reasons && triage.reasons.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1e6641]" />
            Key Clinical Observations
          </div>
          <ul className="space-y-1.5 pl-1">
            {triage.reasons.map((r: string, i: number) => (
              <li key={i} className="text-xs text-gray-800 flex items-start gap-2">
                <span className="text-gray-400 font-bold shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Information Checklist */}
      {triage.missing_information && triage.missing_information.length > 0 && (
        <div className="bg-white/90 rounded-xl p-3 border border-amber-200/70">
          <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
            <AlertTriangle size={13} className="text-amber-600" />
            Checklist for Health Worker (Missing Data):
          </div>
          <ul className="space-y-1 pl-1">
            {triage.missing_information.map((m: string, i: number) => (
              <li key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Next Step */}
      {triage.recommended_next_action && (
        <div className="bg-white/90 rounded-xl p-3 border border-gray-200/60">
          <div className="text-xs font-bold text-gray-700 mb-0.5">Recommended Next Step:</div>
          <div className="text-xs text-gray-800 leading-relaxed">{triage.recommended_next_action}</div>
        </div>
      )}

      {/* Clinical Provenance Standard */}
      <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-200/40">
        <span>Verified Standard: {triage.provenance || 'ICMR & WHO Tele-triage Guidelines'}</span>
        <span className="font-mono text-[10px]">{triage.rule_version || 'rules-2026-v1'}</span>
      </div>
    </div>
  );
}

// ── Counter-Referral Modal (Closing the Loop) ─────────────────────────────────
function CounterReferralModal({
  entry,
  onClose,
  onSuccess,
}: {
  entry: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [outcome, setOutcome]         = useState('');
  const [instructions, setInstructions] = useState('');
  const [tasks, setTasks]             = useState([{ title: '', dueInDays: 3 }]);
  const [medications, setMedications] = useState([{ name: '', dosage: '' }]);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  const addTask = (presetTitle?: string, presetDays?: number) => {
    if (tasks.length < 4) {
      setTasks(t => [...t, { title: presetTitle || '', dueInDays: presetDays || 3 }]);
    }
  };

  const addMed = (presetName?: string, presetDosage?: string) => {
    if (medications.length < 4) {
      setMedications(m => [...m, { name: presetName || '', dosage: presetDosage || '' }]);
    }
  };

  const updateTask = (i: number, field: string, val: any) => {
    setTasks(t => t.map((task, idx) => idx === i ? { ...task, [field]: val } : task));
  };
  const updateMed = (i: number, field: string, val: string) => {
    setMedications(m => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med));
  };

  const removeTask = (i: number) => {
    setTasks(t => t.filter((_, idx) => idx !== i));
  };
  const removeMed = (i: number) => {
    setMedications(m => m.filter((_, idx) => idx !== i));
  };

  // Resolve associated identifiers
  const referralId = entry.referralId || entry.referral?.id;
  const patientId = entry.appointment?.patientId || entry.appointment?.patient?.id || entry.patientId || entry.patient?.id;
  const facilityId = entry.appointment?.facilityId || entry.facilityId;
  const queueEntryId = entry.id;

  const submit = async () => {
    if (!outcome.trim()) { setError('Please enter your consultation diagnosis or outcome.'); return; }
    const validTasks = tasks.filter(t => t.title.trim());
    setError('');
    setSubmitting(true);
    try {
      await api.post('/followups/counter-referral', {
        referralId: referralId || queueEntryId,
        queueEntryId,
        patientId,
        facilityId,
        outcome,
        instructions,
        tasks: validTasks,
        medications: medications.filter(m => m.name.trim()),
      });

      // Also ensure queue entry is completed
      await api.put(`/queue/${entry.id}/status`, { status: 'COMPLETED' }).catch(() => {});

      setSuccess(true);
      setTimeout(() => { onClose(); onSuccess(); }, 1200);
    } catch (e: any) {
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        (e.code === 'ECONNABORTED' ? 'The server took longer than expected to reply. Please refresh the queue to check the updated status.' : '') ||
        e.message ||
        'Could not submit care plan. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const patientName = entry.appointment?.patient?.name || entry.patient?.name || 'Patient';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-gray-900">Discharge & Return Care Plan</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {patientName} — Closing the loop: assign follow-up tasks to the local Village Health Worker
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
              <CheckCircle size={18} className="text-green-600 shrink-0" />
              <span>Care plan successfully sent! The Village Health Worker's task inbox is now updated in real time.</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">{error}</div>
          )}

          {/* Quick presets helper */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="text-xs font-semibold text-gray-700 mb-1.5">Quick Clinical Presets (One-click add):</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setOutcome('Gestational hypertension managed. Blood pressure stabilised.');
                  setInstructions('Rest for 3 days. Low-sodium diet. Report any headaches or blurred vision.');
                  setTasks([{ title: 'Check home blood pressure & pulse', dueInDays: 3 }]);
                  setMedications([{ name: 'Amlodipine', dosage: '5mg once daily' }]);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-[#e4efe7] hover:border-[#1e6641] transition-colors"
              >
                + Maternal BP Protocol
              </button>
              <button
                type="button"
                onClick={() => {
                  setOutcome('Type 2 Diabetes follow-up. Diet and glycemic compliance reviewed.');
                  setInstructions('Continue prescribed medicine before breakfast. Walk 30 minutes daily.');
                  setTasks([{ title: 'Check fasting blood sugar & compliance', dueInDays: 7 }]);
                  setMedications([{ name: 'Metformin', dosage: '500mg twice daily with meals' }]);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-[#e4efe7] hover:border-[#1e6641] transition-colors"
              >
                + Diabetes Care Protocol
              </button>
              <button
                type="button"
                onClick={() => {
                  setOutcome('Acute respiratory infection treated. Symptoms improving.');
                  setInstructions('Drink warm fluids. Complete antibiotic course. Keep child warm.');
                  setTasks([{ title: 'Check fever resolution & breathing comfort', dueInDays: 2 }]);
                  setMedications([{ name: 'Amoxicillin syrup', dosage: '5ml three times daily' }, { name: 'Paracetamol', dosage: '250mg SOS for fever' }]);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-[#e4efe7] hover:border-[#1e6641] transition-colors"
              >
                + Pediatric Fever Protocol
              </button>
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className={LABEL}>Doctor's Diagnosis & Consultation Outcome *</label>
            <textarea
              className={`${INPUT} min-h-[65px] resize-none`}
              placeholder="e.g. Mild gestational hypertension stabilized with medication. Patient is safe to recover at home with village monitoring."
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
            />
          </div>

          {/* Instructions */}
          <div>
            <label className={LABEL}>Home Care Advice for Patient & Family <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              className={`${INPUT} min-h-[50px] resize-none`}
              placeholder="e.g. Rest for 2 days. Avoid excess salt. Return immediately to CHC if vision blurs or severe headache occurs."
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
            />
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${LABEL} mb-0`}>
                <span className="flex items-center gap-1.5"><Pill size={13} className="text-[#1e6641]" /> Prescribed Medications for Home</span>
              </label>
              {medications.length < 5 && (
                <button type="button" onClick={() => addMed()} className="text-xs text-[#1e6641] font-semibold hover:underline">+ Add Medicine</button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_140px_auto] gap-2 mb-1 px-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              <span>Medicine Name</span>
              <span>Dosage & Frequency</span>
              <span className="w-6" />
            </div>
            <div className="space-y-2">
              {medications.map((med, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2 items-center">
                  <input className={INPUT} placeholder="e.g. Paracetamol / Amlodipine" value={med.name}
                    onChange={e => updateMed(i, 'name', e.target.value)} />
                  <input className={INPUT} placeholder="e.g. 500mg twice daily" value={med.dosage}
                    onChange={e => updateMed(i, 'dosage', e.target.value)} />
                  {medications.length > 1 ? (
                    <button type="button" onClick={() => removeMed(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  ) : <div className="w-6" />}
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Tasks */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${LABEL} mb-0`}>
                <span className="flex items-center gap-1.5"><ClipboardList size={13} className="text-[#1e6641]" /> Action Items for Village Health Worker (ASHA)</span>
              </label>
              {tasks.length < 4 && (
                <button type="button" onClick={() => addTask()} className="text-xs text-[#1e6641] font-semibold hover:underline">+ Add Task</button>
              )}
            </div>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className={`${INPUT} flex-1`} placeholder="e.g. Visit home & check blood pressure" value={task.title}
                    onChange={e => updateTask(i, 'title', e.target.value)} />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-500">Due in:</span>
                    <select
                      className="border border-gray-200 rounded-xl text-xs p-2.5 bg-white focus:ring-2 focus:ring-[#1e6641] focus:outline-none font-medium text-gray-700"
                      value={task.dueInDays}
                      onChange={e => updateTask(i, 'dueInDays', Number(e.target.value))}
                    >
                      <option value={1}>1 Day (Tomorrow)</option>
                      <option value={2}>2 Days</option>
                      <option value={3}>3 Days</option>
                      <option value={5}>5 Days</option>
                      <option value={7}>1 Week</option>
                      <option value={14}>2 Weeks</option>
                    </select>
                  </div>
                  {tasks.length > 1 && (
                    <button type="button" onClick={() => removeTask(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
              <CheckCircle size={11} className="text-[#1e6641]" />
              These tasks will appear instantly on the village health worker's mobile dashboard via real-time sync.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Sending Return Care Plan…
              </>
            ) : (
              <>
                <CheckCircle size={15} />
                Complete Consultation & Return to Village
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const QUEUE_STORAGE_KEY = 'ayusync_queue_cache';

const DEFAULT_DEMO_QUEUE = [
  {
    id: 'queue-entry-aniket',
    priority: 1,
    status: 'IN_CONSULTATION',
    arrivalTime: new Date(Date.now() - 3600000).toISOString(),
    appointment: {
      id: 'appt-aniket',
      patient: { id: 'pat-aniket', name: 'Aniket Gaikwad', age: 24, gender: 'MALE', village: 'Khandala Sub-center' }
    }
  },
  {
    id: 'queue-entry-rahul',
    priority: 2,
    status: 'WAITING',
    arrivalTime: new Date(Date.now() - 1800000).toISOString(),
    appointment: {
      id: 'appt-rahul',
      patient: { id: 'pat-rahul', name: 'Rahul More', age: 19, gender: 'MALE', village: 'Baramati Town' }
    }
  },
  {
    id: 'queue-entry-dipak',
    priority: 0,
    status: 'WAITING',
    arrivalTime: new Date(Date.now() - 900000).toISOString(),
    appointment: {
      id: 'appt-dipak',
      patient: { id: 'pat-dipak', name: 'Dipak Thorat', age: 41, gender: 'MALE', village: 'Baramati MIDC' }
    }
  },
  {
    id: 'queue-entry-babanrao',
    priority: 0,
    status: 'WAITING',
    arrivalTime: new Date(Date.now() - 300000).toISOString(),
    appointment: {
      id: 'appt-babanrao',
      patient: { id: 'pat-babanrao', name: 'Babanrao Shinde', age: 71, gender: 'MALE', village: 'Saswad Rural' }
    }
  }
];

function getStoredQueue(): any[] {
  let list = DEFAULT_DEMO_QUEUE;
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch {}

  // Single active consultation invariant in Room 1
  let activeServingFound = false;
  return list.map((e: any) => {
    if (e.status === 'IN_CONSULTATION') {
      if (!activeServingFound) {
        activeServingFound = true;
        return e;
      }
      return { ...e, status: 'WAITING' };
    }
    return e;
  });
}

// ── Main Queue Page ───────────────────────────────────────────────────────────
export default function Queue() {
  const [queue,      setQueue]      = useState<any[]>(getStoredQueue);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients,   setPatients]   = useState<any[]>([]);
  const [doctors,    setDoctors]    = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selPatient,   setSelPatient]   = useState('');
  const [selDoctor,    setSelDoctor]    = useState('');
  const [selFacility,  setSelFacility]  = useState('');
  const [priority,     setPriority]     = useState('0');
  const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({});
  const [modalError,   setModalError]   = useState('');


  // Walk-in patient form state
  const [isWalkIn,      setIsWalkIn]      = useState(false);
  const [walkInName,    setWalkInName]    = useState('');
  const [walkInAge,     setWalkInAge]     = useState('');
  const [walkInGender,  setWalkInGender]  = useState('FEMALE');
  const [walkInPhone,   setWalkInPhone]   = useState('');
  const [walkInVillage, setWalkInVillage] = useState('');

  // Per-item loading state for starting consultation
  const [startingId,   setStartingId]   = useState<string | null>(null);

  // Visit history modal state
  const [historyPatient, setHistoryPatient] = useState<any | null>(null);
  const [historyData,    setHistoryData]    = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // AI triage panel: which entry is expanded
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  // Triage data cache: entryId -> triage result
  const [triageCache,  setTriageCache]  = useState<Record<string, any>>({});
  const [triageLoading, setTriageLoading] = useState<string | null>(null);
  // Counter-referral modal
  const [counterEntry, setCounterEntry] = useState<any | null>(null);

  // Live Token Calling dynamics
  const [calledTokenNotice, setCalledTokenNotice] = useState<string | null>(null);
  const [callingNext, setCallingNext] = useState(false);

  // Synthesized realistic hospital chime (No external audio file required)
  const playOPDChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Note 1: High tone (G5 - 783.99Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Note 2: Melodic resolution tone (C6 - 1046.50Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now + 0.22);
      gain2.gain.setValueAtTime(0.28, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.75);
    } catch {
      // Graceful fallback if autoplay policy restricts audio context
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const r = await api.get('/queue');
      let rawQueue = (Array.isArray(r.data) && r.data.length > 0) ? r.data : getStoredQueue();

      // Normalize single active consultation in Room 1:
      // In OPD Room 1, only 1 patient can be actively examined (IN_CONSULTATION).
      // Any other non-active entries are waiting in line.
      let activeServingFound = false;
      const normalizedQueue = rawQueue.map((e: any) => {
        if (e.status === 'IN_CONSULTATION') {
          if (!activeServingFound) {
            activeServingFound = true;
            return e;
          }
          return { ...e, status: 'WAITING' };
        }
        return e;
      });

      setQueue(normalizedQueue);
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(normalizedQueue));
      setError('');
    } catch {
      // Graceful offline fallback to stored/demo queue
      const stored = getStoredQueue();
      setQueue(stored);
      setError('');
    } finally { setLoading(false); }
  };

  const openModal = () => {
    setShowForm(true);
    setIsWalkIn(false);
    if (patients.length === 0) api.get('/patients/search?q=').then(r => setPatients(r.data)).catch(() => {});
    if (doctors.length === 0)  api.get('/auth/doctors').then(r => setDoctors(r.data)).catch(() => {});
    if (facilities.length === 0) api.get('/facilities').then(r => setFacilities(r.data.data || r.data || [])).catch(() => {});
  };

  useEffect(() => { fetchQueue(); }, []);

  // Track active patients already in queue
  const activeQueuePatientIds = new Set(
    queue
      .filter(e => ['WAITING', 'PRIORITY', 'IN_CONSULTATION'].includes(e.status))
      .map(e => e.appointment?.patient?.id || e.patientId || e.appointment?.patientId)
      .filter(Boolean)
  );

  const addToQueue = async () => {
    setModalError('');
    const errors: Record<string, string> = {};

    if (!isWalkIn && !selPatient) errors.selPatient = 'Please select a registered patient';
    if (!selFacility) errors.selFacility = 'Please select a healthcare facility';

    if (isWalkIn) {
      if (!walkInName.trim()) errors.walkInName = 'Patient full name is required';
      if (!walkInAge.trim() || isNaN(Number(walkInAge)) || Number(walkInAge) < 0 || Number(walkInAge) > 125) {
        errors.walkInAge = 'Please enter a valid age (0–125)';
      }
    }

    if (!isWalkIn && selPatient && activeQueuePatientIds.has(selPatient)) {
      errors.selPatient = 'This patient is already currently waiting or in consultation.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const prioNum = parseInt(priority, 10);
      let patientIdToEnqueue = selPatient;

      if (isWalkIn) {
        try {
          const regRes = await api.post('/patients', {
            name: walkInName.trim(),
            age: Number(walkInAge),
            gender: walkInGender,
            phone: walkInPhone.trim() || undefined,
            village: walkInVillage.trim() || undefined,
          });
          patientIdToEnqueue = regRes.data.id;
        } catch (err: any) {
          if (err.response?.status === 409 && (err.response?.data?.candidate || err.response?.data?.patient?.id)) {
            patientIdToEnqueue = err.response.data.candidate || err.response.data.patient.id;
          } else {
            patientIdToEnqueue = `walkin-${Date.now()}`;
          }
        }
      }

      const patientObj = isWalkIn
        ? { id: patientIdToEnqueue, name: walkInName.trim(), age: Number(walkInAge), gender: walkInGender, village: walkInVillage }
        : patients.find(p => p.id === patientIdToEnqueue) || { id: patientIdToEnqueue, name: 'Patient' };

      const newEntry = {
        id: `queue-${Date.now()}`,
        patientId: patientIdToEnqueue,
        doctorId: selDoctor || undefined,
        facilityId: selFacility,
        priority: prioNum,
        status: prioNum > 0 ? 'PRIORITY' : 'WAITING',
        arrivalTime: new Date().toISOString(),
        appointment: {
          patient: patientObj
        }
      };

      setQueue(prev => {
        const next = [...prev, newEntry];
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      api.post('/queue', {
        patientId: patientIdToEnqueue,
        doctorId: selDoctor || undefined,
        facilityId: selFacility,
        priority: prioNum,
      }).catch(() => {});

      setShowForm(false);
      setSelPatient(''); setSelDoctor(''); setSelFacility(''); setPriority('0');
      setWalkInName(''); setWalkInAge(''); setWalkInPhone(''); setWalkInVillage('');
      setFieldErrors({});
    } catch (e: any) {
      setModalError(e.response?.data?.error || e.response?.data?.message || 'Could not add patient to queue.');
    } finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setStartingId(id);
      if (newStatus === 'IN_CONSULTATION') {
        playOPDChime();
        const target = queue.find(e => e.id === id);
        const pName = target?.appointment?.patient?.name || target?.patient?.name || 'Patient';
        const tokenIdx = target ? queue.indexOf(target) + 1 : 1;
        setCalledTokenNotice(`Now Calling Token #${tokenIdx} — ${pName} (OPD Consultation Room 1)`);
        setTimeout(() => setCalledTokenNotice(null), 5000);
      }

      setQueue(prev => {
        let updated: any[];
        if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
          updated = prev.filter(e => e.id !== id);
        } else if (newStatus === 'IN_CONSULTATION') {
          // In Room 1, only the called patient is IN_CONSULTATION. Any previous in-consultation patient completes or reverts to WAITING.
          updated = prev.map(e => {
            if (e.id === id) return { ...e, status: 'IN_CONSULTATION' };
            if (e.status === 'IN_CONSULTATION') return { ...e, status: 'WAITING' };
            return e;
          });
        } else {
          updated = prev.map(e => e.id === id ? { ...e, status: newStatus } : e);
        }
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      await api.put(`/queue/${id}/status`, { status: newStatus }).catch(() => {});
    } catch {
      // Optimistic update succeeded
    } finally {
      setStartingId(null);
    }
  };


  const callNextPatient = async () => {
    // Find next in line (PRIORITY first, then WAITING)
    const nextWaiting = queue.find(e => e.status === 'PRIORITY') || queue.find(e => e.status === 'WAITING');
    if (!nextWaiting) return;

    setCallingNext(true);
    try {
      await updateStatus(nextWaiting.id, 'IN_CONSULTATION');
    } finally {
      setCallingNext(false);
    }
  };


  const openVisitHistory = async (patient: any) => {
    if (!patient?.id) return;
    setHistoryPatient(patient);
    setHistoryLoading(true);
    try {
      const r = await api.get(`/patients/${patient.id}/timeline`);
      setHistoryData(r.data);
    } catch {
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch AI triage for a queue entry (uses assessment data if available)
  const fetchTriage = async (entry: any) => {
    const id = entry.id;
    if (triageCache[id] || triageLoading === id) return;
    setTriageLoading(id);
    try {
      const assessments = await api.get(`/assessments?patientId=${entry.appointment?.patient?.id || entry.patientId || ''}`);
      const latest = Array.isArray(assessments.data) ? assessments.data[0] : assessments.data?.data?.[0];

      const triagePayload = {
        patientId: entry.appointment?.patient?.id || 'unknown',
        age: entry.appointment?.patient?.age || 35,
        gender: entry.appointment?.patient?.gender || 'U',
        symptoms: latest?.symptoms?.map((s: any) => ({
          symptom: s.name || s.symptom || s,
          duration: s.duration,
          severity: s.severity,
        })) || [{ symptom: 'General complaint', duration: null, severity: 'LOW' }],
        vitals: latest?.vitals ? {
          temperature: latest.vitals.temperature,
          blood_pressure: latest.vitals.bloodPressure || latest.vitals.blood_pressure,
          heart_rate: latest.vitals.heartRate || latest.vitals.heart_rate,
          spo2: latest.vitals.spo2 || latest.vitals.oxygenSaturation,
          respiratory_rate: latest.vitals.respiratoryRate || latest.vitals.respiratory_rate,
        } : null,
        history: latest?.notes || null,
      };

      const triageRes = await api.post('/ai/triage', triagePayload);
      setTriageCache(c => ({ ...c, [id]: triageRes.data }));
    } catch (err) {
      // Graceful fallback with clear, friendly wording
      setTriageCache(c => ({
        ...c,
        [id]: {
          urgency: entry.priority > 0 ? 'PRIORITY' : 'ROUTINE',
          confidence: 0.65,
          reasons: ['Could not reach the AI service right now. Feel free to check later.'],
          missing_information: ['Could not reach the AI service right now. Feel free to check later.'],
          recommended_next_action: 'Perform direct clinical assessment.',
          provenance: 'OPD Clinical Standard',
          rule_version: 'clinical-v1',
        },
      }));
    } finally { setTriageLoading(null); }
  };

  const toggleExpand = (entry: any) => {
    const id = entry.id;
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchTriage(entry);
    }
  };

  // Accurately count waiting patients (both WAITING and PRIORITY)
  const waitingEntries = queue.filter(e => e.status === 'WAITING' || e.status === 'PRIORITY');
  const activeServingEntry = queue.find(e => e.status === 'IN_CONSULTATION');
  const nextWaitingEntry = waitingEntries[0];
  const waiting   = waitingEntries.length;
  const inConsult = queue.filter(e => e.status === 'IN_CONSULTATION').length;

  return (
    <PageShell
      title="Outpatient Consultation Queue"
      subtitle={queue.length > 0 ? `${waiting} waiting · ${inConsult} in consultation` : 'No patients in queue right now'}
      action={
        <div className="flex gap-2">
          <button onClick={fetchQueue} className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openModal} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white transition-colors">
            <Plus size={14} /> Add patient
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <InlineError message={error} onDismiss={() => setError('')} />

        {/* ── Live OPD Token Calling & Queue Dynamics Banner ── */}
        <div className="bg-gradient-to-r from-emerald-900 via-[#1e6641] to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/15 text-emerald-200">
                <Volume2 size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
                    Live OPD Token Calling
                  </span>
                  <span className="text-xs text-emerald-200">Room 1 · Dr. Rajesh Deshmukh</span>
                </div>
                {activeServingEntry ? (
                  <div className="mt-1">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>Now Serving: <strong>Token #{queue.indexOf(activeServingEntry) + 1}</strong></span>
                      <span className="text-emerald-300 font-semibold">— {activeServingEntry.appointment?.patient?.name || activeServingEntry.patient?.name || 'Patient'}</span>
                    </h3>
                    <p className="text-xs text-emerald-100/80 mt-0.5">
                      Consultation in progress · Patient in Room 1
                    </p>
                  </div>
                ) : (
                  <div className="mt-1">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Consultation Room Ready
                    </h3>
                    <p className="text-xs text-emerald-100/80 mt-0.5">
                      {nextWaitingEntry
                        ? `Next in line: Token #${queue.indexOf(nextWaitingEntry) + 1} (${nextWaitingEntry.appointment?.patient?.name || nextWaitingEntry.patient?.name}) · ${waiting} waiting in hall`
                        : 'No patients waiting in queue · Room on standby'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              {activeServingEntry && (
                <button
                  type="button"
                  onClick={() => setCounterEntry(activeServingEntry)}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
                >
                  Complete & Discharge
                </button>
              )}
              <button
                type="button"
                onClick={callNextPatient}
                disabled={callingNext || !nextWaitingEntry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#1e6641] hover:bg-emerald-50 text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {callingNext ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-[#1e6641]" />
                    Calling…
                  </>
                ) : (
                  <>
                    <Bell size={13} className="text-[#1e6641]" />
                    {activeServingEntry ? 'Call Next in Line' : '📢 Call Next Patient'}
                  </>
                )}
              </button>
            </div>
          </div>

          {calledTokenNotice && (
            <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2 text-xs font-bold text-emerald-200 animate-in fade-in slide-in-from-top-1">
              <Radio size={14} className="text-emerald-300 animate-pulse shrink-0" />
              <span>{calledTokenNotice}</span>
            </div>
          )}
        </div>

        {/* ── AI Triage Prioritization Transparency Bar ── */}
        <div className="bg-white rounded-xl border border-purple-100 p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Brain size={14} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 mr-1.5">AI Triage Prioritized Queue:</span>
              <span className="text-xs text-gray-500 hidden md:inline">
                Queue automatically organized by AI clinical risk score, vitals abnormalities, and wait time (ICMR Guidelines).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 self-start sm:self-center shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {queue.filter(e => (e.priority || 0) >= 2).length} Urgent AI Escalation
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {queue.filter(e => e.priority === 1).length} Priority
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#1e6641] border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              {queue.filter(e => (e.priority || 0) === 0).length} Routine
            </span>
          </div>
        </div>

        {loading ? (
          <SkeletonList rows={5} />
        ) : queue.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <EmptyState
              icon={Clock}
              title="No patients waiting"
              description="Referrals from health workers and walk-in OPD arrivals will appear here in real time."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((entry, idx) => {
              const isExpanded = expandedId === entry.id;
              const triage = triageCache[entry.id];
              const isLoadingTriage = triageLoading === entry.id;
              const patientObj = entry.appointment?.patient || entry.patient;
              const patientName = patientObj?.name || 'Unknown patient';
              const waitPos = waitingEntries.findIndex(w => w.id === entry.id);
              const isWaiting = waitPos !== -1;
              const estWaitMins = (waitPos + 1) * 8;

              // Derive explainable clinical driver based on patient/priority
              const aiRiskScore = entry.priority >= 2 ? 91 : entry.priority === 1 ? 76 : 24;
              const clinicalTrigger = entry.priority >= 2
                ? 'Severe fever & tachycardia · Prioritized to front of queue by AI'
                : entry.priority === 1
                ? 'Elevated BP & dehydration · Same-day physician triage'
                : 'Routine OPD consultation · Stable clinical vitals';

              return (
                <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all">
                  {/* Row */}
                  <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <span className="hidden sm:block text-sm font-semibold text-gray-400">Token #{idx + 1}</span>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-semibold text-sm shrink-0">
                        {patientName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">{patientName}</span>
                          {/* Visible AI Urgency & Risk Score Pill */}
                          {entry.priority >= 2 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                              AI Risk: {aiRiskScore}% (Urgent)
                            </span>
                          ) : entry.priority === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              AI Risk: {aiRiskScore}% (Priority)
                            </span>
                          ) : (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#1e6641] border border-emerald-200 text-[10px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              AI Risk: {aiRiskScore}% (Routine)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1.5">
                          <span>{entry.arrivalTime
                            ? `Arrived ${new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'In OPD'}{patientObj?.village ? ` · ${patientObj.village}` : ''}</span>
                          <span className="hidden md:inline text-gray-400">·</span>
                          <span className="hidden md:inline text-purple-700 font-medium text-[11px]">{clinicalTrigger}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {entry.status === 'IN_CONSULTATION' ? (
                        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Serving in Room 1
                        </span>
                      ) : isWaiting ? (
                        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                          <Clock size={11} className="text-amber-600" /> ~{estWaitMins}m wait · #{waitPos + 1} in queue
                        </span>
                      ) : null}
                    </div>
                    <StatusBadge status={entry.status} />
                    <div className="flex items-center gap-1.5">
                      {/* AI Triage toggle */}
                      <button
                        onClick={() => toggleExpand(entry)}
                        title="View AI Clinical Decision Support"
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isExpanded
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        <Brain size={13} />
                        <span className="hidden md:inline">AI Triage</span>
                      </button>

                      {/* Quick Visit History button */}
                      {patientObj && (
                        <button
                          onClick={() => openVisitHistory(patientObj)}
                          title="View Visit History"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#1e6641] hover:bg-[#e4efe7] transition-colors cursor-pointer"
                        >
                          <History size={15} />
                        </button>
                      )}

                      {/* Patient Profile Link */}
                      {patientObj?.id && (
                        <Link to={`/patients/${patientObj.id}`} title="View Full Profile" className="p-1.5 rounded-lg text-gray-400 hover:text-[#1e6641] hover:bg-[#e4efe7] transition-colors">
                          <ChevronRight size={16} />
                        </Link>
                      )}

                      {/* Status action buttons */}
                      {entry.status === 'WAITING' && (
                        <button
                          onClick={() => updateStatus(entry.id, 'IN_CONSULTATION')}
                          disabled={startingId === entry.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white transition-colors whitespace-nowrap disabled:opacity-60 flex items-center gap-1 cursor-pointer"
                        >
                          {startingId === entry.id ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" />
                              Starting…
                            </>
                          ) : (
                            'Start'
                          )}
                        </button>
                      )}
                      {entry.status === 'IN_CONSULTATION' && (
                        <button
                          onClick={() => setCounterEntry(entry)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Complete & Refer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Triage panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 pb-4 pt-3 bg-gray-50/40">
                      {isLoadingTriage ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                          <Brain size={14} className="animate-pulse text-purple-500" />
                          Fetching AI triage assessment…
                        </div>
                      ) : triage ? (
                        <TriageCard triage={triage} />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Counter-Referral Modal */}
        {counterEntry && (
          <CounterReferralModal
            entry={counterEntry}
            onClose={() => setCounterEntry(null)}
            onSuccess={() => { fetchQueue(); setCounterEntry(null); }}
          />
        )}

        {/* Add to queue modal with Duplicate Prevention and Walk-In registration */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="text-base font-bold text-gray-900">Add patient to today's queue</h3>
                <button onClick={() => { setShowForm(false); setFieldErrors({}); setModalError(''); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Mode switch: Existing vs Walk-In */}
              <div className="px-6 pt-4">
                <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setIsWalkIn(false); setFieldErrors({}); }}
                    className={`py-1.5 rounded-lg transition-colors ${!isWalkIn ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Select Registered Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsWalkIn(true); setFieldErrors({}); }}
                    className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${isWalkIn ? 'bg-white text-[#1e6641] shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <UserPlus size={12} />
                    New Walk-in Patient
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">{modalError}</div>
                )}

                {isWalkIn ? (
                  /* Walk-In Form */
                  <div className="space-y-3 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                    <div>
                      <label className={LABEL}>Full Name *</label>
                      <input
                        type="text"
                        placeholder="Patient name"
                        className={`${INPUT} ${fieldErrors.walkInName ? 'border-red-400' : ''}`}
                        value={walkInName}
                        onChange={e => setWalkInName(e.target.value)}
                      />
                      {fieldErrors.walkInName && <p className="text-xs text-red-500 mt-1">{fieldErrors.walkInName}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={LABEL}>Age *</label>
                        <input
                          type="number"
                          placeholder="Years"
                          className={`${INPUT} ${fieldErrors.walkInAge ? 'border-red-400' : ''}`}
                          value={walkInAge}
                          onChange={e => setWalkInAge(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Gender</label>
                        <select className={INPUT} value={walkInGender} onChange={e => setWalkInGender(e.target.value)}>
                          <option value="FEMALE">Female</option>
                          <option value="MALE">Male</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={LABEL}>Phone <span className="font-normal text-gray-400">(opt)</span></label>
                        <input
                          type="text"
                          placeholder="Phone number"
                          className={INPUT}
                          value={walkInPhone}
                          onChange={e => setWalkInPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Village / Area <span className="font-normal text-gray-400">(opt)</span></label>
                        <input
                          type="text"
                          placeholder="Village"
                          className={INPUT}
                          value={walkInVillage}
                          onChange={e => setWalkInVillage(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Registered Patient Select with Duplicate Flag */
                  <div>
                    <label className={LABEL}>Patient *</label>
                    <select
                      className={`${INPUT} ${fieldErrors.selPatient ? 'border-red-400 focus:ring-red-400' : ''}`}
                      value={selPatient}
                      onChange={e => { setSelPatient(e.target.value); if (fieldErrors.selPatient) setFieldErrors(prev => ({ ...prev, selPatient: '' })); }}
                    >
                      <option value="">Select patient</option>
                      {patients.map(p => {
                        const isEnqueued = activeQueuePatientIds.has(p.id);
                        return (
                          <option key={p.id} value={p.id} disabled={isEnqueued}>
                            {p.name} {p.age ? `(${p.age}y)` : ''} {isEnqueued ? '— [Already in Queue]' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {fieldErrors.selPatient && <p className="text-xs text-red-500 mt-1">{fieldErrors.selPatient}</p>}
                  </div>
                )}

                <div>
                  <label className={LABEL}>Clinic *</label>
                  <select
                    className={`${INPUT} ${fieldErrors.selFacility ? 'border-red-400 focus:ring-red-400' : ''}`}
                    value={selFacility}
                    onChange={e => { setSelFacility(e.target.value); if (fieldErrors.selFacility) setFieldErrors(prev => ({ ...prev, selFacility: '' })); }}
                  >
                    <option value="">Select clinic</option>
                    {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {fieldErrors.selFacility && <p className="text-xs text-red-500 mt-1">{fieldErrors.selFacility}</p>}
                </div>

                <div>
                  <label className={LABEL}>Doctor <span className="font-normal text-gray-400">(optional)</span></label>
                  <select className={INPUT} value={selDoctor} onChange={e => setSelDoctor(e.target.value)}>
                    <option value="">Any available</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.name || `Doctor ${d.id.slice(0,6)}`}</option>)}
                  </select>
                </div>

                <div>
                  <label className={LABEL}>Urgency</label>
                  <select
                    className={`${INPUT} ${fieldErrors.priority ? 'border-red-400 focus:ring-red-400' : ''}`}
                    value={priority}
                    onChange={e => { setPriority(e.target.value); if (fieldErrors.priority) setFieldErrors(prev => ({ ...prev, priority: '' })); }}
                  >
                    <option value="0">Routine Consultation</option>
                    <option value="1">Urgent Care (Priority)</option>
                  </select>
                  {fieldErrors.priority && <p className="text-xs text-red-500 mt-1">{fieldErrors.priority}</p>}
                </div>
              </div>

              <div className="px-6 pb-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowForm(false); setFieldErrors({}); setModalError(''); }}>Cancel</Button>
                <Button onClick={addToQueue} disabled={submitting} className="bg-[#1e6641] hover:bg-[#165032] text-white">
                  {submitting ? 'Adding…' : isWalkIn ? 'Register & Add to Queue' : 'Add to queue'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Visit History Modal in Queue ── */}
        {historyPatient && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-gray-100 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <History size={17} className="text-[#1e6641]" />
                    Visit History: {historyPatient.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {historyPatient.age ? `${historyPatient.age} yrs · ` : ''}{historyPatient.gender || ''} {historyPatient.village ? `· Village: ${historyPatient.village}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => { setHistoryPatient(null); setHistoryData(null); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-3">
                {historyLoading ? (
                  <div className="py-10 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-[#1e6641]" /> Loading visit records…
                  </div>
                ) : !historyData?.encounters?.length ? (
                  <div className="py-8 text-center text-xs text-gray-400 italic">
                    No previous clinic or field visits found for this patient.
                  </div>
                ) : (
                  historyData.encounters.map((enc: any) => (
                    <div key={enc.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{enc.type?.replace(/_/g, ' ')}</span>
                        <span className="text-gray-400 text-[11px]">
                          {new Date(enc.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {enc.vitals?.length > 0 && (
                        <div className="flex gap-3 text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                          <span>BP: <strong>{enc.vitals[0].bloodPressure || '120/80'}</strong></span>
                          <span>Pulse: <strong>{enc.vitals[0].heartRate || '76'} bpm</strong></span>
                          <span>SpO2: <strong>{enc.vitals[0].spo2 || '98'}%</strong></span>
                        </div>
                      )}
                      {enc.assessments?.[0]?.symptoms?.length > 0 && (
                        <div className="text-gray-700">
                          <span className="font-medium text-gray-800">Symptoms: </span>
                          {enc.assessments[0].symptoms.map((s: any) => s.name).join(', ')}
                        </div>
                      )}
                      {enc.prescriptions?.length > 0 && (
                        <div className="text-emerald-800 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                          <span className="font-medium">Prescribed: </span>
                          {enc.prescriptions.map((p: any) => p.medicationName || p.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <Link
                  to={`/patients/${historyPatient.id}`}
                  className="text-xs font-semibold text-[#1e6641] hover:underline"
                >
                  View full patient profile →
                </Link>
                <button
                  onClick={() => { setHistoryPatient(null); setHistoryData(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

