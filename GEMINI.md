# Agent Context & Standards (AyuSync)

## 1. Directory Standards
- **/app (Flutter)**: ASHA worker offline-first mobile app. No direct DB connections; all communication must happen via the `/backend` REST APIs.
- **/web (React)**: Doctor dashboard. Must prioritize Socket.io for real-time updates.
- **/backend (Node.js)**: Central orchestrator and API gateway. Connects to PostgreSQL. Connects to `/ai-service` for triage predictions.
- **/ai-service (Python)**: Stateless explainable AI microservice. Exposes REST API (FastAPI) for the backend.

## 2. Flutter SQLite Offline-Sync Transaction Rules
- **Local-First Pattern**: All reads/writes happen against the local SQLite DB first.
- **Sync Queue**: Mutations are pushed to a background sync queue table.
- **Network Awareness**: On connectivity restoration, the sync queue is processed in FIFO order.
- **Conflict Resolution**: Server is the source of truth. Conflicts trigger a UI notification for the ASHA worker.

## 3. Closed-Loop Counter-Referral Logic
- **Upstream**: ASHA worker inputs offline data -> Syncs to Backend -> Backend queries AI Service for triage -> Backend broadcasts to Doctor Dashboard via Socket.io.
- **Downstream**: Doctor reviews triage, inputs counter-referral (prescription, task) -> Backend saves task -> Task synced back to ASHA worker's SQLite queue -> ASHA worker marks task as complete.

## 4. Python AI Integration Context
- **Explainable AI (XAI)**: AI service must return both the prediction (e.g., triage urgency level) and the explanation (e.g., which symptoms contributed most).
- **Format**: JSON response with `urgency_score`, `recommended_action`, and `explanation_text`.

## 5. Progress Tracker (Minimal Context)
**Target:** SIH 2026 Rural Healthcare Platform
**COMPLETED:** Backend (Phases 1-24 - 100%), Frontend (Phases 1-20 - 100%), AI Service (XAI & Routing - 100%), Dual Offline Sync (Dexie & SQLite - 100%), E2E Test Suite (22/22 Passing)
**STATUS:** SIH 2026 Production & Hackathon Ready (100% Verified)
