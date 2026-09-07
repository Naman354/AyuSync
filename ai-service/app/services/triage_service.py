from app.schemas.triage import TriageRequest, TriageResponse

RULE_VERSION = "icmr-triage-rules-v1.2"
SERVICE_VERSION = "heuristic-engine-v2.0"

# ── Hard clinical override thresholds (WHO / ICMR emergency triage guidelines) ──
CRITICAL_SPO2_THRESHOLD          = 90.0   # %
CRITICAL_SYSTOLIC_BP_HIGH        = 180    # mmHg
CRITICAL_SYSTOLIC_BP_LOW         = 80     # mmHg
CRITICAL_HEART_RATE_HIGH         = 130    # bpm
CRITICAL_HEART_RATE_LOW          = 40     # bpm
CRITICAL_TEMP_HIGH_F             = 104.0  # °F
CRITICAL_RESP_RATE_HIGH          = 30     # breaths/min
CRITICAL_RESP_RATE_LOW           = 8      # breaths/min
PRIORITY_TEMP_HIGH_F             = 102.0  # °F
PRIORITY_HEART_RATE_HIGH         = 100    # bpm
PRIORITY_SYSTOLIC_BP_HIGH        = 140    # mmHg

# Symptom keyword banks
URGENT_SYMPTOM_KEYWORDS   = ['chest pain', 'breathless', 'breathing', 'unconscious', 'fitting', 'seizure', 'bleeding', 'stroke', 'paralysis', 'cannot breathe']
PRIORITY_SYMPTOM_KEYWORDS = ['pain', 'vomiting', 'fever', 'dizziness', 'swelling', 'headache', 'rash', 'weakness']

# Vulnerable age bands
VULNERABLE_AGE_INFANT_MAX = 2
VULNERABLE_AGE_ELDER_MIN  = 65


