# 🏥 AyuSync (SwasthyaSetu)
### Rural & Underserved Healthcare Access, Continuity & Closed-Loop Orchestration Platform
**Smart India Hackathon (SIH 2026)** · *Targeted for Rural Frontline Healthcare in India*

[![Backend: Node.js + Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Prisma-blue?style=for-the-badge)](backend/)
[![Web Dashboard: React 18](https://img.shields.io/badge/Web%20Dashboard-React%2018%20%2B%20Vite-indigo?style=for-the-badge)](web/)
[![Mobile: Flutter 3.2+](https://img.shields.io/badge/Mobile-Flutter%20Offline--First-teal?style=for-the-badge)](app/)
[![AI: Explainable XAI](https://img.shields.io/badge/AI%20Microservice-FastAPI%20%2B%20XAI-violet?style=for-the-badge)](ai-service/)
[![Database: PostgreSQL 15](https://img.shields.io/badge/Database-PostgreSQL%2015-emerald?style=for-the-badge)](backend/prisma/)
[![Tests: 22/22 Passing](https://img.shields.io/badge/Tests-22%2F22%20E2E%20Passed-success?style=for-the-badge)](backend/test_phase_g.js)

---

## 📌 1. Executive Summary & Problem Context

In rural India, healthcare delivery across **Sub-Centers / Health & Wellness Centers (HWCs) ➔ Primary Health Centres (PHCs) ➔ Community Health Centres (CHCs) ➔ District Hospitals** is plagued by fragmented, paper-based workflows, intermittent network connectivity, and unmonitored referrals.

This causes **"leaky" care journeys**:
1. **The 1st Delay (Identification & Triage)**: Frontline ASHA/ANM workers struggle to assess clinical urgency accurately or capture comprehensive vitals during village home visits.
2. **The 2nd Delay (Facility Routing & Navigation)**: Referred patients travel long distances to district hospitals only to find specialized wards full, equipment unavailable, or relevant specialists absent.
3. **The 3rd Delay (Treatment & Lost Follow-Up)**: Even when a patient is treated, there is **zero downstream continuity**. Frontline workers never receive counter-referrals or post-discharge care instructions, leaving high-risk maternal, diabetic, and hypertensive patients without home follow-ups.

### 💡 The AyuSync Solution
AyuSync is **not merely another telemedicine app**. It is an **active, observable, and closed-loop healthcare reliability engine** that tracks every patient from initial village assessment to district specialist consultation, digital counter-referral, automated care-gap escalation, and verified home closure.

```mermaid
flowchart LR
    A[Frontline Worker\nASHA/ANM Visit] -->|Offline Sync / Vitals| B(Central API Gateway\nNode.js + Prisma)
    B <-->|Explainable Urgency| C[Stateless AI Microservice\nPython FastAPI]
    B -->|Priority Stratification| D[Real-Time Doctor Queue\nReact + Socket.io]
    D -->|Digital Counter-Referral| B
    B -->|Task Allocation| E[Frontline Task Inbox\nHome Care & Verification]
    B -.->|Overdue Scans| F((Background Daemon\nnode-cron Care Gaps))
    F -.->|Auto-Escalate| D
    E -->|Resolved| G((Verified Closure))
```

---

## 🏛️ 2. High-Level Architecture & Tech Stack

```text
                               ┌──────────────────────────────────────────────┐
                               │             Frontline Clients                │
                               │  - Flutter Mobile App (SQLite + Provider)    │
                               │  - React 18 Web Dashboard (Local Queue Sync) │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTPS / WSS / REST
                                                      ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                              Central API Gateway (Node.js + TypeScript + Express)                      │
 │                                                                                                        │
 │  ├── RBAC & Auth (JWT)              ├── Physiological Vitals Bounds Validation                         │
 │  ├── Referral State Machine (8-stg) ├── Dynamic Facility Bed Capacity & Readiness Routing             │
 │  ├── Sync & Idempotency Engine      ├── Automated Care-Gap Background Engine (node-cron)               │
 │  ├── Real-time Socket.IO Server     └── Standardized 14-Digit ABHA Formatting & Audit Logs             │
 └──────────────────────┬─────────────────────────────┬────────────────────────────────┬──────────────────┘
                        │                             │                                │
                        ▼                             ▼                                ▼
       ┌─────────────────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────────────┐
       │     Relational Storage Layer    │   │      In-Memory Cache      │   │    Stateless AI Engine      │
       │ PostgreSQL (Prisma ORM)         │   │ Redis / Upstash (Optional)│   │ Python FastAPI Microservice │
       │ Supabase / Local Docker         │   │ Socket Adapter & State    │   │ Heuristic XAI Triage        │
       └─────────────────────────────────┘   └───────────────────────────┘   └─────────────────────────────┘
```

### Component Stack
| Subsystem | Technologies & Frameworks | Key Responsibilities |
|---|---|---|
| **Backend API Gateway** | Node.js, Express, TypeScript, Prisma ORM, Socket.IO, node-cron, ioredis, bcrypt, jsonwebtoken | REST endpoints, WebSocket broadcaster, referral state transitions, background care-gap jobs, physiological vitals validation |
| **Doctor & Frontline Web** | React 18, TypeScript, Vite, TailwindCSS, Socket.io-client, Lucide Icons | Live consultation queue, clinical triage review, facility readiness & bed capacity, care-gap tracking, patient profile & timeline |
| **Frontline Mobile App** | Flutter 3.2+, Dart, `sqflite`, `connectivity_plus`, `provider`, `speech_to_text`, `uuid` | ASHA offline intake, local SQLite queuing, speech-to-text symptom capture, background FIFO synchronization, counter-referral task inbox |
| **Explainable AI Service** | Python 3.10+, FastAPI, Pydantic, Uvicorn | Transparent clinical triage (`/triage`), facility routing scoring (`/route`), feature attribution |
| **Database & Caching** | PostgreSQL 15 (Supabase or Docker), Redis 7 (Upstash or Docker) | Normalized transactional storage, audit logs, queue telemetry, reverse-proxy caching |

---

## 📂 3. Monorepo Repository Structure

```text
AyuSync/
├── ai-service/              # Python FastAPI explainable triage microservice
│   ├── app/                 # Modular schemas and routing services
│   ├── main.py              # Core FastAPI app (POST /triage, POST /route)
│   ├── requirements.txt     # Python dependencies (fastapi, uvicorn, pydantic)
│   └── Dockerfile           # Python 3.10 slim container image
├── app/                     # Flutter offline-first mobile application (ASHA/ANM)
│   ├── lib/
│   │   ├── core/            # SQLite DB, sync engine, network monitor, models
│   │   ├── features/        # Auth, Dashboard, Patient, Assessment, Triage, FollowUp
│   │   └── main.dart        # Flutter app bootstrapper, routing & locale config
│   └── pubspec.yaml         # Flutter dependencies (sqflite, connectivity_plus, etc.)
├── backend/                 # Node.js + Express + TypeScript orchestrator
│   ├── prisma/
│   │   ├── schema.prisma    # Complete normalized PostgreSQL schema
│   │   └── seed.ts          # Comprehensive Maharashtra network seed script
│   ├── src/
│   │   ├── events/          # Socket.io real-time connection handler
│   │   ├── jobs/            # node-cron background care-gap automation engine
│   │   ├── lib/             # Prisma client & resilient Redis connector
│   │   ├── middleware/      # Auth JWT, RBAC guards, correlation ID tracker
│   │   ├── modules/         # 15 domain modules (auth, patients, referrals, etc.)
│   │   └── index.ts         # Express server entry point & /health probe
│   ├── Dockerfile           # Node.js alpine container image
│   └── package.json         # Node scripts & dependencies
├── docs/                    # SIH verification & audit reports
│   ├── FINAL_COMPLETION_REPORT.md        # 100% verification sign-off
│   ├── FINAL_PROJECT_AUDIT.md            # Architecture & status report
│   └── MASTER_PLAN_REQUIREMENT_MATRIX.md # 24 Backend & 20 Web phase matrix
├── web/                     # React 18 + Vite Doctor, Frontline Worker & Patient Dashboard
│   ├── src/
│   │   ├── components/      # UI widgets, layout navbar, stat cards, modals
│   │   ├── lib/             # Local offline queue & sync engine, auth session management, API client
│   │   ├── pages/           # 11 active routed views (Queue, Dashboard, Intake, CareGaps, etc.)
│   │   └── App.tsx          # Multi-role routing, protected guards, splash
│   ├── package.json         # Web dependencies & scripts
│   └── tailwind.config.js   # AyuSync rural theme & clinical color tokens
├── docker-compose.yml       # 1-command complete local multi-container stack
├── render.yaml              # Production Render deployment blueprint
└── complete_master_plan.md  # SIH master specification and requirements
```

---

## 👥 4. User Roles & Core Workflows

### 1. 👩‍💼 Frontline Health Worker (ASHA / ANM)
* **Offline Patient Intake**: Register citizens and capture physiological vitals (BP, SpO2, Heart Rate, Temperature, Random Blood Sugar) even with zero network connectivity.
* **Voice-to-Text Symptom Entry (Mobile)**: Frontline workers can dictate symptom descriptions hands-free in the Flutter mobile application using device speech recognition.
* **Explainable AI Triage Assist**: Immediate triage recommendations displaying contributing vitals, urgency classifications, confidence ratings, and missing vital alerts.
* **FIFO Offline Sync**: Mutations are queued locally (SQLite on Flutter, local storage queue on Web) and automatically synchronized with `/api/sync` on network restoration.
* **Counter-Referral Task Inbox**: Receives actionable home follow-up instructions and prescriptions assigned by hospital specialists after patient consultations.

### 2. 👨‍⚕️ Doctor / Specialist (Medical Officer, OBGYN, Pediatrician)
* **Real-Time Priority Queue**: Live WebSocket queue updates automatically stratified by clinical urgency: `EMERGENCY`, `URGENT`, `PRIORITY`, and `ROUTINE`.
* **Explainable Clinical Drawer**: Review patient assessment history, highlighted physiological outliers, AI diagnostic reasons, and missing vitals warnings.
* **Consultation & Counter-Referrals**: Record clinical diagnoses, order diagnostics, prescribe medication regimens, and dispatch home follow-up tasks directly to the patient's local ASHA worker.
* **Audited State Machine Transitions**: Advance referrals through audited lifecycle states (`IN_CONSULTATION` ➔ `COUNTER_REFERRED` ➔ `COMPLETED`).
* **Facility Readiness & Capacity**: Inspect live bed availability (General, Maternal, ICU/HDU, Oxygen-supported) across regional health facilities.
* **Care-Gap Surveillance**: Monitor overdue follow-up tasks and stalled referrals across the district to ensure continuity of care.

### 3. 🧑 Patient / Citizen
* **Personal Health Record Timeline**: Mobile-friendly access to historical clinic visits, vitals records, and diagnosed conditions.
* **Referral & Appointment Tracking**: Real-time status of specialist referrals, booked consultation slots, and hospital directions.
* **Digital Prescriptions**: View doctor clinical notes, diagnostic orders, and prescribed medications.
* **Universal Citizen Access**: Any valid 10-digit Indian phone number can instantly authenticate and access citizen-tier services.

---

## ⭐ 5. Key Highlights & Verified Features

- [x] **Closed-Loop Counter-Referral Engine**: Frontline village intake ➔ Central API gateway ➔ Python AI triage ➔ Real-time doctor consultation ➔ Post-discharge ASHA task creation ➔ Home follow-up closure verification.
- [x] **Offline-First Resilience**: Powered by local mutation queueing on Web and `sqflite` (SQLite) on Flutter Mobile, with deterministic idempotency tokens (`operationId`), timestamp conflict resolution, and background FIFO synchronization.
- [x] **Explainable AI (XAI)**: Clinical triage returns transparent feature attribution, confidence ratings, and missing vital alerts with automatic deterministic fallback if the AI microservice is unreachable.
- [x] **Strict 8-Stage Referral State Machine**:
  `CREATED` ➔ `SUBMITTED` ➔ `ACCEPTED` ➔ `SCHEDULED` ➔ `PATIENT_ARRIVED` ➔ `IN_CONSULTATION` ➔ `COUNTER_REFERRED` ➔ `COMPLETED` (enforced with immutable audit event trails).
- [x] **Deterministic Closed Loop**: Completing a consultation with post-discharge care automatically synthesizes a `FollowUp` task pushed directly to the assigned frontline ASHA worker's device.
- [x] **Automated Care-Gap Engine**: Background `node-cron` daemon continuously identifies stalled referrals (>48 hours in `SUBMITTED`) and overdue home follow-ups, triggering system escalations.
- [x] **Multilingual Mobile App**: Real-time language switching between **English (EN)**, **Hindi (HI)**, and **Marathi (MR)** in the Flutter frontline mobile app.
- [x] **Voice-to-Text Input**: Integrated speech-to-text on the Flutter mobile app enabling frontline ASHA workers to capture symptom descriptions hands-free.
- [x] **Multi-Tab Demo Isolation**: Separate browser tabs run concurrent independent sessions (Doctor, ASHA Worker, and Patient side-by-side) using tab-scoped `sessionStorage` without session conflicts.
- [x] **Standardized 14-Digit ABHA Support**: Demographic intake and digital referral summaries format and validate 14-digit Ayushman Bharat Health Account (ABHA) IDs (`XX-XXXX-XXXX-XXXX`).

---

## 🔑 6. Pre-Seeded Demo Accounts & Credentials

The platform includes a realistic healthcare network situated in **Maharashtra (Pune District: Baramati CHC – Aundh District Hospital – Khandala PHC – Saswad PHC – Junnar Rural Hospital)**.

> 🛡️ **Universal Demo Password:** `password123`

### 👨‍⚕️ Doctors & Specialists
| Designation | Name | Facility / Specialty | Mobile Number | Password |
|---|---|---|---|---|
| **Doctor (CMO)** | Dr. Rajesh Deshmukh | Baramati Sub-District Hospital & CHC (Internal Medicine) | `+919876543210` | `password123` |
| **Specialist (OBGYN)** | Dr. Priya Kulkarni | Baramati CHC & Aundh District Hospital (High-Risk Maternal) | `+919876543211` | `password123` |
| **Pediatrician** | Dr. Anand Joshi | Junnar Rural Hospital & Trauma Centre (Pediatrics / NICU) | `+919876543212` | `password123` |

### 👩‍💼 Frontline Healthcare Workers (ASHA & ANM)
| Role | Name | Assigned Sector / Facility | Mobile Number | Password |
|---|---|---|---|---|
| **Senior ASHA Worker** | Sunita Patil | Khandala Sub-Center / Khandala PHC | `+919998887776` | `password123` |
| **ASHA Worker** | Vandana Shinde | Saswad Sector / Saswad PHC | `+919998887777` | `password123` |
| **Auxiliary Nurse (ANM)** | Kavita More | Baramati Sector / Baramati CHC | `+919998887778` | `password123` |

### 🧑 Patients & Clinical Personas
| Persona | Name | Clinical Profile & Conditions | Mobile Number | Password |
|---|---|---|---|---|
| **Chronic Care** | Ramesh Kulkarni | Essential Hypertension & Type 2 Diabetes (Age 58) | `+919111222333` | `password123` |
| **High-Risk Maternal** | Pooja Sharma | Gestational Hypertension, 3rd Trimester (Age 26) | `+919111222334` | `password123` |
| **Acute Emergency** | Aniket Gaikwad | Acute Gastroenteritis & Severe Dehydration (Age 34) | `+919111222335` | `password123` |
| **Diabetic Follow-up**| Dilip Thorat | Diabetic Nephropathy Screening Overdue (Age 45) | `+919111222338` | `password123` |
| **Anemia Program** | Sunita Chavan | Severe Nutritional Anemia (Hb 7.2 g/dL) (Age 29) | `+919111222341` | `password123` |

*(Note: Any valid 10-digit mobile number can log in immediately as an ad-hoc citizen/patient persona).*

---

## 🚀 7. Quick Start Guide (Local Development)

### Option A: 🐳 Docker Compose (Fastest — 1 Command)
Runs **PostgreSQL 15**, **Redis 7**, **Python AI Service**, and **Node.js Backend** in synchronized containers:

```bash
# From workspace root
docker-compose up --build
```

- **Backend API**: `http://localhost:5000`
- **AI Microservice**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432` (db: `ayusync`, user: `postgres`, password: `password`)
- **Redis**: `localhost:6379`

Now launch the Web UI in another terminal:
```bash
cd web
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Option B: 🛠️ Manual Multi-Service Setup

#### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+ & pip
- PostgreSQL 14+ (or a free cloud database on [Supabase](https://supabase.com))
- Flutter SDK 3.2+ (only if running the mobile client)

#### 2. Backend Gateway Setup
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment (.env)
cp .env.example .env
# Edit .env with your PostgreSQL credentials (DATABASE_URL and DIRECT_URL)

# 3. Push database schema & seed Maharashtra clinical network
npx prisma generate
npx prisma db push --accept-data-loss
npm run seed

# 4. Start backend in development mode
npm run dev
# Running on http://localhost:5000 (with care-gap daemon active)
```

#### 3. Web Dashboard Setup
```bash
cd web

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
# Running on http://localhost:5173
```

#### 4. Python AI Service Setup (Optional)
*(Backend automatically uses heuristic fallback if AI service is offline).*
```bash
cd ai-service

# 1. Install dependencies
pip install -r requirements.txt

# 2. Start FastAPI server with Uvicorn
uvicorn main:app --reload --port 8000
# Docs available at http://localhost:8000/docs
```

#### 5. Flutter Mobile App Setup (Optional)
```bash
cd app

# 1. Fetch Flutter packages
flutter pub get

# 2. Launch on connected Android device, emulator, or Chrome
flutter run
```

---

## ⚙️ 8. Environment Variables Reference

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development

# Database (PostgreSQL / Supabase)
# For Supabase: Transaction Pooler URL (port 6543) for DATABASE_URL; Direct URL (port 5432) for DIRECT_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/ayusync?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/ayusync?schema=public"

# Redis (Local Docker or Upstash - optional, falls back gracefully to in-memory)
REDIS_URL="redis://localhost:6379"

# AI Microservice URL
AI_SERVICE_URL="http://localhost:8000"

# Security & CORS
JWT_SECRET="dev-ayusync-secret-sih2026-key"
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:3000"
```

### Web (`web/.env`)
```env
# Backend API Gateway URL (or leave blank in dev for local proxy)
VITE_API_URL=http://localhost:5000
```

---

## 🧪 9. Verification, Testing & System Health

### 1. Automated E2E Regression Suite
The repository includes comprehensive end-to-end integration tests covering authentication, patient creation, real-time queues, counter-referrals, conflict handling, and AI triage:

```bash
cd backend
node test_phase_g.js
```
Expected output:
```text
--- STARTING PHASE G END-TO-END VERIFICATION ---
[PASS] 1. Worker login -> 200
[PASS] 2. Doctor login -> 200
[PASS] 3. Unauthenticated request -> 401
[PASS] Patient registration -> 201
[PASS] 4. Patient search -> 200
[PASS] 5. Patient timeline -> 200
[PASS] 6. Dashboard analytics -> 200
...
All 22 Scenarios Verified Successfully.
```

### 2. Live Healthcheck Endpoint
Verify system runtime status, database connectivity, and Redis state via:
```bash
curl http://localhost:5000/health
```
Response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptimeSeconds": 1420,
  "timestamp": "2026-09-15T00:30:00.000Z"
}
```

---

## 🌐 10. Production Cloud Deployment Guide

AyuSync is pre-configured for cost-effective zero-downtime deployment:

```mermaid
graph TD
    Client[Browser / Mobile App] -->|Static SPA| Vercel[Vercel Frontend CDN]
    Vercel -->|REST / Socket.io| RenderBackend[Render: Node.js Express Gateway]
    RenderBackend <-->|XAI Inference| RenderAI[Render: Python FastAPI AI Service]
    RenderBackend <-->|Pooler Port 6543| Supabase[(Supabase PostgreSQL)]
    RenderBackend <-->|TLS rediss://| Upstash[(Upstash Serverless Redis)]
```

### Deploy Backend & AI Service to Render
Use the built-in [`render.yaml`](render.yaml) blueprint:
1. Link your GitHub repository to [Render](https://dashboard.render.com).
2. Select **New ➔ Blueprint** and point to `render.yaml`.
3. Set your environment variables in the Render dashboard:
   - `DATABASE_URL`: Supabase Transaction Pooler connection string (`port 6543`).
   - `DIRECT_URL`: Supabase Direct connection string (`port 5432`).
   - `REDIS_URL`: Upstash Redis TLS connection string (`rediss://...`).
   - `CORS_ORIGINS`: Your Vercel frontend domain (e.g. `https://ayusync.vercel.app`).

### Deploy Web Frontend to Vercel
1. Import the `/web` subdirectory into [Vercel](https://vercel.com).
2. Set Build Command to `npm run build` and Output Directory to `dist`.
3. Configure Environment Variable:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://ayusync-backend.onrender.com`).
4. [`web/vercel.json`](web/vercel.json) automatically handles SPA rewrites.

---

## 📜 11. Audit Records & Technical Reports

For detailed historical documentation, hackathon requirement matrices, and architectural audits, refer to the documents in [`/docs`](docs/):
- **[Final Completion Report](docs/FINAL_COMPLETION_REPORT.md)**: Hackathon milestone sign-off and verification report.
- **[Final Project Audit](docs/FINAL_PROJECT_AUDIT.md)**: Architectural breakdown across database, AI, security, and offline synchronizers.
- **[Master Plan Requirement Matrix](docs/MASTER_PLAN_REQUIREMENT_MATRIX.md)**: SIH master specification rubric and phase mapping from `complete_master_plan.md`.

---

## 🤝 12. Team & Acknowledgments

* **Platform:** AyuSync (SwasthyaSetu)
* **Initiative:** Smart India Hackathon (SIH 2026)
* **Theme:** Rural & Underserved Healthcare Delivery & Continuity
* **License:** MIT License (Open Source)
