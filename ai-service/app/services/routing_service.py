from app.schemas.routing import RoutingRequest, RoutingResponse, RankedFacility
from datetime import datetime, timezone

MAX_FACILITIES_RETURNED  = 3     # Always return at most 3 ranked options
FRESHNESS_THRESHOLD_HOURS = 6    # Data older than this gets a penalty
FRESHNESS_PENALTY_POINTS  = 20.0 # Score reduction for stale data


def _parse_freshness_penalty(last_updated: str | None) -> tuple[float, bool]:
    """Returns (penalty_points, was_penalty_applied)."""
    if not last_updated:
        # No timestamp at all — treat as stale
        return FRESHNESS_PENALTY_POINTS, True
    try:
        updated_dt = datetime.fromisoformat(last_updated.replace("Z", "+00:00"))
        age_hours = (datetime.now(timezone.utc) - updated_dt).total_seconds() / 3600
        if age_hours > FRESHNESS_THRESHOLD_HOURS:
            return FRESHNESS_PENALTY_POINTS, True
    except (ValueError, TypeError):
        return FRESHNESS_PENALTY_POINTS, True
    return 0.0, False


class RoutingService:
    def rank_facilities(self, request: RoutingRequest) -> RoutingResponse:
        ranked: list[RankedFacility] = []
        eliminated: list[str] = []

        for fac in request.facilities:
            # ── HARD CONSTRAINT FILTERS (a failed constraint eliminates the facility) ──
            if fac.capacity == 'CLOSED':
                eliminated.append(f"{fac.name}: facility is CLOSED")
                continue

            if request.emergency and not fac.emergency_capable:
                eliminated.append(f"{fac.name}: emergency case requires ICU/emergency capability")
                continue

            if request.required_specialty and request.required_specialty.lower() not in [s.lower() for s in fac.specialties]:
                eliminated.append(f"{fac.name}: required specialty '{request.required_specialty}' not available")
                continue

            # ── SOFT SCORING ──
            score = 100.0
            explanation_parts: list[str] = []

            # Distance (0.5 pts per km, rural India average 20km acceptable)
            score -= fac.distance_km * 0.5
            explanation_parts.append(f"{fac.distance_km:.1f} km away")

            # Wait time (0.2 pts per minute)
            score -= fac.wait_time_mins * 0.2
            explanation_parts.append(f"~{fac.wait_time_mins} min wait")

            # Readiness (up to +30 pts)
            score += fac.readiness_score * 0.3
            explanation_parts.append(f"{fac.readiness_score:.0f}% readiness")

            # Overcapacity penalty
            if fac.capacity == 'OVERCAPACITY':
                score -= 30.0
                explanation_parts.append("[Overcapacity]")

            # Freshness penalty
            freshness_penalty, penalty_applied = _parse_freshness_penalty(fac.last_updated)
            score -= freshness_penalty
            if penalty_applied:
                explanation_parts.append("[Stale data >6hrs] Verify before referral")

            is_alternative = fac.capacity == 'OVERCAPACITY' or score < 60

            ranked.append(RankedFacility(
                id=fac.id,
                name=fac.name,
                score=round(score, 1),
                explanation=" · ".join(explanation_parts),
                is_alternative=is_alternative,
                freshness_penalty_applied=penalty_applied,
            ))

        # Sort by score descending
        ranked.sort(key=lambda x: x.score, reverse=True)

        # Enforce at least 1 alternative in the result set so UI always has a Plan B
        top = ranked[:MAX_FACILITIES_RETURNED]
        if top and not any(f.is_alternative for f in top):
            # Promote the lowest-scored result to alternative
            top[-1] = top[-1].model_copy(update={"is_alternative": True})

        # Build constraint evaluation summary
        constraint_summary = f"Applied hard constraints: specialty='{request.required_specialty or 'any'}', emergency={request.emergency}."
        if eliminated:
            constraint_summary += f" Eliminated {len(eliminated)} facility(s): {'; '.join(eliminated)}."

        return RoutingResponse(
            ranked_facilities=top,
            constraint_evaluation=constraint_summary,
        )
