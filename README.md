# AyuSync / SwasthyaSetu: Rural Healthcare Orchestration Platform (SIH 2026)

AyuSync (SwasthyaSetu) is an offline-first healthcare orchestration platform designed to bridge the gap between rural frontline healthcare workers (ASHA/ANM) and district-level specialist facilities across India.

---

## 1. Project Overview
AyuSync transforms fragmented rural healthcare delivery into a cohesive, closed-loop care journey. It ensures that rural patients receive timely community assessments, explainable AI triage, priority hospital scheduling, closed-loop counter-referrals, and guaranteed home follow-ups through a robust state-machine driven architecture.

## 2. Problem
Rural healthcare suffers from disjointed systems, lack of persistent connectivity, and manual paper-based follow-ups, leading to "leaky" care journeys where vulnerable patients are lost in transition between village sub-centers and district hospitals.

## 3. Solution
AyuSync provides an end-to-end connected ecosystem:
- **Offline-first mobile data collection** for ASHA workers in remote villages.
- **Explainable AI (XAI) clinical triage** identifying high-risk symptoms and vitals.
- **Dynamic facility telemetry & readiness intelligence** to route referrals to available facilities.
- **Real-time doctor consultation queue** with priority stratification.
- **Closed-loop counter-referrals** where doctors send digital care instructions directly back to ASHA workers.
- **Automated care-gap detection** ensuring zero patients are lost in transition.

---

## 4. Architecture

```text
[ASHA Worker / Mobile App]
        │ (Offline-first / SQLite sync)
        ▼
[Central Backend API Gateway (Node.js/Express)] ◄──► [Explainable AI Microservice (FastAPI)]
        │                                                     │
        ├──────────────────────┬──────────────────────────────┘
        ▼                      ▼
[PostgreSQL Database]   [Real-time WebSockets]
                               │
                               ▼
                    [Doctor & Clinic Dashboard (React.js)]
```

- **App (Mobile)**: Flutter offline-first application for ASHA workers using `sqflite` and `connectivity_plus` for intelligent background syncing.
- **Web (Dashboard)**: React.js + TypeScript SPA with TailwindCSS, Lucide icons, responsive navigation, and WebSockets for real-time triage and queue telemetry.
- **Backend**: Node.js + Express + Socket.io + PostgreSQL (Prisma ORM). Handles strict RBAC, data isolation, physiological validation, and referral state machines.
- **AI Service**: Python FastAPI microservice utilizing heuristic and XAI models for explainable clinical triage and intelligent facility routing.

---

## 5. User Roles

1. **Doctor / Specialist**: Views real-time triage queues, conducts clinical consultations, reviews AI recommendations, and issues counter-referrals with follow-up instructions.
2. **Worker (ASHA / ANM)**: Conducts community health visits, captures vitals, manages care-gap tasks, and receives counter-referral instructions.
3. **Patient**: Accesses personal clinical health record timeline, diagnoses, prescriptions, and referral status.
4. **Facility Admin**: Monitors real-time bed capacities, ICU availability, oxygen reserves, and district-wide telemetry.

---

## 6. Complete Feature List

- ✅ **Offline-First Data Collection & Sync**: Captures vitals and assessments locally, syncs automatically on connectivity restoration.
- ✅ **Rigorous Input Validation & Physiological Bounds**: Comprehensive client and server-side checks for BP, HR, SpO2, blood glucose, and demographics.
- ✅ **Real-Time Doctor Queue**: Live queue with priority sorting (Routine, Priority, Urgent, Emergency).
- ✅ **Explainable AI Clinical Triage**: Generates urgency scores with transparent clinical explanations and confidence metrics.
- ✅ **Referral State Machine**: Enforces strict audit-logged transitions (`CREATED` → `SUBMITTED` → `ACCEPTED` → `SCHEDULED` → `PATIENT_ARRIVED` → `IN_CONSULTATION` → `COUNTER_REFERRED` → `COMPLETED`).
- ✅ **Closed-Loop Counter-Referrals**: Downstream transmission of doctor prescriptions and home follow-up instructions to ASHA workers.
- ✅ **Care-Gap Detection (Background Engine)**: Automated detection of overdue maternal visits, missed diabetic checkups, and stuck referrals.
- ✅ **Facility Telemetry & Capacity Tracking**: Real-time visibility into ICU beds, general beds, and facility operational status (`OPEN` vs `OVERCAPACITY`).
- ✅ **Role-Based Access Control (RBAC)**: Fine-grained permissions for Doctors, Workers, and Patients.

