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
    // Format symptoms for Python FastAPI Pydantic schema: List[Symptom(name: str)]
    const formattedSymptoms = Array.isArray(symptoms)
      ? symptoms.map((s: any) => typeof s === 'string' ? { name: s } : { name: s.name || String(s) })
      : [];

    // Format vitals for Python FastAPI Pydantic schema: List[Vital(type: str, value: str, unit: str)]
    let formattedVitals: any[] = [];
    if (Array.isArray(vitals)) {
      formattedVitals = vitals;
    } else if (vitals && typeof vitals === 'object') {
      const bpVal = vitals.blood_pressure || (vitals.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic || 80}` : null);
      if (bpVal) {
        formattedVitals.push({ type: 'BP', value: String(bpVal), unit: 'mmHg' });
      }
      const spo2Val = vitals.spo2 != null ? vitals.spo2 : vitals.spO2;
      if (spo2Val != null) {
        formattedVitals.push({ type: 'SPO2', value: String(spo2Val), unit: '%' });
      }
      const hrVal = vitals.heart_rate != null ? vitals.heart_rate : vitals.heartRate;
      if (hrVal != null) {
        formattedVitals.push({ type: 'HR', value: String(hrVal), unit: 'bpm' });
      }
      if (vitals.temperature != null) {
        formattedVitals.push({ type: 'TEMP', value: String(vitals.temperature), unit: '°F' });
      }
    }

    // Attempt to call Python FastAPI microservice
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/triage`,
      {
        patientId: patientId || 'anon-intake',
        symptoms: formattedSymptoms,
        vitals: formattedVitals,
      },
      { timeout: 3000 }
    );

    const d = aiResponse.data;
    const cat = (d.urgencyCategory || d.urgency || 'ROUTINE').toUpperCase();
    return res.json({
      urgency: cat,
      urgencyCategory: cat,
      confidence: d.confidence || 0.88,
      reasons: Array.isArray(d.reasons) ? d.reasons : [],
      missing_information: Array.isArray(d.missingInformation) ? d.missingInformation : [],
      tier: cat === 'URGENT'
        ? 'Community Health Centre (CHC) or District Hospital'
        : cat === 'PRIORITY'
        ? 'Primary Health Centre (PHC)'
        : 'Health & Wellness Centre',
      recommended_next_action: cat === 'URGENT'
        ? 'Immediate Medical Officer consultation. Transfer for emergency stabilization.'
        : cat === 'PRIORITY'
        ? 'Doctor review recommended within 2 hours. Monitor vital signs.'
        : 'Standard outpatient consultation during regular clinic hours.'
    });
  } catch (err: any) {
    console.warn(`[AI Proxy] Microservice unavailable (${err.message}). Using clinical rule engine fallback.`);
  }

  // --- DETERMINISTIC CLINICAL RULE ENGINE (ICMR / WHO TRIAGE) ---
  let urgency = 'ROUTINE';
  const reasons: string[] = [];
  const riskFactors: string[] = [];
  const missingInfo: string[] = [];

  // Parse Vitals with flexible field naming
  let systolic = 120;
  let diastolic = 80;
  if (vitals?.blood_pressure) {
    const parts = String(vitals.blood_pressure).split('/');
    systolic = parseInt(parts[0], 10) || 120;
    diastolic = parseInt(parts[1], 10) || 80;
  } else if (vitals?.bpSystolic) {
    systolic = parseInt(vitals.bpSystolic, 10) || 120;
    diastolic = parseInt(vitals.bpDiastolic, 10) || 80;
  } else {
    missingInfo.push('Blood pressure was not recorded during intake');
  }

  const spo2 = vitals?.spo2 != null ? Number(vitals.spo2) : (vitals?.spO2 != null ? Number(vitals.spO2) : null);
  if (spo2 == null) {
    missingInfo.push('Oxygen saturation (SpO2) was not recorded');
  }

  const hr = vitals?.heart_rate != null ? Number(vitals.heart_rate) : (vitals?.heartRate != null ? Number(vitals.heartRate) : null);
  if (hr == null) {
    missingInfo.push('Pulse / heart rate was not recorded');
  }

  const temp = vitals?.temperature != null ? Number(vitals.temperature) : null;
  if (temp == null) {
    missingInfo.push('Body temperature was not recorded');
  }

  const rr = vitals?.respiratory_rate != null ? Number(vitals.respiratory_rate) : null;

  // SYMPTOM EXTRACTION
  const symptomNames = (symptoms || []).map((s: any) =>
    (typeof s === 'string' ? s : s?.symptom || s?.name || '').toLowerCase().trim()
  );

  const hasChestPain = symptomNames.some((s: string) => s.includes('chest pain'));
  const hasShortnessOfBreath = symptomNames.some((s: string) => s.includes('breath') || s.includes('dyspnea'));
  const hasHighBP = symptomNames.some((s: string) => s.includes('blood pressure') || s.includes('hypertension'));
  const hasSevereHeadache = symptomNames.some((s: string) => s.includes('headache'));
  const hasBlurredVision = symptomNames.some((s: string) => s.includes('vision') || s.includes('blur'));
  const hasHighFever = symptomNames.some((s: string) => s.includes('fever') || s.includes('temperature'));
  const hasVomiting = symptomNames.some((s: string) => s.includes('vomit'));
  const hasDizziness = symptomNames.some((s: string) => s.includes('dizzy') || s.includes('vertigo') || s.includes('faint'));

  // 1. HARD CLINICAL OVERRIDES: CRITICAL OXYGEN & HYPOXIA
  if (spo2 !== null && spo2 < 92) {
    urgency = 'URGENT';
    reasons.push(`Critical hypoxia: Oxygen saturation is dangerously low at ${spo2}% (normal > 94%). Immediate oxygen therapy required.`);
  } else if (spo2 !== null && spo2 < 95) {
    if (urgency === 'ROUTINE') urgency = 'PRIORITY';
    reasons.push(`Mild hypoxemia: Oxygen saturation is border-line at ${spo2}%. Close clinical observation recommended.`);
  }

  // 2. HARD CLINICAL OVERRIDES: BLOOD PRESSURE CRISIS & SHOCK
  if (systolic >= 160 || diastolic >= 100) {
    urgency = 'URGENT';
    reasons.push(`Hypertensive urgency: Blood pressure ${systolic}/${diastolic} mmHg exceeds emergency safety threshold (>= 160/100 mmHg).`);
  } else if (systolic < 90 && systolic > 0) {
    urgency = 'URGENT';
    reasons.push(`Severe hypotension: Systolic blood pressure ${systolic} mmHg indicates imminent hypovolemic or septic shock.`);
  } else if (systolic >= 140 || diastolic >= 90 || hasHighBP) {
    if (urgency === 'ROUTINE') urgency = 'PRIORITY';
    reasons.push(`Stage 2 Hypertension: Blood pressure recorded at ${systolic}/${diastolic} mmHg.`);
  }

  // 3. HARD CLINICAL OVERRIDES: HEART RATE
  if (hr !== null) {
    if (hr > 120) {
      urgency = 'URGENT';
      reasons.push(`Severe resting tachycardia: Heart rate of ${hr} bpm exceeds safe threshold (120 bpm). Risk of cardiac arrhythmia.`);
    } else if (hr < 50 && hr > 0) {
      urgency = 'URGENT';
      reasons.push(`Severe bradycardia: Heart rate of ${hr} bpm is critically below normal limits (< 50 bpm). Risk of syncope.`);
    } else if (hr > 100 && urgency === 'ROUTINE') {
      urgency = 'PRIORITY';
      reasons.push(`Elevated heart rate: Resting pulse of ${hr} bpm.`);
    }
  }

  // 4. HARD CLINICAL OVERRIDES: BODY TEMPERATURE
  if (temp !== null) {
    if (temp >= 103 || (age < 5 && temp >= 102)) {
      urgency = 'URGENT';
      reasons.push(`Hyperpyrexia: Body temperature of ${temp}°F carries high risk of febrile convulsions or acute sepsis.`);
    } else if (temp >= 100.4 || hasHighFever) {
      if (urgency === 'ROUTINE') urgency = 'PRIORITY';
      reasons.push(`Fever detected: Body temperature recorded at ${temp}°F.`);
    }
  }

  if (rr !== null && rr > 28) {
    urgency = 'URGENT';
    reasons.push(`Tachypnea / respiratory distress: Breathing rate ${rr} breaths/min (> 28).`);
  }

  // 5. RED-FLAG SYMPTOM COMBINATIONS & SPECIAL CONDITIONS
  if (hasChestPain) {
    urgency = 'URGENT';
    reasons.push('Red-flag symptom: "Chest Pain" requires immediate ECG and medical officer evaluation for acute coronary syndrome.');
  }

  if (hasShortnessOfBreath) {
    urgency = 'URGENT';
    reasons.push('Red-flag symptom: "Shortness of Breath" indicates acute respiratory compromise.');
  }

  // Maternal pre-eclampsia / hypertensive crisis red-flag
  if ((hasHighBP || systolic >= 140) && (hasBlurredVision || hasSevereHeadache)) {
    urgency = 'URGENT';
    reasons.push('High-risk neuro-vascular combination: Elevated blood pressure paired with blurred vision or severe headache (risk of pre-eclampsia / hypertensive encephalopathy).');
  }

  // Dizziness with extreme vitals
  if (hasDizziness && (systolic < 100 || systolic >= 150 || (hr && hr > 110))) {
    urgency = 'URGENT';
    reasons.push('Syncopal risk: Dizziness accompanied by acute hemodynamically unstable vitals.');
  }

  // Pediatric emergency combinations
  if (age < 5 && (hasHighFever || (temp && temp >= 101.5)) && hasVomiting) {
    urgency = 'URGENT';
    reasons.push('Pediatric red-flag: Young child with high fever and vomiting carries high risk of severe dehydration and acute systemic infection.');
  }

  // General priority symptoms
  const priorityKeywords = ['vomiting', 'severe pain', 'stomach pain', 'dizziness', 'severe headache', 'blurred vision', 'weakness / fatigue'];
  for (const kw of priorityKeywords) {
    if (symptomNames.some((sn: string) => sn.includes(kw)) && urgency === 'ROUTINE') {
      urgency = 'PRIORITY';
      reasons.push(`Active clinical symptom reported: "${kw.toUpperCase()}".`);
    }
  }

  if (symptomNames.length >= 3 && urgency === 'ROUTINE') {
    urgency = 'PRIORITY';
    reasons.push(`Multiple co-occurring complaints (${symptomNames.length} symptoms) warrant same-day clinical review.`);
  }

  // Demographic Risk Factors
  if (age < 5) {
    riskFactors.push('Pediatric patient (age under 5 years) — elevated physiological vulnerability');
  } else if (age >= 60) {
    riskFactors.push('Geriatric patient (age 60+ years) — elevated chronic disease comorbidity risk');
  }

  // Completeness & Confidence
  const totalVitalFields = 4;
  const missingCount = missingInfo.length;
  const completeness = (totalVitalFields - missingCount) / totalVitalFields;
  const confidence = Math.round((0.70 + completeness * 0.28) * 100) / 100;

  // Recommended Action
  let recommendedAction = 'Standard outpatient consultation during regular clinic hours.';
  if (urgency === 'URGENT') {
    recommendedAction = 'Immediate Medical Officer consultation. Prepare for emergency stabilization or district hospital referral.';
  } else if (urgency === 'PRIORITY') {
    recommendedAction = 'Doctor review recommended within 2 hours. Ensure vital signs are monitored by village health worker.';
  }

  if (reasons.length === 0) {
    reasons.push('Vitals and clinical observations are within normal clinical ranges.');
    reasons.push('Suitable for regular monitoring or routine outpatient consultation.');
  }

  return res.json({
    urgency,
    urgencyCategory: urgency,
    confidence,
    reasons,
    risk_factors: riskFactors,
    missing_information: missingInfo,
    recommended_next_action: recommendedAction,
    escalation_required: urgency === 'URGENT',
    tier: urgency === 'URGENT'
      ? 'Community Health Centre (CHC) or District Hospital'
      : urgency === 'PRIORITY'
      ? 'Primary Health Centre (PHC)'
      : 'Health & Wellness Centre',
    provenance: 'ICMR & WHO Tele-triage Guidelines (AyuSync Clinical Rules Engine 2026)',
    model_version: '2.5.0',
    rule_version: 'clinical-rules-2026-v2'
  });
};