class TriageService:
    def evaluate(self, request: TriageRequest) -> TriageResponse:
        urgency       = "ROUTINE"
        reasons       = []
        risk_factors  = []
        missing_info  = []
        escalation    = False
        # Tracks how many data dimensions were available (for confidence)
        completeness_score = 0
        total_dimensions   = 5  # vitals, symptoms, age, gender, history

        # ── 1. HARD VITAL OVERRIDES (these cannot be downgraded by any other logic) ──
        if request.vitals:
            completeness_score += 1
            v = request.vitals

            # SpO2 — most critical: respiratory failure
            if v.spo2 is not None:
                if v.spo2 < CRITICAL_SPO2_THRESHOLD:
                    urgency   = "URGENT"
                    escalation = True
                    reasons.append(f"CRITICAL: SpO2 {v.spo2}% — below safe threshold (90%). Possible respiratory failure.")
            else:
                missing_info.append("SpO2 (oxygen saturation) not recorded")

            # Blood pressure — parse systolic from "120/80" format
            if v.blood_pressure:
                try:
                    systolic = int(v.blood_pressure.split('/')[0])
                    if systolic >= CRITICAL_SYSTOLIC_BP_HIGH:
                        urgency   = "URGENT"
                        escalation = True
                        reasons.append(f"CRITICAL: Systolic BP {systolic} mmHg — hypertensive emergency.")
                    elif systolic <= CRITICAL_SYSTOLIC_BP_LOW:
                        urgency   = "URGENT"
                        escalation = True
                        reasons.append(f"CRITICAL: Systolic BP {systolic} mmHg — hypotensive shock risk.")
                    elif systolic >= PRIORITY_SYSTOLIC_BP_HIGH and urgency == "ROUTINE":
                        urgency = "PRIORITY"
                        reasons.append(f"Elevated BP {systolic} mmHg — requires monitoring.")
                except (ValueError, IndexError):
                    missing_info.append("Blood pressure value could not be parsed")
            else:
                missing_info.append("Blood pressure not recorded")

            # Heart rate
            if v.heart_rate is not None:
                if v.heart_rate > CRITICAL_HEART_RATE_HIGH or v.heart_rate < CRITICAL_HEART_RATE_LOW:
                    urgency   = "URGENT"
                    escalation = True
                    reasons.append(f"CRITICAL: Heart rate {v.heart_rate} bpm — outside safe range (40-130).")
                elif v.heart_rate > PRIORITY_HEART_RATE_HIGH and urgency == "ROUTINE":
                    urgency = "PRIORITY"
                    reasons.append(f"Elevated heart rate {v.heart_rate} bpm — tachycardia risk.")
            else:
                missing_info.append("Heart rate not recorded")

            # Temperature
            if v.temperature is not None:
                if v.temperature >= CRITICAL_TEMP_HIGH_F:
                    urgency   = "URGENT"
                    escalation = True
                    reasons.append(f"CRITICAL: Temperature {v.temperature}F — hyperpyrexia.")
                elif v.temperature >= PRIORITY_TEMP_HIGH_F and urgency == "ROUTINE":
                    urgency = "PRIORITY"
                    reasons.append(f"High fever {v.temperature}°F — active infection likely.")
            else:
                missing_info.append("Body temperature not recorded")

            # Respiratory rate
            if v.respiratory_rate is not None:
                if v.respiratory_rate >= CRITICAL_RESP_RATE_HIGH or v.respiratory_rate <= CRITICAL_RESP_RATE_LOW:
                    urgency   = "URGENT"
                    escalation = True
                    reasons.append(f"CRITICAL: Respiratory rate {v.respiratory_rate}/min — outside safe range (8-30).")
            else:
                missing_info.append("Respiratory rate not recorded")

        else:
            missing_info.append("No vitals provided — clinical assessment severely limited")

        # ── 2. SYMPTOM ANALYSIS ──
        if request.symptoms:
            completeness_score += 1
            for sym in request.symptoms:
                s_text = sym.symptom.lower() if sym.symptom else ""
                severity_high = sym.severity and sym.severity.upper() == 'HIGH'

                if any(k in s_text for k in URGENT_SYMPTOM_KEYWORDS) or severity_high:
                    if urgency != "URGENT":  # only escalate, never downgrade
                        urgency = "URGENT"
                        escalation = True
                    reasons.append(f"High-risk symptom: '{sym.symptom}'" + (f" (duration: {sym.duration})" if sym.duration else ""))
                elif any(k in s_text for k in PRIORITY_SYMPTOM_KEYWORDS):
                    if urgency == "ROUTINE":
                        urgency = "PRIORITY"
                    reasons.append(f"Priority symptom: '{sym.symptom}'" + (f" (duration: {sym.duration})" if sym.duration else ""))
        else:
            missing_info.append("Presenting symptoms not recorded")

        # ── 3. DEMOGRAPHIC RISK FACTORS ──
        if request.age is not None:
            completeness_score += 1
            if request.age < VULNERABLE_AGE_INFANT_MAX:
                risk_factors.append(f"Infant / neonatal patient (age {request.age}) — high vulnerability")
                if urgency == "ROUTINE":
                    urgency = "PRIORITY"
            elif request.age >= VULNERABLE_AGE_ELDER_MIN:
                risk_factors.append(f"Elderly patient (age {request.age}) — elevated complication risk")
                if urgency == "ROUTINE":
                    urgency = "PRIORITY"
        else:
            missing_info.append("Patient age not provided")

        if request.gender:
            completeness_score += 1
            if request.gender.upper() == 'F':
                risk_factors.append("Female patient — screen for pregnancy-related complications if of reproductive age")

        if request.history:
            completeness_score += 1
            history_lower = request.history.lower()
            chronic_conditions = ['diabetes', 'hypertension', 'tuberculosis', 'copd', 'asthma', 'cardiac', 'hiv', 'malnutrition']
            for condition in chronic_conditions:
                if condition in history_lower:
                    risk_factors.append(f"Pre-existing condition: {condition.title()}")

        # ── 4. FALLBACK REASON ──
        if not reasons:
            reasons.append("No acute clinical triggers detected — standard routine care")

        # ── 5. RECOMMENDED ACTION ──
        action_map = {
            "URGENT":   "Immediate referral and specialist consultation required. Do not delay transport.",
            "PRIORITY": "Same-day clinical review required. Monitor vitals every 30 minutes.",
            "ROUTINE":  "Standard follow-up. Re-assess in 48 hours if symptoms persist."
        }
        recommended_action = action_map[urgency]

        # ── 6. CONFIDENCE (based on data completeness) ──
        base_confidence = 0.65
        completeness_boost = (completeness_score / total_dimensions) * 0.30
        missing_penalty = len(missing_info) * 0.04
        confidence = round(min(0.97, max(0.40, base_confidence + completeness_boost - missing_penalty)), 2)

        return TriageResponse(
            urgency=urgency,
            confidence=confidence,
            reasons=reasons,
            risk_factors=risk_factors,
            missing_information=missing_info,
            recommended_next_action=recommended_action,
            escalation_required=escalation,
            provenance="AyuSync Deterministic Clinical Rule Engine — ICMR Triage Guidelines",
            model_version=SERVICE_VERSION,
            rule_version=RULE_VERSION,
        )
