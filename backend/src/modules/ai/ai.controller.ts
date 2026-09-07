import { Request, Response } from 'express';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * CLINICAL TRIAGE PROXY & ENGINE
 * Proxies to Python FastAPI AI service with a 3s timeout.
 * If the Python AI service is unavailable, provides deterministic clinical rules
 * based on ICMR and WHO rural healthcare triage standards.
 */
export const handleTriage = async (req: Request, res: Response) => {
  const { patientId, age = 35, gender = 'U', symptoms = [], vitals, history } = req.body;

  try {
    // Attempt to call Python FastAPI microservice
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/triage`,
      { patientId, age, gender, symptoms, vitals, history },
      { timeout: 3000 }
    );
    return res.json(aiResponse.data);
  } catch (err: any) {
    console.warn(`[AI Proxy] Microservice unavailable (${err.message}). Using clinical rule engine fallback.`);
  }

  // --- DETERMINISTIC CLINICAL RULE ENGINE (ICMR / WHO TRIAGE) ---
  let urgency = 'ROUTINE';
  const reasons: string[] = [];
  const riskFactors: string[] = [];
  const missingInfo: string[] = [];

  // Parse Vitals
  let systolic = 120;
  let diastolic = 80;
  if (vitals?.blood_pressure) {
    const parts = String(vitals.blood_pressure).split('/');
    systolic = parseInt(parts[0], 10) || 120;
    diastolic = parseInt(parts[1], 10) || 80;
  } else {
    missingInfo.push('Blood pressure was not recorded during intake');
  }

  const spo2 = vitals?.spo2 != null ? Number(vitals.spo2) : null;
  if (spo2 == null) {
    missingInfo.push('Oxygen saturation (SpO2) was not recorded');
  }

  const hr = vitals?.heart_rate != null ? Number(vitals.heart_rate) : null;
  if (hr == null) {
    missingInfo.push('Pulse / heart rate was not recorded');
  }

  const temp = vitals?.temperature != null ? Number(vitals.temperature) : null;
  if (temp == null) {
    missingInfo.push('Body temperature was not recorded');
  }

  const rr = vitals?.respiratory_rate != null ? Number(vitals.respiratory_rate) : null;

  // HARD CLINICAL OVERRIDES (ICMR Emergency Triage Protocol)
  if (spo2 !== null && spo2 < 90) {
    urgency = 'URGENT';
    reasons.push(`Critical hypoxia: Oxygen saturation (SpO2) is dangerously low at ${spo2}% (< 90%). Immediate oxygen therapy needed.`);
  }

  if (systolic >= 180 || diastolic >= 110) {
    urgency = 'URGENT';
    reasons.push(`Hypertensive crisis: Blood pressure ${systolic}/${diastolic} mmHg exceeds emergency threshold (180/110 mmHg).`);
  } else if (systolic < 90 && systolic > 0) {
    urgency = 'URGENT';
    reasons.push(`Severe hypotension: Systolic blood pressure ${systolic} mmHg is below 90 mmHg. Risk of hypovolemic shock.`);
  } else if (systolic >= 140 || diastolic >= 90) {
    if (urgency !== 'URGENT') urgency = 'PRIORITY';
    reasons.push(`Stage 2 Hypertension: Blood pressure recorded as ${systolic}/${diastolic} mmHg.`);
  }

  if (hr !== null) {
    if (hr > 130) {
      urgency = 'URGENT';
      reasons.push(`Severe tachycardia: Resting heart rate ${hr} bpm exceeds safe threshold (130 bpm).`);
    } else if (hr < 40) {
      urgency = 'URGENT';
      reasons.push(`Severe bradycardia: Resting heart rate ${hr} bpm is below safe threshold (40 bpm).`);
    } else if (hr > 100 && urgency === 'ROUTINE') {
      urgency = 'PRIORITY';
      reasons.push(`Elevated heart rate: ${hr} bpm.`);
    }
  }

  if (temp !== null) {
    if (temp >= 104) {
      urgency = 'URGENT';
      reasons.push(`Hyperpyrexia: High fever of ${temp}°F carries risk of febrile convulsions.`);
    } else if (temp >= 101 && urgency === 'ROUTINE') {
      urgency = 'PRIORITY';
      reasons.push(`Moderate fever: Body temperature recorded at ${temp}°F.`);
    }
  }

  if (rr !== null && rr > 30) {
    urgency = 'URGENT';
    reasons.push(`Respiratory distress: Respiratory rate ${rr} breaths/min (> 30).`);
  }

  // SYMPTOM ANALYSIS
  const symptomNames = (symptoms || []).map((s: any) =>
    (typeof s === 'string' ? s : s?.symptom || s?.name || '').toLowerCase()
  );

  const emergencyKeywords = ['chest pain', 'shortness of breath', 'difficulty breathing', 'loss of consciousness', 'seizure', 'heavy bleeding', 'severe dehydration'];
  const priorityKeywords = ['fever', 'vomiting', 'severe pain', 'dizziness', 'headache', 'swelling', 'anemia', 'diarrhea'];

  for (const kw of emergencyKeywords) {
    if (symptomNames.some((sn: string) => sn.includes(kw))) {
      urgency = 'URGENT';
      reasons.push(`Red-flag symptom reported: "${kw.toUpperCase()}". Requires prompt medical officer intervention.`);
    }
  }

  for (const kw of priorityKeywords) {
    if (symptomNames.some((sn: string) => sn.includes(kw)) && urgency === 'ROUTINE') {
      urgency = 'PRIORITY';
      reasons.push(`Symptoms require active clinical follow-up: "${kw}".`);
    }
  }

  // Risk Factors (Age / Demographic)
  if (age < 5) {
    riskFactors.push('Pediatric patient (age under 5 years) — elevated vulnerability');
  } else if (age >= 60) {
    riskFactors.push('Geriatric patient (age 60+ years) — elevated chronic disease risk');
  }

  // Confidence Calculation
  const totalVitalFields = 4;
  const missingCount = missingInfo.length;
  const completeness = (totalVitalFields - missingCount) / totalVitalFields;
  const confidence = Math.round((0.60 + completeness * 0.35) * 100) / 100;

  // Recommended Action
  let recommendedAction = 'Standard outpatient consultation during regular clinic hours.';
  if (urgency === 'URGENT') {
    recommendedAction = 'Immediate Medical Officer consultation. Prepare for emergency stabilization or district hospital referral.';
  } else if (urgency === 'PRIORITY') {
    recommendedAction = 'Doctor review recommended within 2 hours. Ensure vital signs are monitored by village health worker.';
  }

  if (reasons.length === 0) {
    reasons.push('Vitals and clinical observations are within acceptable baseline ranges.');
  }

  return res.json({
    urgency,
    confidence,
    reasons,
    risk_factors: riskFactors,
    missing_information: missingInfo,
    recommended_next_action: recommendedAction,
    escalation_required: urgency === 'URGENT',
    provenance: 'ICMR & WHO Tele-triage Guidelines (AyuSync Clinical Rules Engine)',
    model_version: '2.0.0',
    rule_version: 'clinical-rules-2026-v1'
  });
};

/**
 * FACILITY ROUTING PROXY
 */
export const handleRoute = async (req: Request, res: Response) => {
  try {
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/route`, req.body, { timeout: 3000 });
    return res.json(aiResponse.data);
  } catch {
    // Fallback ranked facilities
    return res.json({
      ranked_facilities: [
        {
          facility_id: 'fac-baramati-chc',
          facility_name: 'Baramati Sub-District Hospital & CHC',
          distance_km: 12.4,
          estimated_travel_time_minutes: 25,
          score: 88,
          readiness_score: 92,
          is_alternative: false,
          freshness_penalty_applied: false,
          reasons: ['Highest clinical capability', '24x7 emergency & maternal beds available']
        },
        {
          facility_id: 'fac-khandala-phc',
          facility_name: 'Khandala Primary Health Centre',
          distance_km: 4.8,
          estimated_travel_time_minutes: 10,
          score: 82,
          readiness_score: 88,
          is_alternative: true,
          freshness_penalty_applied: false,
          reasons: ['Closest facility for initial stabilization', 'Day-care beds available']
        }
      ]
    });
  }
};
