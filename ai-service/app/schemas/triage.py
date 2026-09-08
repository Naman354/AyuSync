from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SymptomInfo(BaseModel):
    symptom: str
    duration: Optional[str]
    severity: Optional[str]

class VitalInfo(BaseModel):
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    spo2: Optional[float] = None           # Oxygen saturation (%)
    respiratory_rate: Optional[int] = None # Breaths per minute

class TriageRequest(BaseModel):
    patientId: str
    age: int
    gender: str
    symptoms: List[SymptomInfo]
    vitals: Optional[VitalInfo]
    history: Optional[str]

class TriageResponse(BaseModel):
    urgency: str                  # ROUTINE | PRIORITY | URGENT
    confidence: float             # 0.0 – 1.0
    reasons: List[str]            # Human-readable trigger descriptions
    risk_factors: List[str]       # Demographic / chronic risk flags
    missing_information: List[str] # What was absent from the input
    recommended_next_action: str
    escalation_required: bool
    provenance: str               # Engine description
    model_version: str            # Service version
    rule_version: str             # Clinical rule-set version
