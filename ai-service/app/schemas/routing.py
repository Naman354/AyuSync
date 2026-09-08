from pydantic import BaseModel
from typing import List, Optional

class FacilityInfo(BaseModel):
    id: str
    name: str
    specialties: List[str]
    capacity: str                    # OPEN | CLOSED | OVERCAPACITY
    emergency_capable: bool
    distance_km: float
    wait_time_mins: int
    readiness_score: float           # 0–100
    last_updated: Optional[str] = None  # ISO-8601 timestamp of last data refresh

class RoutingRequest(BaseModel):
    required_specialty: Optional[str]
    emergency: bool
    facilities: List[FacilityInfo]

class RankedFacility(BaseModel):
    id: str
    name: str
    score: float
    explanation: str
    is_alternative: bool
    freshness_penalty_applied: bool = False  # True when data is >6 hours stale

class RoutingResponse(BaseModel):
    ranked_facilities: List[RankedFacility]
    constraint_evaluation: str
