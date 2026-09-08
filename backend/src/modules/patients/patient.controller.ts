import { Request, Response } from 'express';
import { prisma } from '../../index';
import { sanitizeString, validateAge, validatePhone, validateEnum } from '../../utils/validators';

// 10. PATIENT RECORD: creation, search, profile, history, timeline
// 11. ENCOUNTERS: Create explicit encounters

export const createPatient = async (req: Request, res: Response) => {
  try {
    const { name, dob, age, gender, village, phone, abhaId } = req.body;
    
    // Validate & Sanitize Patient Name (strip tags, require 2-100 characters)
    const rawName = String(name || '').replace(/<[^>]*>?/gm, '').trim();
    const nameCheck = sanitizeString(rawName, 2, 100);
    if (!nameCheck.valid) {
      return res.status(400).json({ error: 'Bad Request', message: `Patient name: ${nameCheck.error}` });
    }

    // Validate Gender
    const genderCheck = validateEnum(gender ? String(gender).toUpperCase().trim() : '', ['MALE', 'FEMALE', 'OTHER'] as const, 'Gender');
    if (!genderCheck.valid) {
      return res.status(400).json({ error: 'Bad Request', message: genderCheck.error });
    }

    // Validate Age
    const ageCheck = validateAge(age);
    if (!ageCheck.valid) {
      return res.status(400).json({ error: 'Bad Request', message: ageCheck.error });
    }

    // Validate Phone (optional)
    let validatedPhone: string | undefined = undefined;
    if (phone && String(phone).trim()) {
      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.valid) {
        return res.status(400).json({ error: 'Bad Request', message: phoneCheck.error });
      }
      validatedPhone = phoneCheck.normalized;
    }

    // Map village or address
    const rawVillage = String(village || req.body.address || '').replace(/<[^>]*>?/gm, '').trim();
    const cleanVillage = rawVillage ? rawVillage.slice(0, 150) : null;

    // Validate ABHA ID format & duplicates (optional)
    let cleanAbha: string | undefined = undefined;
    if (abhaId && String(abhaId).trim()) {
      const sanitizedAbha = String(abhaId).replace(/[^a-zA-Z0-9-]/g, '').trim();
      const abhaCheck = sanitizeString(sanitizedAbha, 3, 30);
      if (!abhaCheck.valid) {
        return res.status(400).json({ error: 'Bad Request', message: `ABHA ID: ${abhaCheck.error}` });
      }
      cleanAbha = abhaCheck.value;

      // Prevent duplicate patients with same ABHA ID
      const existing = await prisma.patientIdentifier.findUnique({
        where: { value: cleanAbha }
      });
      if (existing) {
        return res.status(409).json({ error: 'Conflict', message: 'Patient with this ABHA ID already exists', candidate: existing.patientId });
      }
    }

    const patient = await prisma.patient.create({
      data: {
        name: nameCheck.value,
        dob: dob ? new Date(dob) : null,
        age: ageCheck.age,
        gender: genderCheck.value!,
        village: cleanVillage,
        phone: validatedPhone,
        identifiers: cleanAbha ? {
          create: {
            type: 'ABHA',
            value: cleanAbha
          }
        } : undefined
      }
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const searchPatients = async (req: Request, res: Response) => {
  try {
    const qStr = String(req.query.q || req.query.query || '').trim();
    const whereCondition = qStr ? {
      OR: [
        { name: { contains: qStr, mode: 'insensitive' as const } },
        { phone: { contains: qStr } },
        { identifiers: { some: { value: qStr } } }
      ]
    } : {};

    const patients = await prisma.patient.findMany({
      where: whereCondition,
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPatientTimeline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Fetch longitudinal record
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        encounters: {
          include: {
            assessments: { include: { symptoms: true, aiRecommendations: true } },
            vitals: true,
            prescriptions: true,
            clinicalObs: true
          },
          orderBy: { start: 'desc' }
        },
        referrals: {
          include: { origin: true, destination: true }
        },
        conditions: { orderBy: { diagnosedAt: 'desc' } },
        followUps: {
          include: { worker: { include: { user: true } } },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createEncounter = async (req: Request, res: Response) => {
  try {
    const { patientId, facilityId, type } = req.body;
    
    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'patientId is required' });
    }

    const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      return res.status(404).json({ error: 'Not Found', message: 'Patient does not exist' });
    }

    const typeCheck = validateEnum(type, ['FIELD_VISIT', 'CLINIC_VISIT', 'EMERGENCY', 'HOME_VISIT'] as const, 'Encounter type');
    const validEncounterType = typeCheck.valid ? typeCheck.value! : 'FIELD_VISIT';

    const encounter = await prisma.encounter.create({
      data: {
        patientId,
        facilityId: facilityId || null,
        type: validEncounterType,
        status: 'IN_PROGRESS'
      }
    });
    
    res.status(201).json(encounter);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addCondition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, diagnosedAt } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Condition name is required' });
    }

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const condition = await prisma.condition.create({
      data: {
        patientId: id,
        name: name.trim(),
        status: status === 'RESOLVED' ? 'RESOLVED' : 'ACTIVE',
        diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : new Date()
      }
    });

    res.status(201).json(condition);
  } catch (error) {
    console.error('Error adding condition:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

