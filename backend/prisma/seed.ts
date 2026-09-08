import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres.xnewhtdoqyxljoqsxeol:LuffySenpai4312@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
    }
  }
});

// Deterministic date anchor (around current date)
const NOW = new Date();
const d = (offsetDays: number, offsetHours: number = 0) =>
  new Date(NOW.getTime() + (offsetDays * 24 + offsetHours) * 60 * 60 * 1000);

async function main() {
  console.log('🚀 Starting AyuSync comprehensive database reset and realistic seeding...');

  // ─── 0. CLEAR EXISTING TEST DATA SAFELY ────────────────────────────────────
  console.log('🧹 Clearing existing dummy and transactional data...');
  const safeDelete = async (name: string, fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (e: any) {
      console.warn(`⚠️ Safe cleanup warning on ${name}:`, e?.message || e);
    }
  };

  await safeDelete('syncOperation', () => prisma.syncOperation.deleteMany());
  await safeDelete('auditLog', () => prisma.auditLog.deleteMany());
  await safeDelete('notification', () => prisma.notification.deleteMany());
  await safeDelete('aIRecommendation', () => prisma.aIRecommendation.deleteMany());
  await safeDelete('symptom', () => prisma.symptom.deleteMany());
  await safeDelete('vital', () => prisma.vital.deleteMany());
  await safeDelete('clinicalObservation', () => prisma.clinicalObservation.deleteMany());
  await safeDelete('prescription', () => prisma.prescription.deleteMany());
  await safeDelete('diagnosticResult', () => prisma.diagnosticResult.deleteMany());
  await safeDelete('diagnosticOrder', () => prisma.diagnosticOrder.deleteMany());
  await safeDelete('assessment', () => prisma.assessment.deleteMany());
  await safeDelete('queueEntry', () => prisma.queueEntry.deleteMany());
  await safeDelete('appointment', () => prisma.appointment.deleteMany());
  await safeDelete('counterReferral', () => prisma.counterReferral.deleteMany());
  await safeDelete('referralEvent', () => prisma.referralEvent.deleteMany());
  await safeDelete('referral', () => prisma.referral.deleteMany());
  await safeDelete('followUp', () => prisma.followUp.deleteMany());
  await safeDelete('task', () => prisma.task.deleteMany());
  await safeDelete('encounter', () => prisma.encounter.deleteMany());
  await safeDelete('patientIdentifier', () => prisma.patientIdentifier.deleteMany());
  await safeDelete('consent', () => prisma.consent.deleteMany());
  await safeDelete('condition', () => prisma.condition.deleteMany());
  await safeDelete('patient', () => prisma.patient.deleteMany());
  await safeDelete('facilityService', () => prisma.facilityService.deleteMany());
  await safeDelete('facilityCapacity', () => prisma.facilityCapacity.deleteMany());
  await safeDelete('facilityAvailability', () => prisma.facilityAvailability.deleteMany());
  await safeDelete('facilityDoctor', () => prisma.facilityDoctor.deleteMany());
  await safeDelete('worker', () => prisma.worker.deleteMany());
  await safeDelete('specialist', () => prisma.specialist.deleteMany());
  await safeDelete('doctor', () => prisma.doctor.deleteMany());
  await safeDelete('facility', () => prisma.facility.deleteMany());
  await safeDelete('user', () => prisma.user.deleteMany());

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── 1. PERMISSIONS & ROLES ────────────────────────────────────────────────
  console.log('🔐 Setting up permissions and roles...');
  const permissionsList = [
    'patient.read', 'patient.create', 'patient.update',
    'encounter.read', 'encounter.create',
    'assessment.read', 'assessment.create',
    'referral.read', 'referral.create', 'referral.update',
    'facility.read', 'facility.update',
    'queue.read', 'queue.manage',
    'task.read', 'task.update'
  ];

  const permissionRecords = [];
  for (const action of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action, description: `Grants ${action} capability` }
    });
    permissionRecords.push(perm);
  }

  const doctorRole = await prisma.role.upsert({
    where: { name: 'DOCTOR' },
    update: { permissions: { connect: permissionRecords.map(p => ({ id: p.id })) } },
    create: {
      name: 'DOCTOR',
      description: 'Medical Officers, General Physicians and Specialists',
      permissions: { connect: permissionRecords.map(p => ({ id: p.id })) }
    }
  });

  const workerRole = await prisma.role.upsert({
    where: { name: 'WORKER' },
    update: { permissions: { connect: permissionRecords.map(p => ({ id: p.id })) } },
    create: {
      name: 'WORKER',
      description: 'Frontline ASHA, ANM, and Community Health Officers',
      permissions: { connect: permissionRecords.map(p => ({ id: p.id })) }
    }
  });

  const patientRole = await prisma.role.upsert({
    where: { name: 'PATIENT' },
    update: {},
    create: {
      name: 'PATIENT',
      description: 'Citizens and patients accessing health timeline'
    }
  });

  // ─── 2. MAHARASHTRA HEALTHCARE FACILITIES ─────────────────────────────────
  console.log('🏥 Creating Maharashtra healthcare network facilities...');

  // Primary Hub: Baramati CHC
  const facBaramatiChc = await prisma.facility.create({
    data: {
      id: 'fac-baramati-chc',
      name: 'Baramati Sub-District Hospital & CHC',
      type: 'CHC',
      level: 2,
      address: 'Near Bus Stand, Baramati, Pune District, Maharashtra 413102',
      latitude: 18.1517,
      longitude: 74.5772,
      availability: {
        create: {
          status: 'OPEN',
          readinessScore: 92
        }
      },
      services: {
        create: [
          { service: 'Emergency & Trauma Care', isAvailable: true },
          { service: 'Maternal & Child Health Care', isAvailable: true },
          { service: 'Digital X-Ray & Diagnostics', isAvailable: true },
          { service: '24x7 Ambulance Telemetry', isAvailable: true },
          { service: 'Blood Storage Center', isAvailable: true }
        ]
      },
      capacities: {
        create: [
          { resource: 'General Ward Beds', total: 60, occupied: 42 },
          { resource: 'Maternal Delivery Beds', total: 18, occupied: 12 },
          { resource: 'Oxygen Support Beds', total: 24, occupied: 15 },
          { resource: 'ICU / HDU Beds', total: 8, occupied: 5 }
        ]
      }
    }
  });

  // Tertiary Referral: Aundh District Hospital, Pune
  const facPuneDist = await prisma.facility.create({
    data: {
      id: 'fac-pune-dist',
      name: 'Aundh District Hospital, Pune',
      type: 'DISTRICT',
      level: 3,
      address: 'Sangvi Road, Aundh, Pune, Maharashtra 411027',
      latitude: 18.5793,
      longitude: 73.8115,
      availability: {
        create: {
          status: 'OPEN',
          readinessScore: 95
        }
      },
      services: {
        create: [
          { service: 'Advanced Intensive Care Unit (ICU)', isAvailable: true },
          { service: 'Cardiology & Echo Telemetry', isAvailable: true },
          { service: 'CT Scan & Advanced Radiology', isAvailable: true },
          { service: 'Blood Component Separation Center', isAvailable: true },
          { service: 'Pediatric Neonatal ICU (NICU)', isAvailable: true }
        ]
      },
      capacities: {
        create: [
          { resource: 'General Ward Beds', total: 250, occupied: 198 },
          { resource: 'ICU Beds', total: 32, occupied: 26 },
          { resource: 'NICU / PICU Beds', total: 20, occupied: 16 },
          { resource: 'Oxygen Support Beds', total: 80, occupied: 54 }
        ]
      }
    }
  });

  // Rural Feeding Clinic 1: Khandala PHC
  const facKhandalaPhc = await prisma.facility.create({
    data: {
      id: 'fac-khandala-phc',
      name: 'Khandala Primary Health Centre',
      type: 'PHC',
      level: 1,
      address: 'Shirwal-Khandala Road, Satara-Pune Border, Maharashtra 412802',
      latitude: 18.0531,
      longitude: 74.0272,
      availability: {
        create: {
          status: 'OPEN',
          readinessScore: 78
        }
      },
      services: {
        create: [
          { service: 'Outpatient Clinical Consultation', isAvailable: true },
          { service: 'Basic Pathology Testing', isAvailable: true },
          { service: 'Universal Immunization Drive', isAvailable: true },
          { service: 'Maternal Antenatal Checkup', isAvailable: true }
        ]
      },
      capacities: {
        create: [
          { resource: 'Observation Beds', total: 10, occupied: 6 },
          { resource: 'Labor Delivery Room', total: 4, occupied: 2 }
        ]
      }
    }
  });

  // Rural Feeding Clinic 2: Saswad PHC (Showing OVERCAPACITY state for realistic telemetry)
  const facSaswadPhc = await prisma.facility.create({
    data: {
      id: 'fac-saswad-phc',
      name: 'Saswad Primary Health Centre',
      type: 'PHC',
      level: 1,
      address: 'Purandar Taluka, Saswad, Maharashtra 412301',
      latitude: 18.3444,
      longitude: 74.0294,
      availability: {
        create: {
          status: 'OVERCAPACITY',
          readinessScore: 48
        }
      },
      services: {
        create: [
          { service: 'General OPD', isAvailable: true },
          { service: 'Emergency First Aid', isAvailable: true },
          { service: 'Pharmacy & Drug Distribution', isAvailable: true }
        ]
      },
      capacities: {
        create: [
          { resource: 'Observation Beds', total: 12, occupied: 12 },
          { resource: 'Oxygen Concentrators', total: 4, occupied: 4 }
        ]
      }
    }
  });

  // Specialized Trauma & Rural Hospital: Junnar CHC
  const facJunnarChc = await prisma.facility.create({
    data: {
      id: 'fac-junnar-chc',
      name: 'Junnar Rural Hospital & Trauma Centre',
      type: 'CHC',
      level: 2,
      address: 'Shivneri Road, Junnar, Pune District, Maharashtra 410502',
      latitude: 19.2087,
      longitude: 73.8763,
      availability: {
        create: {
          status: 'OPEN',
          readinessScore: 86
        }
      },
      services: {
        create: [
          { service: '24x7 Trauma & Accident Care', isAvailable: true },
          { service: 'Pediatric Care Unit', isAvailable: true },
          { service: 'Ultrasonography (USG)', isAvailable: true }
        ]
      },
      capacities: {
        create: [
          { resource: 'General Ward Beds', total: 40, occupied: 28 },
          { resource: 'Trauma Emergency Beds', total: 10, occupied: 7 }
        ]
      }
    }
  });

  // ─── 3. USERS (DOCTORS, ASHA WORKERS, PATIENTS) ───────────────────────────
  console.log('👥 Creating healthcare professionals and patient users...');

  // --- DOCTOR 1: Dr. Rajesh Deshmukh (Chief Medical Officer, Baramati CHC) ---
  const userDoc1 = await prisma.user.create({
    data: {
      phone: '+919876543210',
      email: 'rajesh.deshmukh@ayusync.org',
      password: passwordHash,
      isActive: true,
      roles: { connect: { id: doctorRole.id } },
      doctor: {
        create: {
          id: 'doc-rajesh-deshmukh',
          specialist: {
            create: {
              specialty: 'Internal Medicine'
            }
          },
          facilities: {
            create: [
              { facilityId: facBaramatiChc.id }
            ]
          }
        }
      }
    },
    include: { doctor: true }
  });

  // --- DOCTOR 2: Dr. Priya Kulkarni (OBGYN Specialist, Baramati CHC & Aundh Hospital) ---
  const userDoc2 = await prisma.user.create({
    data: {
      phone: '+919876543211',
      email: 'priya.kulkarni@ayusync.org',
      password: passwordHash,
      isActive: true,
      roles: { connect: { id: doctorRole.id } },
      doctor: {
        create: {
          id: 'doc-priya-kulkarni',
          specialist: {
            create: {
              specialty: 'Obstetrics & Gynecology'
            }
          },
          facilities: {
            create: [
              { facilityId: facBaramatiChc.id },
              { facilityId: facPuneDist.id }
            ]
          }
        }
      }
    },
    include: { doctor: true }
  });

  // --- DOCTOR 3: Dr. Anand Joshi (Pediatrician, Junnar Rural Hospital) ---
  const userDoc3 = await prisma.user.create({
    data: {
      phone: '+919876543212',
      email: 'anand.joshi@ayusync.org',
      password: passwordHash,
      isActive: true,
      roles: { connect: { id: doctorRole.id } },
      doctor: {
        create: {
          id: 'doc-anand-joshi',
          specialist: {
            create: {
              specialty: 'Pediatrics & Neonatal Care'
            }
          },
          facilities: {
            create: [
              { facilityId: facJunnarChc.id }
            ]
          }
        }
      }
    },
    include: { doctor: true }
  });

  // --- WORKER 1: Sunita Patil (Senior ASHA Worker, Khandala Sub-Center) ---
  const userWorker1 = await prisma.user.create({
    data: {
      phone: '+919998887776',
      email: 'sunita.patil@ayusync.org',
      password: passwordHash,
      isActive: true,
      roles: { connect: { id: workerRole.id } },
      worker: {
        create: {
          id: 'worker-sunita-patil',
          type: 'ASHA',
          facilityId: facKhandalaPhc.id
        }
      }
    },
    include: { worker: true }
  });

  // --- WORKER 2: Vandana Shinde (ASHA Worker, Saswad Sector) ---
  const userWorker2 = await prisma.user.create({
    data: {
      phone: '+919998887777',
      email: 'vandana.shinde@ayusync.org',
      password: passwordHash,
      isActive: true,
      roles: { connect: { id: workerRole.id } },
      worker: {
        create: {
          id: 'worker-vandana-shinde',
          type: 'ASHA',
          facilityId: facSaswadPhc.id
        }
      }
    },
    include: { worker: true }
  });

  // --- WORKER 3: Kavita More (Auxiliary Nurse Midwife, Baramati Sector) ---
  const userWorker3 = await prisma.user.create({
    data: {
      phone: '+919998887778',
      email: 'kavita.more@ayusync.org',
      password: passwordHash,
      isActive: true,
      roles: { connect: { id: workerRole.id } },
      worker: {
        create: {
          id: 'worker-kavita-more',
          type: 'ANM',
          facilityId: facBaramatiChc.id
        }
      }
    },
    include: { worker: true }
  });

  // --- PATIENT USERS (With Login Capabilities) ---
  const patientUsersData = [
    { phone: '+919111222333', name: 'Ramesh Kulkarni', age: 58, gender: 'MALE', village: 'Khandala Ward 2' },
    { phone: '+919111222334', name: 'Pooja Sharma', age: 26, gender: 'FEMALE', village: 'Baramati Rural' },
    { phone: '+919111222335', name: 'Aniket Gaikwad', age: 34, gender: 'MALE', village: 'Khandala Gaothan' },
    { phone: '+919111222336', name: 'Savita Jadhav', age: 48, gender: 'FEMALE', village: 'Saswad Ward 4' },
    { phone: '+919111222337', name: 'Rahul More', age: 19, gender: 'MALE', village: 'Baramati Town' }
  ];

  for (const pu of patientUsersData) {
    await prisma.user.create({
      data: {
        phone: pu.phone,
        password: passwordHash,
        isActive: true,
        roles: { connect: { id: patientRole.id } }
      }
    });
  }

  // ─── 4. REALISTIC PATIENT PROFILES & MEDICAL HISTORIES ────────────────────
  console.log('📋 Populating realistic patient clinical profiles & conditions...');

  const patients = [
    // 1. Ramesh Kulkarni (Elderly, Chronic Hypertension & Diabetes, follow-up patient)
    {
      id: 'pat-ramesh-kulkarni',
      name: 'Ramesh Kulkarni',
      age: 58,
      gender: 'MALE',
      phone: '9111222333',
      village: 'Khandala Ward 2, Satara Road',
      abhaId: '91-8844-3321-0001',
      conditions: [
        { name: 'Essential Hypertension', status: 'ACTIVE', diagnosedAt: d(-180) },
        { name: 'Type 2 Diabetes Mellitus', status: 'ACTIVE', diagnosedAt: d(-120) }
      ]
    },
    // 2. Pooja Sharma (Pregnant mother, Gestational Hypertension, Counter-referred)
    {
      id: 'pat-pooja-sharma',
      name: 'Pooja Sharma',
      age: 26,
      gender: 'FEMALE',
      phone: '9111222334',
      village: 'Baramati Rural, Near Vithal Mandir',
      abhaId: '91-8844-3321-0002',
      conditions: [
        { name: 'High Risk Pregnancy (2nd Trimester)', status: 'ACTIVE', diagnosedAt: d(-60) },
        { name: 'Gestational Hypertension', status: 'ACTIVE', diagnosedAt: d(-14) }
      ]
    },
    // 3. Aniket Gaikwad (Young farmer, Acute Gastroenteritis & Severe Dehydration, Referred)
    {
      id: 'pat-aniket-gaikwad',
      name: 'Aniket Gaikwad',
      age: 34,
      gender: 'MALE',
      phone: '9111222335',
      village: 'Khandala Gaothan',
      abhaId: '91-8844-3321-0003',
      conditions: [
        { name: 'Acute Gastroenteritis with Dehydration', status: 'ACTIVE', diagnosedAt: d(-1) }
      ]
    },
    // 4. Savita Jadhav (Middle-aged woman, Chronic Bronchial Asthma, Tertiary Referral)
    {
      id: 'pat-savita-jadhav',
      name: 'Savita Jadhav',
      age: 48,
      gender: 'FEMALE',
      phone: '9111222336',
      village: 'Saswad Ward 4, Purandar',
      abhaId: '91-8844-3321-0004',
      conditions: [
        { name: 'Chronic Severe Asthma', status: 'ACTIVE', diagnosedAt: d(-365) }
      ]
    },
    // 5. Rahul More (Student, Suspected Dengue / Thrombocytopenia, In Consultation Today)
    {
      id: 'pat-rahul-more',
      name: 'Rahul More',
      age: 19,
      gender: 'MALE',
      phone: '9111222337',
      village: 'Baramati Town',
      abhaId: '91-8844-3321-0005',
      conditions: [
        { name: 'Acute Febrile Illness (Suspected Dengue)', status: 'ACTIVE', diagnosedAt: d(0) }
      ]
    },
    // 6. Meena Kumari (Post-discharge check-in)
    {
      id: 'pat-meena-kumari',
      name: 'Meena Kumari',
      age: 34,
      gender: 'FEMALE',
      phone: '9000000016',
      village: 'Baramati Ward 1',
      abhaId: '91-8844-3321-0006',
      conditions: [
        { name: 'Post-Cesarean Section Recovery', status: 'ACTIVE', diagnosedAt: d(-10) }
      ]
    },
    // 7. Aarav Patel (Pediatric immunization & fever check)
    {
      id: 'pat-aarav-patel',
      name: 'Aarav Patel',
      age: 2,
      gender: 'MALE',
      phone: '9000000017',
      village: 'Khandala East',
      abhaId: '91-8844-3321-0007',
      conditions: [
        { name: 'Pediatric Upper Respiratory Tract Infection', status: 'ACTIVE', diagnosedAt: d(-3) }
      ]
    },
    // 8. Babanrao Shinde (Elderly farmer, Osteoarthritis and Cataract)
    {
      id: 'pat-babanrao-shinde',
      name: 'Babanrao Shinde',
      age: 71,
      gender: 'MALE',
      phone: '9000000018',
      village: 'Saswad Rural',
      abhaId: '91-8844-3321-0008',
      conditions: [
        { name: 'Bilateral Knee Osteoarthritis', status: 'ACTIVE', diagnosedAt: d(-400) }
      ]
    },
    // 9. Sunita Chavan (Severe Nutritional Anemia, ASHA tracking)
    {
      id: 'pat-sunita-chavan',
      name: 'Sunita Chavan',
      age: 29,
      gender: 'FEMALE',
      phone: '9000000019',
      village: 'Khandala Ward 3',
      abhaId: '91-8844-3321-0009',
      conditions: [
        { name: 'Severe Iron Deficiency Anemia (Hb 7.4 g/dL)', status: 'ACTIVE', diagnosedAt: d(-45) }
      ]
    },
    // 10. Dipak Thorat (Acute allergic dermatitis)
    {
      id: 'pat-dipak-thorat',
      name: 'Dipak Thorat',
      age: 41,
      gender: 'MALE',
      phone: '9000000020',
      village: 'Baramati MIDC',
      abhaId: '91-8844-3321-0010',
      conditions: [
        { name: 'Contact Dermatitis', status: 'RESOLVED', diagnosedAt: d(-25) }
      ]
    },
    // 11. Lata Jagtap (Antenatal Care - 1st Trimester)
    {
      id: 'pat-lata-jagtap',
      name: 'Lata Jagtap',
      age: 23,
      gender: 'FEMALE',
      phone: '9000000021',
      village: 'Junnar Rural',
      abhaId: '91-8844-3321-0011',
      conditions: [
        { name: 'Normal Primigravida (10 Weeks)', status: 'ACTIVE', diagnosedAt: d(-20) }
      ]
    },
    // 12. Vilas Bhosale (Chest pain, Ischemic Heart Disease evaluation)
    {
      id: 'pat-vilas-bhosale',
      name: 'Vilas Bhosale',
      age: 63,
      gender: 'MALE',
      phone: '9000000022',
      village: 'Saswad Town',
      abhaId: '91-8844-3321-0012',
      conditions: [
        { name: 'Suspected Angina Pectoris / CAD', status: 'ACTIVE', diagnosedAt: d(-2) }
      ]
    }
  ];

  for (const p of patients) {
    const createdPatient = await prisma.patient.create({
      data: {
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        village: p.village,
        createdAt: d(-30),
        identifiers: {
          create: {
            type: 'ABHA',
            value: p.abhaId
          }
        },
        conditions: {
          create: p.conditions
        }
      }
    });
  }

  // ─── 5. ENCOUNTERS, ASSESSMENTS, VITALS, SYMPTOMS & AI TRIAGE ─────────────
  console.log('🩺 Creating realistic encounters, assessments, vitals & XAI predictions...');

  // Encounter 1: Ramesh Kulkarni - Field visit by Sunita Patil (5 days ago)
  const encRamesh1 = await prisma.encounter.create({
    data: {
      id: 'enc-ramesh-1',
      patientId: 'pat-ramesh-kulkarni',
      facilityId: facKhandalaPhc.id,
      type: 'FIELD_VISIT',
      status: 'COMPLETED',
      start: d(-5, 9),
      end: d(-5, 10),
      vitals: {
        create: [
          { type: 'BP', value: '148/94', unit: 'mmHg', measuredAt: d(-5, 9) },
          { type: 'HR', value: '78', unit: 'bpm', measuredAt: d(-5, 9) },
          { type: 'BLOOD_GLUCOSE', value: '186', unit: 'mg/dL', measuredAt: d(-5, 9) }
        ]
      },
      assessments: {
        create: {
          id: 'ass-ramesh-1',
          patientId: 'pat-ramesh-kulkarni',
          provenance: 'WORKER_RECORDED',
          createdAt: d(-5, 9),
          symptoms: {
            create: [
              { name: 'Mild morning headache', duration: '3 days', severity: 'MILD' },
              { name: 'Occasional fatigue on exertion', duration: '1 week', severity: 'MODERATE' }
            ]
          },
          aiRecommendations: {
            create: {
              urgencyCategory: 'PRIORITY',
              confidence: 0.86,
              reasons: [
                'Systolic BP > 140 mmHg in known diabetic patient',
                'Random blood glucose above target glycemic threshold (186 mg/dL)',
                'Persistent morning cephalea indicates sub-optimal blood pressure control'
              ],
              humanConfirmed: true
            }
          }
        }
      }
    }
  });

  // Encounter 2: Ramesh Kulkarni - Clinic consultation with Dr. Rajesh Deshmukh (4 days ago)
  const encRamesh2 = await prisma.encounter.create({
    data: {
      id: 'enc-ramesh-2',
      patientId: 'pat-ramesh-kulkarni',
      facilityId: facBaramatiChc.id,
      type: 'CLINIC_VISIT',
      status: 'COMPLETED',
      start: d(-4, 11),
      end: d(-4, 12),
      vitals: {
        create: [
          { type: 'BP', value: '136/86', unit: 'mmHg', measuredAt: d(-4, 11) },
          { type: 'HR', value: '74', unit: 'bpm', measuredAt: d(-4, 11) }
        ]
      },
      clinicalObs: {
        create: {
          note: 'BP stabilizing on Amlodipine 5mg. Added Metformin 500mg BD. Counseled on dietary salt reduction and daily 30-min walking. Requested ASHA worker Sunita to conduct weekly BP monitoring.',
          provenance: 'DOCTOR_RECORDED',
          createdAt: d(-4, 11)
        }
      },
      prescriptions: {
        create: [
          { medication: 'Tab. Amlodipine 5mg', dosage: '1 tablet once daily in morning', duration: '30 days', instructions: 'After breakfast' },
          { medication: 'Tab. Metformin 500mg', dosage: '1 tablet twice daily', duration: '30 days', instructions: 'After meals' }
        ]
      }
    }
  });

  // Encounter 3: Pooja Sharma - High-risk maternal check (Yesterday)
  const encPooja = await prisma.encounter.create({
    data: {
      id: 'enc-pooja-1',
      patientId: 'pat-pooja-sharma',
      facilityId: facBaramatiChc.id,
      type: 'CLINIC_VISIT',
      status: 'COMPLETED',
      start: d(-1, 14),
      end: d(-1, 15),
      vitals: {
        create: [
          { type: 'BP', value: '154/98', unit: 'mmHg', measuredAt: d(-1, 14) },
          { type: 'HR', value: '88', unit: 'bpm', measuredAt: d(-1, 14) },
          { type: 'SPO2', value: '98', unit: '%', measuredAt: d(-1, 14) }
        ]
      },
      assessments: {
        create: {
          id: 'ass-pooja-1',
          patientId: 'pat-pooja-sharma',
          provenance: 'DOCTOR_RECORDED',
          createdAt: d(-1, 14),
          symptoms: {
            create: [
              { name: 'Pedal edema bilateral', duration: '4 days', severity: 'MODERATE' },
              { name: 'Occasional blurred vision', duration: '1 day', severity: 'SEVERE' }
            ]
          },
          aiRecommendations: {
            create: {
              urgencyCategory: 'URGENT',
              confidence: 0.94,
              reasons: [
                'BP > 150/95 mmHg in second trimester of pregnancy',
                'Visual disturbances present (danger sign for pre-eclampsia)',
                'Immediate counter-referral with Labetalol initiation and close community supervision required'
              ],
              humanConfirmed: true
            }
          }
        }
      },
      clinicalObs: {
        create: {
          note: 'Started on Tab. Labetalol 100mg BD. Urine albumin tested 1+. Counter-referred to ASHA worker Sunita Patil for alternate-day BP monitoring.',
          provenance: 'DOCTOR_RECORDED',
          createdAt: d(-1, 14)
        }
      },
      prescriptions: {
        create: [
          { medication: 'Tab. Labetalol 100mg', dosage: '1 tablet twice daily', duration: '14 days', instructions: 'Strict BP tracking' },
          { medication: 'Iron & Folic Acid (IFA)', dosage: '1 tablet daily', duration: '60 days', instructions: 'With lemon water' },
          { medication: 'Calcium 500mg', dosage: '1 tablet daily', duration: '60 days', instructions: 'After dinner' }
        ]
      }
    }
  });

  // Encounter 4: Aniket Gaikwad - Acute Gastroenteritis at Khandala PHC (Today)
  const encAniket = await prisma.encounter.create({
    data: {
      id: 'enc-aniket-1',
      patientId: 'pat-aniket-gaikwad',
      facilityId: facKhandalaPhc.id,
      type: 'FIELD_VISIT',
      status: 'IN_PROGRESS',
      start: d(0, -2),
      vitals: {
        create: [
          { type: 'BP', value: '96/64', unit: 'mmHg', measuredAt: d(0, -2) },
          { type: 'HR', value: '112', unit: 'bpm', measuredAt: d(0, -2) },
          { type: 'TEMP', value: '101.4', unit: '°F', measuredAt: d(0, -2) }
        ]
      },
      assessments: {
        create: {
          id: 'ass-aniket-1',
          patientId: 'pat-aniket-gaikwad',
          provenance: 'WORKER_RECORDED',
          createdAt: d(0, -2),
          symptoms: {
            create: [
              { name: 'Watery Diarrhea', duration: '1 day', severity: 'SEVERE' },
              { name: 'Persistent Vomiting', duration: '18 hours', severity: 'SEVERE' },
              { name: 'Postural Dizziness', duration: '6 hours', severity: 'MODERATE' }
            ]
          },
          aiRecommendations: {
            create: {
              urgencyCategory: 'URGENT',
              confidence: 0.91,
              reasons: [
                'Hypotension (BP 96/64) with tachycardia (HR 112 bpm)',
                'Clinical dehydration secondary to acute gastrointestinal losses',
                'Requires immediate IV Ringer Lactate and facility-based stabilization'
              ]
            }
          }
        }
      }
    }
  });

  // Encounter 5: Rahul More - Today's Clinic Triage (Suspected Dengue)
  const encRahul = await prisma.encounter.create({
    data: {
      id: 'enc-rahul-1',
      patientId: 'pat-rahul-more',
      facilityId: facBaramatiChc.id,
      type: 'CLINIC_VISIT',
      status: 'IN_PROGRESS',
      start: d(0, -1),
      vitals: {
        create: [
          { type: 'TEMP', value: '102.8', unit: '°F', measuredAt: d(0, -1) },
          { type: 'HR', value: '104', unit: 'bpm', measuredAt: d(0, -1) },
          { type: 'BP', value: '114/76', unit: 'mmHg', measuredAt: d(0, -1) },
          { type: 'SPO2', value: '97', unit: '%', measuredAt: d(0, -1) }
        ]
      },
      assessments: {
        create: {
          id: 'ass-rahul-1',
          patientId: 'pat-rahul-more',
          provenance: 'WORKER_RECORDED',
          createdAt: d(0, -1),
          symptoms: {
            create: [
              { name: 'High Grade Fever with chills', duration: '3 days', severity: 'SEVERE' },
              { name: 'Retro-orbital eye pain & severe myalgia', duration: '2 days', severity: 'SEVERE' },
              { name: 'Petechial rash on forearms', duration: '12 hours', severity: 'MODERATE' }
            ]
          },
          aiRecommendations: {
            create: {
              urgencyCategory: 'PRIORITY',
              confidence: 0.89,
              reasons: [
                'High fever > 102.5°F with classic dengue triad (headache, eye pain, rash)',
                'Urgent CBC required to monitor platelet count drop',
                'Hydration therapy indicated'
              ]
            }
          }
        }
      }
    }
  });

  // ─── 6. REFERRALS & CLOSED-LOOP COUNTER-REFERRALS ─────────────────────────
  console.log('🔄 Creating closed-loop referrals and counter-referrals...');

  // Referral 1: Pooja Sharma (COUNTER_REFERRED with Doctor instructions back to ASHA)
  const refPooja = await prisma.referral.create({
    data: {
      id: 'ref-pooja-sharma',
      patientId: 'pat-pooja-sharma',
      originId: facKhandalaPhc.id,
      destinationId: facBaramatiChc.id,
      reason: '2nd trimester gestational hypertension, BP 154/98, danger signs of preeclampsia',
      urgency: 'URGENT',
      status: 'COUNTER_REFERRED',
      events: {
        create: [
          { statusFrom: null, statusTo: 'CREATED', notes: 'ASHA worker identified high BP during home visit', createdAt: d(-3) },
          { statusFrom: 'CREATED', statusTo: 'SUBMITTED', notes: 'Dispatched electronically to Baramati CHC', createdAt: d(-3, 2) },
          { statusFrom: 'SUBMITTED', statusTo: 'ACCEPTED', notes: 'Dr. Priya Kulkarni accepted case', createdAt: d(-2) },
          { statusFrom: 'ACCEPTED', statusTo: 'PATIENT_ARRIVED', notes: 'Patient escorted by 108 ambulance', createdAt: d(-1, 13) },
          { statusFrom: 'PATIENT_ARRIVED', statusTo: 'IN_CONSULTATION', notes: 'Evaluation & USG completed', createdAt: d(-1, 14) },
          { statusFrom: 'IN_CONSULTATION', statusTo: 'COUNTER_REFERRED', notes: 'Doctor generated task instructions for ASHA worker Sunita', createdAt: d(-1, 16) }
        ]
      },
      counterReferral: {
        create: {
          outcome: 'Stabilized on oral antihypertensives (Labetalol 100mg BD)',
          treatment: 'Tab Labetalol 100mg BD, IFA 1 OD, Calcium 500mg OD',
          instructions: 'Visit patient every Tuesday and Friday. Check BP and record in AyuSync app. If systolic > 140 or diastolic > 90, call 108 immediately.',
          requiresFollowUp: true
        }
      }
    }
  });

  // Referral 2: Aniket Gaikwad (SUBMITTED today from Khandala PHC to Baramati CHC)
  const refAniket = await prisma.referral.create({
    data: {
      id: 'ref-aniket-gaikwad',
      patientId: 'pat-aniket-gaikwad',
      originId: facKhandalaPhc.id,
      destinationId: facBaramatiChc.id,
      reason: 'Acute severe gastroenteritis with dehydration, BP 96/64, needs immediate IV hydration',
      urgency: 'URGENT',
      status: 'SUBMITTED',
      events: {
        create: [
          { statusFrom: null, statusTo: 'CREATED', notes: 'Triage assessment flagged acute dehydration', createdAt: d(0, -2) },
          { statusFrom: 'CREATED', statusTo: 'SUBMITTED', notes: 'Alert routed to emergency medical officer at Baramati CHC', createdAt: d(0, -1) }
        ]
      }
    }
  });

  // Referral 3: Savita Jadhav (ACCEPTED for tertiary evaluation at Aundh District Hospital)
  const refSavita = await prisma.referral.create({
    data: {
      id: 'ref-savita-jadhav',
      patientId: 'pat-savita-jadhav',
      originId: facSaswadPhc.id,
      destinationId: facPuneDist.id,
      reason: 'Refractory bronchial asthma unresponsive to salbutamol nebulization; requires pulmonology evaluation',
      urgency: 'PRIORITY',
      status: 'ACCEPTED',
      events: {
        create: [
          { statusFrom: null, statusTo: 'CREATED', notes: 'Saswad PHC initiated referral', createdAt: d(-2) },
          { statusFrom: 'CREATED', statusTo: 'SUBMITTED', notes: 'Forwarded to District Hospital triage desk', createdAt: d(-2, 3) },
          { statusFrom: 'SUBMITTED', statusTo: 'ACCEPTED', notes: 'Aundh District Hospital accepted appointment slot for Thursday', createdAt: d(-1) }
        ]
      }
    }
  });

  // Referral 4: Vilas Bhosale (CREATED - Suspected Angina)
  const refVilas = await prisma.referral.create({
    data: {
      id: 'ref-vilas-bhosale',
      patientId: 'pat-vilas-bhosale',
      originId: facSaswadPhc.id,
      destinationId: facBaramatiChc.id,
      reason: 'Exertional retrosternal heaviness radiating to left shoulder. Needs 12-lead ECG & cardiac enzymes.',
      urgency: 'URGENT',
      status: 'CREATED',
      events: {
        create: [
          { statusFrom: null, statusTo: 'CREATED', notes: 'Case recorded by ANM Kavita More', createdAt: d(0, -3) }
        ]
      }
    }
  });

  // ─── 7. APPOINTMENTS & LIVE CONSULTATION QUEUE ────────────────────────────
  console.log('⏳ Setting up appointments and live doctor queue entries...');

  // Appointment 1: Rahul More - Waiting now in Dr. Rajesh Deshmukh\'s queue (High Priority)
  const apptRahul = await prisma.appointment.create({
    data: {
      id: 'appt-rahul-more',
      patientId: 'pat-rahul-more',
      facilityId: facBaramatiChc.id,
      doctorId: userDoc1.doctor!.id,
      scheduledAt: d(0, 0),
      status: 'BOOKED',
      queueEntry: {
        create: {
          id: 'queue-entry-rahul',
          doctorId: userDoc1.doctor!.id,
          priority: 2, // High priority
          status: 'WAITING',
          arrivalTime: d(0, -1)
        }
      }
    }
  });

  // Appointment 2: Aniket Gaikwad - In Consultation now
  const apptAniket = await prisma.appointment.create({
    data: {
      id: 'appt-aniket-gaikwad',
      patientId: 'pat-aniket-gaikwad',
      facilityId: facBaramatiChc.id,
      doctorId: userDoc1.doctor!.id,
      scheduledAt: d(0, -1),
      status: 'BOOKED',
      queueEntry: {
        create: {
          id: 'queue-entry-aniket',
          doctorId: userDoc1.doctor!.id,
          priority: 1,
          status: 'IN_CONSULTATION',
          arrivalTime: d(0, -2)
        }
      }
    }
  });

  // Appointment 3: Dipak Thorat - Routine OPD waiting
  const apptDipak = await prisma.appointment.create({
    data: {
      id: 'appt-dipak-thorat',
      patientId: 'pat-dipak-thorat',
      facilityId: facBaramatiChc.id,
      doctorId: userDoc1.doctor!.id,
      scheduledAt: d(0, 1),
      status: 'BOOKED',
      queueEntry: {
        create: {
          id: 'queue-entry-dipak',
          doctorId: userDoc1.doctor!.id,
          priority: 0,
          status: 'WAITING',
          arrivalTime: d(0, 0)
        }
      }
    }
  });

  // Appointment 4: Babanrao Shinde - Routine checkup waiting
  const apptBabanrao = await prisma.appointment.create({
    data: {
      id: 'appt-babanrao-shinde',
      patientId: 'pat-babanrao-shinde',
      facilityId: facBaramatiChc.id,
      doctorId: userDoc1.doctor!.id,
      scheduledAt: d(0, 2),
      status: 'BOOKED',
      queueEntry: {
        create: {
          id: 'queue-entry-babanrao',
          doctorId: userDoc1.doctor!.id,
          priority: 0,
          status: 'WAITING',
          arrivalTime: d(0, 0)
        }
      }
    }
  });

  // Appointment 5: Ramesh Kulkarni - Completed consultation earlier today
  const apptRamesh = await prisma.appointment.create({
    data: {
      id: 'appt-ramesh-kulkarni',
      patientId: 'pat-ramesh-kulkarni',
      facilityId: facBaramatiChc.id,
      doctorId: userDoc1.doctor!.id,
      scheduledAt: d(0, -3),
      status: 'COMPLETED',
      queueEntry: {
        create: {
          id: 'queue-entry-ramesh',
          doctorId: userDoc1.doctor!.id,
          priority: 0,
          status: 'COMPLETED',
          arrivalTime: d(0, -4)
        }
      }
    }
  });

  // ─── 8. FOLLOW-UPS & ASHA WORKER CARE GAPS ────────────────────────────────
  console.log('📌 Creating ASHA worker follow-ups and care gap tasks...');

  const followUps = [
    // Overdue task: High risk pregnancy BP check
    {
      workerId: userWorker1.worker!.id,
      patientId: 'pat-pooja-sharma',
      dueDate: d(-1),
      reason: 'Post-consultation BP monitoring for Gestational Hypertension (Instructions from Dr. Priya Kulkarni)',
      status: 'OVERDUE'
    },
    // Due Today: Diabetes medication adherence
    {
      workerId: userWorker1.worker!.id,
      patientId: 'pat-ramesh-kulkarni',
      dueDate: d(0),
      reason: 'Confirm Metformin 500mg BD compliance & check fasting sugar',
      status: 'PENDING'
    },
    // Due Today: Severe Anemia IFA distribution
    {
      workerId: userWorker1.worker!.id,
      patientId: 'pat-sunita-chavan',
      dueDate: d(0),
      reason: 'Distribute monthly Iron Folic Acid supply and check conjunctival pallor',
      status: 'PENDING'
    },
    // Due Tomorrow: Infant vaccination check
    {
      workerId: userWorker1.worker!.id,
      patientId: 'pat-aarav-patel',
      dueDate: d(1),
      reason: 'Pentavalent 3 and OPV booster vaccination camp at Khandala Sub-center',
      status: 'PENDING'
    },
    // Completed task
    {
      workerId: userWorker1.worker!.id,
      patientId: 'pat-meena-kumari',
      dueDate: d(-2),
      reason: 'Post-discharge suture line inspection & maternal well-being check',
      status: 'COMPLETED'
    }
  ];

  for (const fu of followUps) {
    try {
      await prisma.followUp.create({ data: fu });
    } catch (e: any) {
      console.warn(`⚠️ Warning creating followUp (${fu.reason}):`, e?.message || e);
    }
  }

  // ASHA Care Gap Tasks
  const tasks = [
    {
      workerId: userWorker1.worker!.id,
      type: 'CARE_GAP',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: d(0)
    },
    {
      workerId: userWorker1.worker!.id,
      type: 'CARE_GAP',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: d(1)
    },
    {
      workerId: userWorker1.worker!.id,
      type: 'GENERAL',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: d(-1)
    }
  ];

  for (const t of tasks) {
    try {
      await prisma.task.create({ data: t });
    } catch (e: any) {
      console.warn(`⚠️ Warning creating task (${t.type}):`, e?.message || e);
    }
  }

  // ─── 9. REAL-TIME SYSTEM NOTIFICATIONS ────────────────────────────────────
  console.log('🔔 Creating notifications for doctor & worker accounts...');

  const notifications = [
    {
      userId: userDoc1.id,
      type: 'URGENT_REFERRAL',
      message: 'New Urgent Referral received from Khandala PHC for Aniket Gaikwad (Severe Dehydration, BP 96/64)',
      isRead: false,
      createdAt: d(0, -1)
    },
    {
      userId: userDoc1.id,
      type: 'TRIAGE_ALERT',
      message: 'AI Triage flagged Rahul More with high probability Dengue & Thrombocytopenia risk',
      isRead: false,
      createdAt: d(0, -2)
    },
    {
      userId: userWorker1.id,
      type: 'COUNTER_REFERRAL_RECEIVED',
      message: 'Dr. Priya Kulkarni sent counter-referral care instructions for Pooja Sharma (BP tracking required)',
      isRead: false,
      createdAt: d(-1, 16)
    },
    {
      userId: userWorker1.id,
      type: 'OVERDUE_FOLLOWUP',
      message: 'Reminder: 1 high-risk maternal follow-up task is overdue for Pooja Sharma',
      isRead: false,
      createdAt: d(0, -4)
    }
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  console.log('\n============================================================');
  console.log('✨ SEEDING COMPLETE! Real, interconnected data is live:');
  console.log('------------------------------------------------------------');
  console.log('🏥 Facilities: 5 (Baramati CHC, Pune Dist Hosp, Khandala PHC, Saswad PHC, Junnar CHC)');
  console.log('👥 Total Patients: 12 detailed realistic Maharashtra profiles');
  console.log('🩺 Encounters & Assessments: 5 complete clinical histories with Vitals & Symptoms');
  console.log('🔄 Referrals: 4 (SUBMITTED, ACCEPTED, COUNTER_REFERRED, CREATED)');
  console.log('⏳ Appointments & Live Queue: 5 (WAITING, IN_CONSULTATION, COMPLETED)');
  console.log('📌 ASHA Follow-Ups: 5 (OVERDUE, PENDING, COMPLETED)');
  console.log('🔔 Notifications: 4 real-time alerts');
  console.log('------------------------------------------------------------');
  console.log('🔑 DEMO LOGIN CREDENTIALS:');
  console.log('   👨‍⚕️ Doctor (CMO):              +919876543210  /  password123  (Dr. Rajesh Deshmukh)');
  console.log('   👩‍⚕️ Specialist (OBGYN):        +919876543211  /  password123  (Dr. Priya Kulkarni)');
  console.log('   👨‍⚕️ Pediatrician:             +919876543212  /  password123  (Dr. Anand Joshi)');
  console.log('   👩‍💼 Health Worker (ASHA):      +919998887776  /  password123  (Sunita Patil)');
  console.log('   👩‍💼 ASHA Worker:              +919998887777  /  password123  (Vandana Shinde)');
  console.log('   👩‍⚕️ ANM Worker:               +919998887778  /  password123  (Kavita More)');
  console.log('   🧑 Patient (Chronic Care):     +919111222333  /  password123  (Ramesh Kulkarni)');
  console.log('   👩 Patient (Maternal):         +919111222334  /  password123  (Pooja Sharma)');
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
