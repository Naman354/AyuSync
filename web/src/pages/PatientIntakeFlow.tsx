import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import {
  User, Activity, ArrowRight, ArrowLeft,
  Building2, Ambulance, Thermometer, Heart, Wind,
  CheckCircle2, Info
} from 'lucide-react';

const SYMPTOMS = [
  'High Fever', 'Dry Cough', 'Shortness of Breath', 'Chest Pain',
  'Dizziness', 'Severe Headache', 'Stomach Pain', 'Vomiting',
  'Joint Pain', 'Weakness / Fatigue', 'High Blood Pressure', 'Blurred Vision'
];

const STEPS = [
  { n: 1, label: 'Patient details' },
  { n: 2, label: 'Health measurements' },
  { n: 3, label: 'Health assessment' },
  { n: 4, label: 'Send to clinic' },
];

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1e6641] focus:outline-none bg-white';
const LABEL = 'block text-xs font-semibold text-gray-700 mb-1.5';

export default function PatientIntakeFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(parseInt(searchParams.get('step') || '1', 10));

  const [patient, setPatient] = useState({ name: '', age: '', gender: 'FEMALE', phone: '', address: 'Mokama Ward 4', abhaId: '' });
  const [vitals,  setVitals]  = useState({ bpSystolic: '120', bpDiastolic: '80', heartRate: '78', spO2: '98', temperature: '98.6' });
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [needsAmbulance, setNeedsAmbulance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<{ urgency: string; score: number; tier: string; reasons: string[] } | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/facilities').then(r => {
      const facs = r.data.data || r.data || [];
      setFacilities(facs);
      if (facs.length) setSelectedFacility(facs[0].id);
    }).catch(() => {});
  }, []);

  const toggleSymptom = (s: string) => {
    setStepErrors(prev => { const copy = { ...prev }; delete copy.symptoms; return copy; });
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    const cleanName = (patient.name || '').trim();
    if (!cleanName) {
      errs.name = 'Patient full name is required';
    } else if (cleanName.length < 2) {
      errs.name = 'Name must be at least 2 characters long';
    }

    if (!patient.age) {
      errs.age = 'Age is required';
    } else {
      const ageNum = parseInt(patient.age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 125) {
        errs.age = 'Enter a valid age between 0 and 125';
      }
    }

    if (patient.phone) {
      const digits = patient.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        errs.phone = 'Phone number must be at least 10 digits';
      }
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};

    if (vitals.bpSystolic) {
      const sys = parseFloat(vitals.bpSystolic);
      if (isNaN(sys) || sys < 50 || sys > 280) {
        errs.bpSystolic = 'Systolic BP should be 50-280 mmHg';
      }
    }
    if (vitals.bpDiastolic) {
      const dia = parseFloat(vitals.bpDiastolic);
      if (isNaN(dia) || dia < 30 || dia > 180) {
        errs.bpDiastolic = 'Diastolic BP should be 30-180 mmHg';
      }
    }
    if (vitals.spO2) {
      const spo2 = parseFloat(vitals.spO2);
      if (isNaN(spo2) || spo2 < 40 || spo2 > 100) {
        errs.spO2 = 'SpO2 must be 40% - 100%';
      }
    }
    if (vitals.heartRate) {
      const hr = parseFloat(vitals.heartRate);
      if (isNaN(hr) || hr < 30 || hr > 250) {
        errs.heartRate = 'Heart rate should be 30-250 bpm';
      }
    }
    if (vitals.temperature) {
      const temp = parseFloat(vitals.temperature);
      if (isNaN(temp) || temp < 85 || temp > 115) {
        errs.temperature = 'Temperature should be 85-115°F';
      }
    }

    if (symptoms.length === 0) {
      errs.symptoms = 'Please select at least one symptom or complaint';
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const runAssessment = () => {
    if (!validateStep2()) return;

    const spo2 = parseFloat(vitals.spO2) || 98;
    const sys  = parseFloat(vitals.bpSystolic) || 120;
    const temp = parseFloat(vitals.temperature) || 98.6;
    let urgency = 'ROUTINE'; let score = 20; let tier = 'Health & Wellness Centre';
    const reasons: string[] = [];

    if (spo2 < 92 || sys >= 160 || symptoms.includes('Chest Pain')) {
      urgency = 'URGENT'; score = 92; tier = 'Community Health Centre (CHC) or District Hospital';
      if (spo2 < 92) reasons.push(`Oxygen level is low (${spo2}%) — normal is above 94%.`);
      if (sys >= 160) reasons.push(`Blood pressure is very high (${sys}/${vitals.bpDiastolic} mmHg).`);
      if (symptoms.includes('Chest Pain')) reasons.push('Chest pain reported — needs immediate evaluation.');
    } else if (spo2 < 95 || sys >= 140 || temp > 101 || symptoms.length >= 3) {
      urgency = 'PRIORITY'; score = 65; tier = 'Primary Health Centre (PHC)';
      if (sys >= 140) reasons.push(`Blood pressure is elevated (${sys}/${vitals.bpDiastolic} mmHg).`);
      if (temp > 101) reasons.push(`High fever (${temp}°F) — needs doctor review.`);
      if (symptoms.length >= 3) reasons.push(`Multiple symptoms reported (${symptoms.length}) — should be seen today.`);
    } else {
      reasons.push('Measurements are within normal range.');
      reasons.push('Suitable for regular monitoring or home visit.');
    }

    setAssessment({ urgency, score, tier, reasons });
    setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const isOfflineSim = localStorage.getItem('ayusync_simulate_offline') === 'true';
    const token = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isOfflineSim) {
      // Offline mode active: queue mutation directly in localStorage
      const q = JSON.parse(localStorage.getItem('ayusync_mutation_queue') || '[]');
      const offlineId = `offline-pat-${Date.now()}`;
      q.push({
        operationId: offlineId,
        entity: 'patient',
        action: 'CREATE',
        payload: {
          name: patient.name || 'Community Patient',
          age: parseInt(patient.age || '30', 10),
          gender: patient.gender,
          village: patient.address,
          phone: patient.phone || `+91${Math.floor(1e9 + Math.random() * 9e9)}`,
          vitals,
          symptoms,
          facilityId: selectedFacility,
          urgency: assessment?.urgency || 'ROUTINE',
        }
      });
      localStorage.setItem('ayusync_mutation_queue', JSON.stringify(q));

      navigate('/referral-success', {
        state: {
          token,
          patientName: patient.name || 'Community Patient',
          urgency: assessment?.urgency || 'ROUTINE',
          facilityName: facilities.find(f => f.id === selectedFacility)?.name || 'Baramati CHC',
          symptoms,
          needsAmbulance,
          isOffline: true,
        }
      });
      setSubmitting(false);
      return;
    }

    try {
      let patientId = '';
      try {
        const r = await api.post('/patients', {
          name: patient.name || 'Community Patient',
          age: parseInt(patient.age || '30', 10),
          gender: patient.gender,
          phone: patient.phone || `+91${Math.floor(1e9 + Math.random() * 9e9)}`,
          address: patient.address,
          abhaId: patient.abhaId || `ABHA-${Math.floor(1e5 + Math.random() * 9e5)}`,
        });
        patientId = r.data?.id || r.data?.data?.id;
      } catch { patientId = 'demo-' + Date.now(); }

      try {
        if (selectedFacility && patientId) {
          await api.post('/referrals', {
            patientId, originId: 'fac-khandala-phc', destinationId: selectedFacility,
            urgency: assessment?.urgency || 'ROUTINE',
            reason: referralNotes || symptoms.join(', ') || 'Routine evaluation',
          });
        }
      } catch {}

      navigate('/referral-success', {
        state: {
          token, patientName: patient.name || 'Community Patient',
          urgency: assessment?.urgency || 'ROUTINE',
          facilityName: facilities.find(f => f.id === selectedFacility)?.name || 'Baramati CHC',
          symptoms, needsAmbulance,
          isOffline: false,
        }
      });
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };


  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16 animate-page-in">
      {/* Step indicator */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`flex items-center gap-1.5 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                step > s.n ? 'bg-[#1e6641] text-white' : step === s.n ? 'bg-[#1e6641] text-white ring-2 ring-[#1e6641]/20' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.n ? 'text-[#1e6641]' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-100 mx-2" />}
            </div>
          ))}
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full">
          <div className="h-full bg-[#1e6641] rounded-full transition-all duration-300" style={{ width: `${step === 1 ? 5 : pct}%` }} />
        </div>
      </div>

      {/* ── STEP 1: Patient details ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Patient details</h2>
              <p className="text-xs text-gray-500">Enter the person's basic information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={LABEL}>Full name *</label>
              <input
                type="text"
                value={patient.name}
                onChange={e => {
                  setStepErrors(prev => { const c = { ...prev }; delete c.name; return c; });
                  setPatient({...patient, name: e.target.value});
                }}
                placeholder="e.g. Pooja Sharma"
                className={`${INPUT} ${stepErrors.name ? 'border-red-400 bg-red-50/20' : ''}`}
              />
              {stepErrors.name && <p className="text-xs text-red-600 mt-1 font-medium">{stepErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Age *</label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={patient.age}
                  onChange={e => {
                    setStepErrors(prev => { const c = { ...prev }; delete c.age; return c; });
                    setPatient({...patient, age: e.target.value});
                  }}
                  placeholder="28"
                  className={`${INPUT} ${stepErrors.age ? 'border-red-400 bg-red-50/20' : ''}`}
                />
                {stepErrors.age && <p className="text-xs text-red-600 mt-1 font-medium">{stepErrors.age}</p>}
              </div>
              <div>
                <label className={LABEL}>Gender</label>
                <select value={patient.gender} onChange={e => setPatient({...patient, gender: e.target.value})} className={INPUT}>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Phone number</label>
              <input
                type="tel"
                value={patient.phone}
                onChange={e => {
                  setStepErrors(prev => { const c = { ...prev }; delete c.phone; return c; });
                  setPatient({...patient, phone: e.target.value});
                }}
                placeholder="+919876543210"
                className={`${INPUT} ${stepErrors.phone ? 'border-red-400 bg-red-50/20' : ''}`}
              />
              {stepErrors.phone && <p className="text-xs text-red-600 mt-1 font-medium">{stepErrors.phone}</p>}
            </div>
            <div>
              <label className={LABEL}>Village / Ward</label>
              <input type="text" value={patient.address} onChange={e => setPatient({...patient, address: e.target.value})} placeholder="Mokama Ward 4" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>ABHA / Health ID <span className="font-normal text-gray-400">(optional)</span></label>
              <input type="text" value={patient.abhaId} onChange={e => setPatient({...patient, abhaId: e.target.value})} placeholder="14-digit ABHA number" className={INPUT} />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={() => { if (validateStep1()) { setStepErrors({}); setStep(2); } }} className="bg-[#1e6641] hover:bg-[#165032] text-white flex items-center gap-2 h-11 px-6">
              Next: Record measurements <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Health measurements ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Health measurements</h2>
              <p className="text-xs text-gray-500">Record what you observed or measured</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Blood pressure', icon: Heart, iconColor: 'text-red-500', unit: 'mmHg',
                content: (
                  <div className="flex items-center gap-1">
                    <input type="text" value={vitals.bpSystolic} onChange={e => setVitals({...vitals, bpSystolic: e.target.value})} className="w-12 border border-gray-200 rounded-lg text-center text-sm font-bold py-1 focus:ring-2 focus:ring-[#1e6641] focus:outline-none" />
                    <span className="text-gray-400 text-xs">/</span>
                    <input type="text" value={vitals.bpDiastolic} onChange={e => setVitals({...vitals, bpDiastolic: e.target.value})} className="w-12 border border-gray-200 rounded-lg text-center text-sm font-bold py-1 focus:ring-2 focus:ring-[#1e6641] focus:outline-none" />
                  </div>
                )
              },
              { label: 'Oxygen level (SpO2)', icon: Wind, iconColor: 'text-blue-500', unit: '% · Normal > 94',
                content: (
                  <div className="flex items-center gap-1">
                    <input type="text" value={vitals.spO2} onChange={e => setVitals({...vitals, spO2: e.target.value})} className="w-14 border border-gray-200 rounded-lg text-center text-sm font-bold py-1 focus:ring-2 focus:ring-[#1e6641] focus:outline-none" />
                    <span className="text-xs font-bold text-gray-700">%</span>
                  </div>
                )
              },
              { label: 'Heart rate', icon: Activity, iconColor: 'text-green-600', unit: 'bpm · Normal 60–100',
                content: (
                  <div className="flex items-center gap-1">
                    <input type="text" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: e.target.value})} className="w-14 border border-gray-200 rounded-lg text-center text-sm font-bold py-1 focus:ring-2 focus:ring-[#1e6641] focus:outline-none" />
                    <span className="text-xs font-bold text-gray-700">bpm</span>
                  </div>
                )
              },
              { label: 'Temperature', icon: Thermometer, iconColor: 'text-amber-500', unit: '°F · Normal 98.6',
                content: (
                  <div className="flex items-center gap-1">
                    <input type="text" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} className="w-14 border border-gray-200 rounded-lg text-center text-sm font-bold py-1 focus:ring-2 focus:ring-[#1e6641] focus:outline-none" />
                    <span className="text-xs font-bold text-gray-700">°F</span>
                  </div>
                )
              },
            ].map(field => (
              <div key={field.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                  <field.icon size={11} className={field.iconColor} />{field.label}
                </div>
                {field.content}
                <div className="text-[10px] text-gray-400">{field.unit}</div>
              </div>
            ))}
          </div>

          <div>
            <label className={`${LABEL} mb-2`}>What symptoms do they have? <span className="font-normal text-gray-400">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(s => (
                <button key={s} type="button" onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${symptoms.includes(s) ? 'bg-[#1e6641] text-white border-[#1e6641]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e6641]/40'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {symptoms.length > 0 && (
              <p className="text-xs text-[#1e6641] mt-2">{symptoms.length} symptom{symptoms.length > 1 ? 's' : ''} selected</p>
            )}
            {stepErrors.symptoms && (
              <p className="text-xs text-red-600 mt-2 font-medium">{stepErrors.symptoms}</p>
            )}
            {Object.keys(stepErrors).filter(k => k !== 'symptoms').length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                {Object.values(stepErrors).filter(msg => msg !== stepErrors.symptoms).map((msg, i) => (
                  <p key={i}>• {msg}</p>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm">
              <ArrowLeft size={14} /> Back
            </Button>
            <Button onClick={runAssessment} className="bg-[#1e6641] hover:bg-[#165032] text-white flex items-center gap-2 h-11 px-6">
              Check health risk <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Health assessment (was "AI Triage") ── */}
      {step === 3 && assessment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <div>
              <h2 className="text-base font-bold text-gray-900">Health assessment</h2>
              <p className="text-xs text-gray-500">Based on the measurements you recorded</p>
            </div>
            <StatusBadge status={assessment.urgency} size="md" />
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-500 mb-1">Recommended next step</div>
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Building2 size={18} className="text-[#1e6641] shrink-0" />
              {assessment.tier}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2.5">
              <Info size={13} className="text-[#1e6641]" /> Why we recommend this
            </div>
            <div className="space-y-2">
              {assessment.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1e6641] shrink-0 mt-1.5" />
                  {r}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm">
              <ArrowLeft size={14} /> Adjust measurements
            </Button>
            <Button onClick={() => setStep(4)} className="bg-[#1e6641] hover:bg-[#165032] text-white flex items-center gap-2 h-11 px-6">
              Next: Choose clinic <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Send to clinic (was "Referral") ── */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Choose a clinic to send them to</h2>
              <p className="text-xs text-gray-500">The doctor will be notified immediately</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={LABEL}>Clinic / hospital *</label>
              <select
                value={selectedFacility}
                onChange={e => {
                  setSelectedFacility(e.target.value);
                  setStepErrors(prev => { const c = { ...prev }; delete c.facility; return c; });
                }}
                className={`${INPUT} ${stepErrors.facility ? 'border-red-400 bg-red-50/20' : ''}`}
              >
                <option value="">-- Choose a clinic or hospital --</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                ))}
              </select>
              {stepErrors.facility && <p className="text-xs text-red-600 mt-1 font-medium">{stepErrors.facility}</p>}
            </div>
            <div>
              <label className={LABEL}>Notes for the doctor <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea value={referralNotes} onChange={e => setReferralNotes(e.target.value)}
                placeholder="Describe what you observed — symptoms, context, anything the doctor should know…"
                rows={3} className={`${INPUT} resize-none`}
              />
            </div>

            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Ambulance size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Request 108 ambulance</div>
                  <div className="text-xs text-gray-500">Patient cannot travel on their own</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNeedsAmbulance(!needsAmbulance)}
                className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ${needsAmbulance ? 'bg-amber-500' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${needsAmbulance ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setStep(3)} className="flex items-center gap-1.5 text-sm">
              <ArrowLeft size={14} /> Back
            </Button>
            <Button
              onClick={() => {
                if (!selectedFacility) {
                  setStepErrors({ facility: 'Please select a receiving clinic or hospital before sending referral.' });
                  return;
                }
                handleSubmit();
              }}
              disabled={submitting}
              className="bg-[#1e6641] hover:bg-[#165032] text-white flex items-center gap-2 h-11 px-6 shadow-sm"
            >
              <CheckCircle2 size={16} />
              {submitting ? 'Sending referral…' : 'Send referral'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