---

## 7. Demo Accounts & Credentials

The platform is pre-seeded with realistic, interconnected healthcare profiles situated in **Maharashtra (Pune District: Baramati – Khandala – Saswad – Junnar – Aundh)**.

> **Universal Demo Password:** `password123`

### 👨‍⚕️ Doctors & Specialists
| Role | Name | Facility | Mobile Number | Password |
|---|---|---|---|---|
| **Doctor (CMO)** | Dr. Rajesh Deshmukh | Baramati Sub-District Hospital & CHC | `+919876543210` | `password123` |
| **Specialist (OBGYN)** | Dr. Priya Kulkarni | Baramati CHC & Aundh District Hospital | `+919876543211` | `password123` |
| **Pediatrician** | Dr. Anand Joshi | Junnar Rural Hospital & Trauma Centre | `+919876543212` | `password123` |

### 👩‍💼 Frontline Health Workers (ASHA & ANM)
| Role | Name | Area / Sub-Center | Mobile Number | Password |
|---|---|---|---|---|
| **Senior ASHA Worker** | Sunita Patil | Khandala Sub-Center | `+919998887776` | `password123` |
| **ASHA Worker** | Vandana Shinde | Saswad Sector | `+919998887777` | `password123` |
| **ANM Nurse** | Kavita More | Baramati Sector | `+919998887778` | `password123` |

### 🧑 Patients (Direct Health Record Timeline)
| Role | Name | Clinical Profile | Mobile Number | Password |
|---|---|---|---|---|
| **Patient (Chronic Care)** | Ramesh Kulkarni | Essential Hypertension & Type 2 Diabetes | `+919111222333` | `password123` |
| **Patient (Maternal Care)** | Pooja Sharma | High-Risk Pregnancy (Gestational Hypertension) | `+919111222334` | `password123` |
| **Patient (Acute Referral)** | Aniket Gaikwad | Acute Gastroenteritis & Dehydration | `+919111222335` | `password123` |

---

## 8. Setup & Environment Configuration

### Backend Environment Variables (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@hostname:5432/dbname"
DIRECT_URL="postgresql://user:password@hostname:5432/dbname"
JWT_SECRET="your-jwt-secret-key"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
AI_SERVICE_URL="http://localhost:8000"
```

### Frontend Environment Variables (`web/.env`)
```env
# Point to your API gateway (or leave blank for relative proxy in development)
VITE_API_URL=http://localhost:5000
```
*(In production, set `VITE_API_URL` in your hosting dashboard such as Vercel. Do not commit `.env` files containing production URLs or secrets to version control).*

---

## 9. Running Locally

### 1. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed     # Seeds realistic Maharashtra healthcare network
npm run dev      # Runs Express + Socket.io server on http://localhost:5000
```

### 2. Web Frontend
```bash
cd web
npm install
npm run dev      # Launches Vite dev server on http://localhost:5173
```

### 3. AI Microservice (Optional)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 10. SIH 2026 Innovation & Systemic Resilience

1. **Deterministic Closed Loop**: Unlike standard telemedicine apps that end when a referral is sent, AyuSync tracks the patient back to the community via digital counter-referrals.
2. **Graceful AI Degradation**: If the AI triage service is unreachable or experiences network lag, the backend gracefully falls back to clinical rule-based triage without dropping requests.
3. **Offline Integrity**: ASHA workers in connectivity shadow zones can record complete patient assessments without loss of data.
