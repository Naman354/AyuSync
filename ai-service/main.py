from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import random

app = FastAPI(title="AyuSync AI Service", version="1.0.0")

@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    corr_id = request.headers.get("x-correlation-id")
    response = await call_next(request)
    if corr_id:
        response.headers["x-correlation-id"] = corr_id
    return response

# --- Schemas ---

class Symptom(BaseModel):
    name: str
    duration: Optional[str] = None
    severity: Optional[str] = None

class Vital(BaseModel):
    type: str
    value: str
    unit: str

class TriageRequest(BaseModel):
    patientId: str
    symptoms: List[Symptom]
    vitals: List[Vital]

class TriageResponse(BaseModel):
    urgencyCategory: str  # ROUTINE, PRIORITY, URGENT
    reasons: List[str]
    confidence: float
    missingInformation: List[str]

class FacilityConstraint(BaseModel):
    facilityId: str
    name: str
    type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacityStatus: str
    services: List[str]

class RouteRequest(BaseModel):
    patientId: str
    urgencyCategory: str
    requiredServices: List[str]
    facilities: List[FacilityConstraint]

class RankedFacility(BaseModel):
    facilityId: str
    score: float
    reasons: List[str]

class RouteResponse(BaseModel):
    rankedFacilities: List[RankedFacility]

# --- Endpoints ---

@app.post("/triage", response_model=TriageResponse)
async def explainable_triage(request: TriageRequest):
    """
    DEMO/SANDBOX: Heuristic-based triage engine simulating an LLM response.
    Analyzes symptoms and vitals to determine urgency.
    """
    time.sleep(1.5) # Simulate processing time

    reasons = []
    urgency = "ROUTINE"
    confidence = 0.85
    missing_info = []

    # Simple heuristic analysis
    for vital in request.vitals:
        v_type = vital.type.upper()
        v_val = vital.value
        try:
            val_num = float(v_val)
            if v_type == 'SPO2' and val_num < 92:
                urgency = "URGENT"
                reasons.append(f"Critical SpO2 level detected: {val_num}%")
                confidence = 0.95
            elif v_type == 'TEMP':
                if val_num > 103:
                    urgency = "URGENT"
                    reasons.append(f"High fever detected: {val_num}°F")
                elif val_num > 100:
                    if urgency != "URGENT":
                        urgency = "PRIORITY"
                    reasons.append(f"Mild fever detected: {val_num}°F")
            elif v_type == 'HR' and (val_num > 120 or val_num < 50):
                urgency = "URGENT"
                reasons.append(f"Abnormal heart rate: {val_num} bpm")
        except ValueError:
            pass

    for sym in request.symptoms:
        s_name = sym.name.lower()
        if "chest pain" in s_name or "breath" in s_name or "bleed" in s_name:
            urgency = "URGENT"
            reasons.append(f"Critical symptom reported: {sym.name}")
            confidence = 0.98

    if not request.vitals:
        missing_info.append("Blood pressure")
        missing_info.append("Heart rate")
        confidence -= 0.15

    if not reasons:
        reasons.append("No critical indicators identified in current symptoms or vitals.")

    return TriageResponse(
        urgencyCategory=urgency,
        reasons=reasons,
        confidence=round(confidence, 2),
        missingInformation=missing_info
    )

@app.post("/route", response_model=RouteResponse)
async def intelligent_routing(request: RouteRequest):
    """
    DEMO/SANDBOX: Intelligent routing based on capabilities and capacity.
    """
    time.sleep(1.0)
    
    ranked = []
    
    for facility in request.facilities:
        score = 100.0
        reasons = []
        
        if facility.capacityStatus == "CLOSED":
            continue
        elif facility.capacityStatus == "OVERCAPACITY":
            score -= 40
            reasons.append("Facility is operating over normal capacity.")
            
        # Check services
        missing_services = [s for s in request.requiredServices if s not in facility.services]
        if missing_services:
            if request.urgencyCategory == "URGENT":
                # Don't route urgent cases to facilities missing required services
                continue
            else:
                score -= (len(missing_services) * 20)
                reasons.append(f"Missing preferred services: {', '.join(missing_services)}")
        else:
            reasons.append("Has all required services.")
            score += 10
            
        # Distribute scores slightly to prevent ties
        score += random.uniform(0, 5)
        
        ranked.append(RankedFacility(
            facilityId=facility.facilityId,
            score=round(max(0.0, score), 1),
            reasons=reasons
        ))
        
    # Sort by score descending
    ranked.sort(key=lambda x: x.score, reverse=True)
    
    return RouteResponse(rankedFacilities=ranked)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
