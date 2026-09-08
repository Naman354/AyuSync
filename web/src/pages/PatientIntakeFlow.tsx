import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useNetworkStatus } from '../lib/network';
import { saveLocalPatient, enqueueOfflineMutation } from '../lib/offlineSync';
import { Button } from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import {
  User, Activity, ArrowRight, ArrowLeft,
  Building2, Ambulance, Thermometer, Heart, Wind,
  CheckCircle2, Info, AlertTriangle, Sparkles, Navigation, BedDouble
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
  const { isOffline } = useNetworkStatus();
  const [step, setStep] = useState(parseInt(searchParams.get('step') || '1', 10));

  const [patient, setPatient] = useState({ name: '', age: '', gender: 'FEMALE', phone: '', address: 'Khandala Ward 4', abhaId: '' });
  const [vitals,  setVitals]  = useState({ bpSystolic: '120', bpDiastolic: '80', heartRate: '78', spO2: '98', temperature: '98.6' });
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [needsAmbulance, setNeedsAmbulance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [manualUrgency, setManualUrgency] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<{
    urgency: string;
    aiPredictedUrgency: string;
    score: number;
    tier: string;
    reasons: string[];
    confidence?: number;
    recommendation?: string;
  } | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const effectiveUrgency = (manualUrgency || assessment?.urgency || 'ROUTINE').toUpperCase();
  const isOverridden = Boolean(manualUrgency && manualUrgency !== assessment?.aiPredictedUrgency);
  const effectiveTier = effectiveUrgency === 'URGENT'
    ? 'Community Health Centre (CHC) or District Hospital'
    : effectiveUrgency === 'PRIORITY'
    ? 'Primary Health Centre (PHC)'
    : 'Health & Wellness Centre';

  const [rankedFacilities, setRankedFacilities] = useState<any[]>([]);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [showAllClinics, setShowAllClinics] = useState(false);

  const fetchFacilityRouting = async (targetUrgency?: string) => {
    const urg = (targetUrgency || effectiveUrgency || 'ROUTINE').toUpperCase();
    setRoutingLoading(true);
    try {
      const res = await api.post('/ai/route', {
        urgencyCategory: urg,
        urgency: urg,
        symptoms: symptoms.map(s => ({ name: s })),
        vitals
      });
      const ranked = res.data?.ranked_facilities || [];
      setRankedFacilities(ranked);
      if (ranked.length > 0) {
        const best = ranked[0];
        const match = facilities.find(f => f.id === best.facility_id || f.name.toLowerCase().includes(best.facility_name.toLowerCase().slice(0, 8)));
        if (match) {
          setSelectedFacility(match.id);
        } else if (best.facility_id) {
          setSelectedFacility(best.facility_id);
        }
      }
    } catch {
      // Fallback cleanly
    } finally {
      setRoutingLoading(false);
    }
  };

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
    const cleanName = (patient.name || '').replace(/<[^>]*>?/gm, '').trim();
    if (!cleanName) {
      errs.name = 'Patient full name is required';
    } else if (cleanName.length < 2) {
      errs.name = 'Name must be at least 2 characters long';
    } else if (/[0-9]/.test(cleanName)) {
      errs.name = 'Name should only contain alphabetic characters and spaces';
    }

    if (!patient.age || String(patient.age).trim() === '') {
      errs.age = 'Age is required';
    } else {
      const ageNum = Number(patient.age);
      if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 125) {
        errs.age = 'Enter a valid whole number age between 0 and 125';
      }
    }

    const rawPhone = (patient.phone || '').trim();
    if (rawPhone) {
      const digits = rawPhone.replace(/\D/g, '');
      if (digits.length !== 10) {
        errs.phone = 'Please enter a valid 10-digit mobile number';
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        errs.phone = 'Mobile number must start with 6, 7, 8, or 9';
      }
    }

    const cleanVillage = (patient.address || '').replace(/<[^>]*>?/gm, '').trim();
    if (!cleanVillage) {
      errs.address = 'Village / Ward is required';
    } else if (cleanVillage.length < 2) {
      errs.address = 'Village must be at least 2 characters long';
    }

    const cleanAbha = (patient.abhaId || '').replace(/[^a-zA-Z0-9-]/g, '').trim();
    if (cleanAbha && cleanAbha.replace(/-/g, '').length !== 14) {
      errs.abhaId = 'ABHA ID must be a 14-digit number (e.g. 14 digits or XX-XXXX-XXXX-XXXX)';
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

  const runAssessment = async () => {
    if (!validateStep2()) return;
    setAiLoading(true);

    const spo2 = parseFloat(vitals.spO2) || 98;
    const sys  = parseFloat(vitals.bpSystolic) || 120;
    const temp = parseFloat(vitals.temperature) || 98.6;

    let defaultUrgency = 'ROUTINE';
    let defaultScore = 25;
    let defaultTier = 'Health & Wellness Centre';
    const defaultReasons: string[] = [];

    if (spo2 < 92 || sys >= 160 || symptoms.includes('Chest Pain')) {
      defaultUrgency = 'URGENT';
      defaultScore = 92;
      defaultTier = 'Community Health Centre (CHC) or District Hospital';
      if (spo2 < 92) defaultReasons.push(`Oxygen level is low (${spo2}%) — normal is above 94%.`);
      if (sys >= 160) defaultReasons.push(`Blood pressure is very high (${sys}/${vitals.bpDiastolic} mmHg).`);
      if (symptoms.includes('Chest Pain')) defaultReasons.push('Chest pain reported — needs immediate evaluation.');
    } else if (spo2 < 95 || sys >= 140 || temp > 101 || symptoms.length >= 3) {
      defaultUrgency = 'PRIORITY';
      defaultScore = 65;
      defaultTier = 'Primary Health Centre (PHC)';
      if (sys >= 140) defaultReasons.push(`Blood pressure is elevated (${sys}/${vitals.bpDiastolic} mmHg).`);
      if (temp > 101) defaultReasons.push(`High fever (${temp}°F) — needs doctor review.`);
      if (symptoms.length >= 3) defaultReasons.push(`Multiple symptoms reported (${symptoms.length}) — should be seen today.`);
    } else {
      defaultReasons.push('Vital signs and measurements are within normal clinical ranges.');
      defaultReasons.push('Suitable for regular monitoring or routine outpatient consultation.');
    }

    try {
      // Automatically invoke existing AI service via backend proxy
      const res = await api.post('/ai/triage', {
        age: parseInt(patient.age || '30', 10),
        gender: patient.gender,
        symptoms: symptoms.map(s => ({ name: s })),
        vitals: {
          blood_pressure: `${vitals.bpSystolic || 120}/${vitals.bpDiastolic || 80}`,
          bpSystolic: vitals.bpSystolic,
          bpDiastolic: vitals.bpDiastolic,
          spo2: vitals.spO2,
          heart_rate: vitals.heartRate,
          temperature: vitals.temperature,
        }
      });

      const d = res.data;
      const aiUrgency = (d.urgency || d.urgencyCategory || defaultUrgency).toUpperCase();
      const reasons = Array.isArray(d.reasons) && d.reasons.length > 0 ? d.reasons : defaultReasons;
      const tier = d.tier || (aiUrgency === 'URGENT' ? 'Community Health Centre (CHC) or District Hospital' : aiUrgency === 'PRIORITY' ? 'Primary Health Centre (PHC)' : 'Health & Wellness Centre');
      const score = aiUrgency === 'URGENT' ? 95 : aiUrgency === 'PRIORITY' ? 65 : 25;

      setAssessment({
        urgency: aiUrgency,
        aiPredictedUrgency: aiUrgency,
        score,
        tier,
        reasons,
        confidence: d.confidence,
        recommendation: d.recommended_next_action || tier
      });
      setManualUrgency(null);
    } catch {
      // Offline or network fallback to clinical rule engine
      setAssessment({
        urgency: defaultUrgency,
        aiPredictedUrgency: defaultUrgency,
        score: defaultScore,
        tier: defaultTier,
        reasons: defaultReasons,
        confidence: 0.85,
        recommendation: defaultTier
      });
      setManualUrgency(null);
    } finally {
      setAiLoading(false);
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    const token = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cleanName = (patient.name || '').replace(/<[^>]*>?/gm, '').trim();
    const cleanAge = parseInt(patient.age || '30', 10);
    const cleanVillage = (patient.address || 'Khandala Ward 4').replace(/<[^>]*>?/gm, '').trim();
    const digitsPhone = (patient.phone || '').replace(/\D/g, '');
    const cleanPhone = digitsPhone ? (digitsPhone.startsWith('91') && digitsPhone.length === 12 ? `+${digitsPhone}` : `+91${digitsPhone.slice(-10)}`) : undefined;
    const cleanAbha = (patient.abhaId || '').replace(/[^a-zA-Z0-9-]/g, '').trim() || undefined;
    const cleanReason = referralNotes || symptoms.join(', ') || 'Routine evaluation';

    // If device is offline (detected automatically), save locally and enqueue for auto-sync
    if (isOffline) {
      const offlinePatientId = `offline-pat-${Date.now()}`;
      const offlinePatientRecord = {
        id: offlinePatientId,
        name: cleanName || 'Community Patient',
        age: cleanAge,
        gender: patient.gender,
        village: cleanVillage,
        phone: cleanPhone,
        abhaId: cleanAbha,
        createdAt: new Date().toISOString()
      };

      // Save locally so patient immediately appears in Recent Patients on ASHA dashboard
      saveLocalPatient(offlinePatientRecord);

      // Enqueue mutations for backend sync
      enqueueOfflineMutation({
        entity: 'PATIENT',
        action: 'CREATE',
        payload: offlinePatientRecord
      });

      if (selectedFacility) {
        enqueueOfflineMutation({
          entity: 'REFERRAL',
          action: 'CREATE',
          payload: {
            id: `offline-ref-${Date.now()}`,
            patientId: offlinePatientId,
            destinationId: selectedFacility,
            urgency: effectiveUrgency,
            reason: cleanReason
          }
        });
      }

      const userObj = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
      const referralPayload = {
        token,
        patientName: cleanName || 'Community Patient',
        age: cleanAge,
        gender: patient.gender,
        phone: cleanPhone,
        village: cleanVillage,
        abhaId: cleanAbha,
        urgency: effectiveUrgency,
        facilityName: facilities.find(f => f.id === selectedFacility)?.name || 'Baramati CHC',
        originFacility: facilities[0]?.name || 'Khandala Sub-Center',
        symptoms,
        vitals,
        reason: cleanReason || referralNotes || symptoms.join(', ') || 'General Clinical Referral',
        needsAmbulance,
        workerName: userObj.name || 'Sunita Patil (ASHA)',
        assessmentScore: assessment?.score,
        isOffline: true,
      };

      navigate('/referral-success', { state: referralPayload });
      setSubmitting(false);
      return;
    }

    // Online submission flow
    try {
      let createdPatient: any = null;
      try {
        const pRes = await api.post('/patients', {
          name: cleanName,
          age: cleanAge,
          gender: patient.gender,
          village: cleanVillage,
          phone: cleanPhone,
          abhaId: cleanAbha
        });
        createdPatient = pRes.data;
      } catch (pErr: any) {
        // If network dropped mid-request, gracefully fallback to offline queue
        if (pErr.code === 'ERR_NETWORK' || !navigator.onLine) {
          const offlinePatId = `offline-pat-${Date.now()}`;
          const offlinePat = { id: offlinePatId, name: cleanName, age: cleanAge, gender: patient.gender, village: cleanVillage, phone: cleanPhone, abhaId: cleanAbha };
          saveLocalPatient(offlinePat);
          enqueueOfflineMutation({ entity: 'PATIENT', action: 'CREATE', payload: offlinePat });
          if (selectedFacility) {
            enqueueOfflineMutation({
              entity: 'REFERRAL',
              action: 'CREATE',
              payload: { patientId: offlinePatId, destinationId: selectedFacility, urgency: effectiveUrgency, reason: cleanReason }
            });
          }
          const userObj = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
          navigate('/referral-success', {
            state: {
              token,
              patientName: cleanName,
              age: cleanAge,
              gender: patient.gender,
              phone: cleanPhone,
              village: cleanVillage,
              abhaId: cleanAbha,
              urgency: effectiveUrgency,
              facilityName: facilities.find(f => f.id === selectedFacility)?.name || 'Baramati CHC',
              originFacility: facilities[0]?.name || 'Khandala Sub-Center',
              symptoms,
              vitals,
              reason: cleanReason || referralNotes || symptoms.join(', ') || 'General Clinical Referral',
              needsAmbulance,
              workerName: userObj.name || 'Sunita Patil (ASHA)',
              isOffline: true
            }
          });
          return;
        }
        throw pErr;
      }

      // Save to local cache so patient immediately shows up on ASHA worker's Recent Patients
      if (createdPatient) {
        saveLocalPatient(createdPatient);
      }

      // Create Referral with valid origin facility
      if (selectedFacility && createdPatient?.id) {
        const originFacilityId = facilities[0]?.id || selectedFacility;
        await api.post('/referrals', {
          patientId: createdPatient.id,
          originId: originFacilityId,
          destinationId: selectedFacility,
          urgency: effectiveUrgency,
          reason: cleanReason
        });
      }

      const userObj = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
      navigate('/referral-success', {
        state: {
          token,
          patientName: cleanName,
          age: cleanAge,
          gender: patient.gender,
          phone: cleanPhone,
          village: cleanVillage,
          abhaId: cleanAbha,
          urgency: effectiveUrgency,
          facilityName: facilities.find(f => f.id === selectedFacility)?.name || 'Baramati CHC',
          originFacility: facilities[0]?.name || 'Khandala Sub-Center',
          symptoms,
          vitals,
          reason: cleanReason || referralNotes || symptoms.join(', ') || 'General Clinical Referral',
          needsAmbulance,
          workerName: userObj.name || 'Sunita Patil (ASHA)',
          assessmentScore: assessment?.score,
          isOffline: false,
        }
      });
    } catch (e: any) {
      console.error('[PatientIntakeFlow] Submission error:', e);
      const errMsg = e.response?.data?.message || e.response?.data?.error || 'Could not register patient or submit referral. Please check details and try again.';
      setSubmitError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };


  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16 animate-page-in">
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-center justify-between shadow-xs">
          <span>{submitError}</span>
          <button onClick={() => setSubmitError('')} className="text-red-600 hover:text-red-800 font-bold ml-3">✕</button>
        </div>
      )}
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
            <Button
              onClick={runAssessment}
              disabled={aiLoading}
              className="bg-[#1e6641] hover:bg-[#165032] text-white flex items-center gap-2 h-11 px-6 shadow-xs"
            >
              {aiLoading ? (
                <>
                  <Sparkles size={16} className="animate-spin text-emerald-200" />
                  Running AI Triage…
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-emerald-200" />
                  Check health risk <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Health assessment with AI Recommendation & Manual Urgency Override ── */}
      {step === 3 && assessment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-[#1e6641]" />
                <h2 className="text-base font-bold text-gray-900">AI Triage & Clinical Assessment</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Automated clinical recommendation based on recorded vitals & complaints
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={effectiveUrgency} size="md" />
              {isOverridden && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  ASHA Override
                </span>
              )}
            </div>
          </div>

          {/* AI Recommended Next Step */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500">Recommended Next Step</span>
              {assessment.confidence && (
                <span className="text-[10px] font-bold text-gray-400">
                  Confidence: {Math.round(assessment.confidence * 100)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Building2 size={18} className="text-[#1e6641] shrink-0" />
              {effectiveTier}
            </div>
            {assessment.recommendation && assessment.recommendation !== effectiveTier && (
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                {assessment.recommendation}
              </p>
            )}
          </div>

          {/* Manual Classification Override Control */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                Urgency Classification (ASHA Verification)
              </label>
              <span className="text-[11px] text-gray-500">
                AI Predicted: <strong className="text-gray-700">{assessment.aiPredictedUrgency || assessment.urgency}</strong>
              </span>
            </div>
            <p className="text-xs text-gray-500">
              If the automatic prediction is incorrect, tap to manually change the classification. Your manual selection overrides the automatic prediction and is saved as the patient's final classification:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setManualUrgency('ROUTINE')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  effectiveUrgency === 'ROUTINE'
                    ? 'bg-emerald-100 text-[#1e6641] border-[#1e6641] ring-2 ring-[#1e6641]/20 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 size={14} className={effectiveUrgency === 'ROUTINE' ? 'text-[#1e6641]' : 'text-gray-400'} />
                Routine (Scheduled)
              </button>

              <button
                type="button"
                onClick={() => setManualUrgency('PRIORITY')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  effectiveUrgency === 'PRIORITY'
                    ? 'bg-amber-100 text-amber-900 border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Activity size={14} className={effectiveUrgency === 'PRIORITY' ? 'text-amber-700' : 'text-gray-400'} />
                Priority (Same-Day)
              </button>

              <button
                type="button"
                onClick={() => setManualUrgency('URGENT')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border col-span-2 sm:col-span-1 cursor-pointer ${
                  effectiveUrgency === 'URGENT'
                    ? 'bg-red-100 text-red-900 border-red-500 ring-2 ring-red-400/20 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle size={14} className={effectiveUrgency === 'URGENT' ? 'text-red-600' : 'text-gray-400'} />
                Urgent (Immediate)
              </button>
            </div>
            {isOverridden && (
              <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <span>Manual override active: <strong>{effectiveUrgency}</strong> (Saved as final classification)</span>
                <button
                  type="button"
                  onClick={() => setManualUrgency(null)}
                  className="text-[11px] underline font-semibold text-amber-900 hover:text-amber-950 cursor-pointer ml-2"
                >
                  Reset to AI prediction
                </button>
              </div>
            )}
          </div>

          {/* AI Clinical Explanations */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2.5">
              <Info size={13} className="text-[#1e6641]" /> Clinical reasons identified by AI
            </div>
            <div className="space-y-2">
              {assessment.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100">
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
            <Button onClick={() => { fetchFacilityRouting(); setStep(4); }} className="bg-[#1e6641] hover:bg-[#165032] text-white flex items-center gap-2 h-11 px-6 cursor-pointer">
              Next: Choose clinic <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Send to clinic with Explainable AI Facility Matchmaker ── */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Choose receiving healthcare center</h2>
              <p className="text-xs text-gray-500">AI-assisted facility matchmaker with real-time bed & capability telemetry</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* AI Explainable Facility Matchmaker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#1e6641]" />
                  AI Recommended Destination Facility
                </label>
                <span className="text-[11px] text-gray-500">
                  Target Tier: <strong className="text-[#1e6641]">{effectiveTier}</strong>
                </span>
              </div>

              {routingLoading ? (
                <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Sparkles size={16} className="animate-spin text-[#1e6641]" />
                  <span>Computing optimal facility match based on bed telemetry & clinical urgency…</span>
                </div>
              ) : rankedFacilities.length > 0 ? (
                <div className="space-y-3">
                  {rankedFacilities.map((fac, i) => {
                    const isSelected = selectedFacility === fac.facility_id ||
                      (facilities.find(f => f.id === selectedFacility)?.name?.toLowerCase().includes(fac.facility_name.toLowerCase().slice(0, 8)));
                    const isTop = i === 0;

                    return (
                      <div
                        key={fac.facility_id || i}
                        onClick={() => {
                          const realFac = facilities.find(f => f.id === fac.facility_id || f.name.toLowerCase().includes(fac.facility_name.toLowerCase().slice(0, 8)));
                          if (realFac) {
                            setSelectedFacility(realFac.id);
                          } else {
                            setSelectedFacility(fac.facility_id);
                          }
                          setStepErrors(prev => { const c = { ...prev }; delete c.facility; return c; });
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-[#1e6641] bg-emerald-50/40 ring-2 ring-[#1e6641]/20 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        {/* Top Badge & Distance */}
                        <div className="flex items-start sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isTop
                                ? 'bg-emerald-100 text-[#1e6641] border border-emerald-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {isTop ? `★ Top Match · ${fac.score}% Score` : `Alternative · ${fac.score}% Score`}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {fac.facility_type || 'CHC'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 font-medium shrink-0">
                            <Navigation size={12} className="text-[#1e6641]" />
                            <span>{fac.estimated_travel_time_minutes} mins · {fac.distance_km} km</span>
                          </div>
                        </div>

                        {/* Name & Bed Status */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="font-bold text-gray-900 text-sm sm:text-base">
                            {fac.facility_name}
                          </div>
                          {fac.free_beds && (
                            <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md shrink-0">
                              <BedDouble size={12} />
                              <span>{fac.free_beds}</span>
                            </div>
                          )}
                        </div>

                        {/* Explainable AI Clinical Rationale */}
                        {fac.reasons && fac.reasons.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100/80">
                            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                              <Sparkles size={11} className="text-[#1e6641]" /> Why AI selected this facility:
                            </div>
                            <ul className="space-y-1">
                              {fac.reasons.map((r: string, rIdx: number) => (
                                <li key={rIdx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                  <span className="text-[#1e6641] font-bold shrink-0">•</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Selection check pill */}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                          <span className="text-[11px] text-gray-400">Clinical Readiness Score: <strong>{fac.readiness_score}%</strong></span>
                          <span className={`font-semibold flex items-center gap-1 ${isSelected ? 'text-[#1e6641]' : 'text-gray-400'}`}>
                            {isSelected ? <><CheckCircle2 size={13} /> Selected for Referral</> : 'Click to select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
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
                </div>
              )}

              {/* Manual Override Accordion */}
              {rankedFacilities.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAllClinics(!showAllClinics)}
                    className="text-xs text-gray-500 hover:text-gray-800 underline font-medium cursor-pointer"
                  >
                    {showAllClinics ? 'Hide manual facility list' : 'Or select another clinic manually from full directory →'}
                  </button>

                  {showAllClinics && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <label className={LABEL}>Full Facilities Directory</label>
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
                    </div>
                  )}
                </div>
              )}
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
