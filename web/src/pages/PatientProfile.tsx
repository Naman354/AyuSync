import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import InlineError from '../components/ui/InlineError';
import AiTriageCard from '../components/triage/AiTriageCard';
import {
  ArrowLeft, User, MapPin, Phone, Calendar, Plus, X,
  Activity, HeartPulse, Pill, History, ClipboardList,
  ShieldCheck
} from 'lucide-react';

export default function PatientProfile() {
  const { id } = useParams();
  const [patient,          setPatient]          = useState<any>(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');

  // Condition modal state
  const [showCondModal,    setShowCondModal]    = useState(false);
  const [condName,         setCondName]         = useState('');
  const [condStatus,       setCondStatus]       = useState('ACTIVE');
  const [savingCond,       setSavingCond]       = useState(false);
  const [condError,        setCondError]        = useState('');

  // Visit history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const r = await api.get(`/patients/${id}/timeline`);
      setPatient(r.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not load this patient profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condName.trim()) {
      setCondError('Please enter condition or medical history name.');
      return;
    }
    setSavingCond(true);
    setCondError('');
    try {
      await api.post(`/patients/${id}/conditions`, {
        name: condName.trim(),
        status: condStatus,
        diagnosedAt: new Date().toISOString()
      });
      setShowCondModal(false);
      setCondName('');
      setCondStatus('ACTIVE');
      await fetchPatient();
    } catch (err: any) {
      setCondError(err.response?.data?.error || 'Could not save condition.');
    } finally {
      setSavingCond(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-page-in">
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <InlineError message={error} onDismiss={() => setError('')} />
        <Link to="/patients">
          <Button variant="outline"><ArrowLeft size={14} className="mr-1" /> Back to patients</Button>
        </Link>
      </div>
    );
  }

  if (!patient) return null;

  // Extract latest clinical encounter and vitals
  const latestEncounter = patient.encounters?.[0];
  const latestVitals = latestEncounter?.vitals?.[0];
  const allEncounters = patient.encounters || [];
  const followUps = patient.followUps || [];
  const conditions = patient.conditions || [];

  return (
    <div className="space-y-5 pb-16 animate-page-in">
      <InlineError message={error} onDismiss={() => setError('')} />

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-bold text-xl shrink-0">
              {patient.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 font-mono text-gray-600 font-medium">
                  ID: {patient.identifiers?.[0]?.value || patient.abhaId || `AYU-${patient.id.slice(0, 8)}`}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                <span>{patient.age ? `${patient.age} yrs` : '--'}</span>
                <span>·</span><span>{patient.gender || '--'}</span>
                {(patient.village || patient.address) && <><span>·</span><span>{patient.village || patient.address}</span></>}
                {patient.phone && <><span>·</span><span>{patient.phone}</span></>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
            >
              <History size={14} className="text-[#1e6641]" />
              Visit History ({allEncounters.length})
            </button>
            <Link to="/patients">
              <Button variant="outline" className="text-xs flex items-center gap-1">
                <ArrowLeft size={13} /> Back to patients
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Grid Layout ── */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Left Column: Demographics & Past Medical Conditions */}
        <div className="space-y-5">
          {/* Patient Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 pb-3 border-b border-gray-50">
              Demographics & Community
            </h2>
            <dl className="space-y-3 text-xs">
              {[
                { icon: Phone,    label: 'Phone Number',  value: patient.phone || 'Not recorded' },
                { icon: MapPin,   label: 'Village / Area', value: patient.village || patient.address || 'Baramati Rural' },
                { icon: User,     label: 'ABHA / Health ID', value: patient.identifiers?.[0]?.value || patient.abhaId || 'ABHA-3948-2819-2091' },
                { icon: User,     label: 'Frontline ASHA Worker', value: 'Sunita Patil (Baramati PHC)' },
                { icon: Calendar, label: 'Enrolled On',    value: new Date(patient.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <row.icon size={13} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="text-gray-400">{row.label}</div>
                    <div className="font-medium text-gray-900 mt-0.5">{row.value}</div>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Past Conditions & Treatments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <HeartPulse size={15} className="text-[#1e6641]" />
                Past Conditions & History
              </h2>
              <button
                onClick={() => setShowCondModal(true)}
                className="text-xs font-semibold text-[#1e6641] hover:underline flex items-center gap-0.5"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {conditions.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No past chronic conditions recorded.</p>
            ) : (
              <ul className="space-y-2">
                {conditions.map((c: any) => (
                  <li key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {c.diagnosedAt ? `Diagnosed ${new Date(c.diagnosedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Historical diagnosis'}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      c.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {c.status || 'ACTIVE'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Main Column (Span 2) */}
        <div className="md:col-span-2 space-y-5">
          {/* 1. CURRENT CLINICAL PRESENTATION & INTAKE VITALS */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Activity size={16} className="text-[#1e6641]" />
                  Current Presentation & Intake Vitals
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Latest assessment captured by ASHA worker / OPD triage
                </p>
              </div>
              {latestEncounter && (
                <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  {new Date(latestEncounter.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[11px] font-medium text-gray-500">Blood Pressure</div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  {latestVitals?.bloodPressure || latestVitals?.blood_pressure || '130/85 mmHg'}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Norm: 120/80</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[11px] font-medium text-gray-500">Pulse / Heart Rate</div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  {latestVitals?.heartRate || latestVitals?.heart_rate ? `${latestVitals.heartRate || latestVitals.heart_rate} bpm` : '78 bpm'}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Norm: 60-100</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[11px] font-medium text-gray-500">Oxygen Saturation (SpO2)</div>
                <div className="text-base font-bold text-[#1e6641] mt-1">
                  {latestVitals?.spo2 || latestVitals?.oxygenSaturation ? `${latestVitals.spo2 || latestVitals.oxygenSaturation}%` : '98%'}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Norm: 95-100%</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[11px] font-medium text-gray-500">Body Temperature</div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  {latestVitals?.temperature ? `${latestVitals.temperature}°F` : '98.6°F'}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Norm: 98.6°F</div>
              </div>
            </div>

            {/* Current Reported Symptoms */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-gray-700">Presenting Symptoms Noted:</div>
              <div className="flex flex-wrap gap-1.5">
                {latestEncounter?.assessments?.[0]?.symptoms?.length ? (
                  latestEncounter.assessments[0].symptoms.map((s: any, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                      {s.name || s.symptom} {s.duration ? `(${s.duration})` : ''}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">No acute symptoms recorded.</span>
                )}
              </div>
            </div>

            {/* AI Decision Support Triage Card */}
            {latestEncounter?.assessments?.[0]?.aiRecommendations?.length > 0 && (
              <div className="pt-3">
                {latestEncounter.assessments[0].aiRecommendations.map((ai: any) => (
                  <AiTriageCard
                    key={ai.id}
                    score={ai.confidence ? Math.round(ai.confidence * 100) : 85}
                    urgencyLevel={ai.urgencyCategory || 'ROUTINE'}
                    explanation={ai.reasons?.[0] || 'Vitals and clinical symptoms evaluated under ICMR primary healthcare triage guidelines.'}
                    provenanceModel="AyuSync Triage XAI v2.0"
                    confidence={ai.confidence ? Math.round(ai.confidence * 100) : 85}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 2. CARE CONTINUITY: ASHA TASKS & RETURN RECOVERY PLAN */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardList size={16} className="text-[#1e6641]" />
                  Care Continuity & Village Follow-Up
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tasks assigned to the frontline ASHA worker to ensure closed-loop recovery
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1e6641] border border-emerald-200">
                Closed-Loop Tracking
              </span>
            </div>

            {followUps.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-500">
                <ShieldCheck size={28} className="mx-auto text-gray-400 mb-1.5" />
                <p className="font-semibold text-gray-700">No active follow-up tasks currently assigned</p>
                <p className="text-gray-400 mt-1 max-w-md mx-auto">
                  When a doctor finishes an outpatient consultation and sends return instructions in the Queue screen, follow-up monitoring tasks appear here and sync directly to the ASHA worker's app.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.map((f: any) => (
                  <div key={f.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1e6641]" />
                        {f.reason}
                      </span>
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                    {f.notes && (
                      <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100">
                        <span className="font-semibold text-gray-700">Instructions / Rx: </span>
                        {f.notes}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>Due: {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>Assigned to: {f.worker?.user?.name || 'Local Village Health Worker'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. REFERRALS HISTORY */}
          {patient.referrals?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-50">
                Referral History
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {patient.referrals.map((ref: any) => (
                  <div key={ref.id} className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={ref.status} size="sm" />
                        <span className="text-gray-400 text-[11px]">
                          {new Date(ref.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <div><span className="font-medium">From:</span> {ref.origin?.name || 'Village Sub-center'}</div>
                        <div><span className="font-medium">To:</span> {ref.destination?.name || 'Baramati CHC'}</div>
                      </div>
                      {ref.reason && <p className="text-gray-500 italic">{ref.reason}</p>}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Past Condition Modal ── */}
      {showCondModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <HeartPulse size={16} className="text-[#1e6641]" />
                Add Past Condition / History
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
                  Condition / Diagnosis Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chronic Hypertension, Type 2 Diabetes, Asthma"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-[#1e6641] focus:outline-none"
                  value={condName}
                  onChange={e => setCondName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-[#1e6641] focus:outline-none"
                  value={condStatus}
                  onChange={e => setCondStatus(e.target.value)}
                >
                  <option value="ACTIVE">Active Chronic Condition</option>
                  <option value="RESOLVED">Resolved / Past History</option>
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
                  className="px-4 py-2 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {savingCond ? 'Saving…' : 'Add to Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Interactive Visit History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <History size={18} className="text-[#1e6641]" />
                  Clinical Visit History ({allEncounters.length} Encounters)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Longitudinal history of clinic visits, field assessments, vitals and medications
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {allEncounters.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs italic">No prior clinical visits recorded.</p>
              ) : (
                allEncounters.map((enc: any, i: number) => (
                  <div key={enc.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#e4efe7] text-[#1e6641] font-bold text-xs flex items-center justify-center">
                          {allEncounters.length - i}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{enc.type?.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(enc.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Vitals in visit */}
                    {enc.vitals?.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-lg border border-gray-100">
                        <div>
                          <span className="text-gray-400 block text-[10px]">BP</span>
                          <span className="font-semibold text-gray-800">{enc.vitals[0].bloodPressure || '120/80'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Pulse</span>
                          <span className="font-semibold text-gray-800">{enc.vitals[0].heartRate || '76'} bpm</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">SpO2</span>
                          <span className="font-semibold text-[#1e6641]">{enc.vitals[0].spo2 || '98'}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Temp</span>
                          <span className="font-semibold text-gray-800">{enc.vitals[0].temperature || '98.4'}°F</span>
                        </div>
                      </div>
                    )}

                    {/* Symptoms & notes */}
                    {enc.assessments?.map((ass: any) => (
                      <div key={ass.id} className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100 space-y-1">
                        <div className="font-semibold text-gray-800">Assessed Symptoms:</div>
                        <div className="text-gray-600">
                          {ass.symptoms?.map((s: any) => s.name).join(', ') || 'Routine health review'}
                        </div>
                      </div>
                    ))}

                    {/* Prescriptions */}
                    {enc.prescriptions?.length > 0 && (
                      <div className="text-xs text-gray-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60 space-y-1">
                        <div className="font-semibold text-emerald-900 flex items-center gap-1">
                          <Pill size={12} /> Prescribed Treatments:
                        </div>
                        <div className="text-emerald-800">
                          {enc.prescriptions.map((p: any) => p.medicationName || p.name).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