/**
 * DYNAMIC FACILITY ROUTING PROXY & CLINICAL MATCHMAKER
 * Scores healthcare facilities dynamically based on:
 * - Patient clinical specialty needs (Cardiology/ICU, Maternal/OB-GYN, Trauma, Pediatric, Primary OPD)
 * - Triage urgency category (URGENT, PRIORITY, ROUTINE)
 * - Operational readiness, bed capacity status, and proximity travel time
 */
export const handleRoute = async (req: Request, res: Response) => {
  const urgency = String(req.body?.urgencyCategory || req.body?.urgency || 'ROUTINE').toUpperCase();
  const symptoms: any[] = req.body?.symptoms || [];
  const vitals = req.body?.vitals || {};
  const patient = req.body?.patient || {};

  const symptomList = symptoms.map(s => (typeof s === 'string' ? s : s?.name || s?.symptom || '').toLowerCase());

  const hasChestPain = symptomList.some(s => s.includes('chest pain'));
  const hasShortnessOfBreath = symptomList.some(s => s.includes('breath'));
  const hasHighBP = symptomList.some(s => s.includes('blood pressure') || s.includes('hypertension'));
  const hasVisionHeadache = symptomList.some(s => s.includes('vision') || s.includes('headache'));
  const isFemaleOfReproductiveAge = patient?.gender === 'FEMALE' && (Number(patient?.age) >= 15 && Number(patient?.age) <= 45);
  const isMaternalCandidate = isFemaleOfReproductiveAge && (hasHighBP || hasVisionHeadache || symptomList.some(s => s.includes('pregnan') || s.includes('maternal')));
  const isPediatric = Number(patient?.age) < 6;
  const isCardiacOrCritical = hasChestPain || (vitals?.spO2 && Number(vitals.spO2) < 90) || (vitals?.heartRate && Number(vitals.heartRate) > 125);
  const isTrauma = symptomList.some(s => s.includes('accident') || s.includes('fracture') || s.includes('trauma') || s.includes('severe pain'));

  try {
    // If external AI microservice is available with full payload, proxy to it
    if (req.body?.facilities && Array.isArray(req.body.facilities)) {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/route`, req.body, { timeout: 2500 });
      if (aiResponse.data?.rankedFacilities || aiResponse.data?.ranked_facilities) {
        return res.json(aiResponse.data);
      }
    }
  } catch {}

  // ── DYNAMIC MULTI-SPECIALTY CLINICAL SCORING ENGINE ──
  const facilitiesCatalog = [
    {
      facility_id: 'fac-pune-dist',
      facility_name: 'Aundh District Hospital, Pune',
      facility_type: 'DISTRICT',
      distance_km: 48.0,
      estimated_travel_time_minutes: 55,
      readiness_score: 96,
      free_beds: '52 of 250 Beds Free · 6 ICU Beds Free',
      hasICU: true,
      hasCardiology: true,
      hasNICU: true,
      hasTrauma: true,
      hasMaternal: true,
      capacityStatus: 'OPEN',
    },
    {
      facility_id: 'fac-baramati-chc',
      facility_name: 'Baramati Sub-District Hospital & CHC',
      facility_type: 'CHC',
      distance_km: 12.4,
      estimated_travel_time_minutes: 25,
      readiness_score: 93,
      free_beds: '18 of 60 General · 6 of 18 Maternal Free',
      hasICU: true,
      hasCardiology: false,
      hasNICU: false,
      hasTrauma: true,
      hasMaternal: true,
      capacityStatus: 'OPEN',
    },
    {
      facility_id: 'fac-junnar-chc',
      facility_name: 'Junnar Rural Hospital & Trauma Centre',
      facility_type: 'CHC',
      distance_km: 32.0,
      estimated_travel_time_minutes: 40,
      readiness_score: 87,
      free_beds: '14 of 40 Trauma Beds Free',
      hasICU: false,
      hasCardiology: false,
      hasNICU: false,
      hasTrauma: true,
      hasMaternal: false,
      capacityStatus: 'OPEN',
    },
    {
      facility_id: 'fac-khandala-phc',
      facility_name: 'Khandala Primary Health Centre',
      facility_type: 'PHC',
      distance_km: 4.8,
      estimated_travel_time_minutes: 10,
      readiness_score: 88,
      free_beds: '4 of 10 Day Beds Free',
      hasICU: false,
      hasCardiology: false,
      hasNICU: false,
      hasTrauma: false,
      hasMaternal: true,
      capacityStatus: 'OPEN',
    },
    {
      facility_id: 'fac-saswad-phc',
      facility_name: 'Saswad Rural Hospital',
      facility_type: 'PHC',
      distance_km: 18.2,
      estimated_travel_time_minutes: 30,
      readiness_score: 75,
      free_beds: '0 of 12 Inpatient Beds Free (OPD Open)',
      hasICU: false,
      hasCardiology: false,
      hasNICU: false,
      hasTrauma: false,
      hasMaternal: true,
      capacityStatus: 'OVERCAPACITY',
    }
  ];

  // Dynamic weights based on condition & urgency
  const scoredFacilities = facilitiesCatalog.map(fac => {
    let score = 50;
    const reasons: string[] = [];

    // 1. Proximity score (Max 25 pts)
    const distanceScore = Math.max(0, 25 - (fac.distance_km * 0.45));
    score += distanceScore;

    // 2. Capacity & Readiness status
    if (fac.capacityStatus === 'OVERCAPACITY') {
      score -= 18;
      reasons.push('Operating at high inpatient bed occupancy (100%); optimal for rapid OPD review without admission');
    } else {
      score += 10;
    }

    // 3. Clinical Specialty Match
    if (isCardiacOrCritical) {
      if (fac.facility_id === 'fac-pune-dist') {
        score += 40;
        reasons.unshift('Designated Tertiary Cardiac & Critical Care Center: Advanced 32-bed Intensive Care Unit (ICU) and 24x7 cardiac telemetry');
        reasons.push('Interventional cardiology team and active emergency blood component separation on standby');
      } else if (fac.facility_id === 'fac-baramati-chc') {
        score += 25;
        reasons.unshift('Secondary emergency stabilization unit with active oxygen therapy beds and 24x7 ambulance telemetry');
      } else {
        score -= 20;
        reasons.push('Lacks critical care ICU/cardiology telemetry for acute cardiovascular emergencies');
      }
    } else if (isMaternalCandidate) {
      if (fac.facility_id === 'fac-baramati-chc') {
        score += 42;
        reasons.unshift('Comprehensive Obstetric & Gynecological Emergency Hub: 18 dedicated maternal delivery beds and on-duty obstetrician');
        reasons.push('Rapid blood storage center and neonatal resuscitation unit fully operational');
      } else if (fac.facility_id === 'fac-pune-dist') {
        score += 28;
        reasons.unshift('Tertiary referral backup with Level 3 Neonatal ICU (NICU) if extreme surgical delivery escalation is needed');
      } else if (fac.facility_id === 'fac-saswad-phc') {
        score += 18;
        reasons.unshift('Secondary maternal antenatal consultation clinic available');
      } else if (fac.facility_id === 'fac-khandala-phc') {
        score += urgency === 'ROUTINE' ? 30 : 15;
        reasons.unshift('Local primary center for regular antenatal blood pressure and urine protein monitoring');
      }
    } else if (isTrauma) {
      if (fac.facility_id === 'fac-junnar-chc') {
        score += 42;
        reasons.unshift('Specialized Regional Trauma & Orthopedic Emergency Centre with dedicated digital X-ray and fracture stabilization');
      } else if (fac.facility_id === 'fac-baramati-chc') {
        score += 35;
        reasons.unshift('24x7 Emergency & Trauma unit with active general surgical backup');
      } else if (fac.facility_id === 'fac-pune-dist') {
        score += 30;
        reasons.unshift('Tertiary multi-trauma surgery and intensive neuro-monitoring capabilities');
      }
    } else if (isPediatric && urgency === 'URGENT') {
      if (fac.facility_id === 'fac-pune-dist') {
        score += 38;
        reasons.unshift('Level 3 Pediatric Intensive Care Unit (PICU) & Neonatal ICU (NICU) with specialized pediatric intensivists');
      } else if (fac.facility_id === 'fac-baramati-chc') {
        score += 32;
        reasons.unshift('Secondary pediatric ward with 24x7 emergency child stabilization');
      }
    } else if (urgency === 'ROUTINE') {
      if (fac.facility_id === 'fac-khandala-phc') {
        score += 45;
        reasons.unshift(`Closest neighborhood health center (${fac.distance_km} km · ~10 mins travel time) minimizes patient travel burden`);
        reasons.push('Standard outpatient clinic open with minimal wait time for routine consultations');
        reasons.push('Preserves secondary CHC and district hospital beds for critical emergencies');
      } else if (fac.facility_id === 'fac-baramati-chc') {
        score += 15;
        reasons.unshift('Secondary option if comprehensive diagnostic blood work or ultrasound is requested');
      } else {
        score -= 15;
      }
    } else {
      // PRIORITY GENERAL CASE
      if (fac.facility_id === 'fac-baramati-chc') {
        score += 32;
        reasons.unshift('Comprehensive diagnostic and laboratory services operational today with same-day physician evaluation');
      } else if (fac.facility_id === 'fac-khandala-phc') {
        score += 28;
        reasons.unshift('Nearest primary clinic for rapid same-day Medical Officer evaluation within 10 minutes');
      } else if (fac.facility_id === 'fac-saswad-phc') {
        score += 20;
        reasons.unshift('Alternative rural primary clinic for walk-in priority evaluation');
      }
    }

    if (reasons.length === 0) {
      reasons.push(`Standard ${fac.facility_type} healthcare center serving the rural cluster`);
      reasons.push(`Estimated travel time: ${fac.estimated_travel_time_minutes} minutes (${fac.distance_km} km)`);
    }

    const finalScore = Math.min(99, Math.max(40, Math.round(score)));

    return {
      facility_id: fac.facility_id,
      facility_name: fac.facility_name,
      facility_type: fac.facility_type,
      distance_km: fac.distance_km,
      estimated_travel_time_minutes: fac.estimated_travel_time_minutes,
      score: finalScore,
      readiness_score: fac.readiness_score,
      free_beds: fac.free_beds,
      reasons,
    };
  });

  // Sort descending by calculated score
  scoredFacilities.sort((a, b) => b.score - a.score);

  const bestFacility = scoredFacilities[0];
  const ranked = scoredFacilities.map((f, idx) => ({
    ...f,
    is_alternative: idx > 0
  }));

  return res.json({
    urgency,
    recommended_facility_id: bestFacility.facility_id,
    ranked_facilities: ranked
  });
};

