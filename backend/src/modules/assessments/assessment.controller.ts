import { Request, Response } from 'express';
import { prisma } from '../../index';
import { analyzeAssessment } from '../ai/ai.service';
import { validateVitals } from '../../utils/validators';

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const { patientId, encounterId, symptoms, vitals, provenance } = req.body;

    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'patientId is required' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ error: 'Not Found', message: 'Patient not found' });
    }

    // Validate symptoms array
    const rawSymptoms = Array.isArray(symptoms) ? symptoms : [];
    const validSymptoms = rawSymptoms.map((s: any) => ({
      name: String(s?.name || (typeof s === 'string' ? s : '')).trim(),
      duration: s?.duration ? String(s.duration).trim() : '1 day',
      severity: s?.severity ? String(s.severity).toUpperCase().trim() : 'MODERATE'
    })).filter((s: any) => s.name.length > 0);

    if (validSymptoms.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'At least one symptom must be provided' });
    }

    // Validate vitals if provided
    let safeVitals: { type: string; value: number; unit: string }[] = [];
    if (vitals && Array.isArray(vitals) && vitals.length > 0) {
      const vitalsCheck = validateVitals(vitals);
      if (!vitalsCheck.valid) {
        return res.status(400).json({ error: 'Bad Request', message: vitalsCheck.errors[0], errors: vitalsCheck.errors });
      }
      safeVitals = vitalsCheck.vitals;
    }

    // Ensure encounter exists or auto-create a field visit encounter
    let targetEncounterId = encounterId;
    if (!targetEncounterId) {
      const activeEncounter = await prisma.encounter.findFirst({
        where: { patientId, status: 'IN_PROGRESS' },
        orderBy: { start: 'desc' }
      });
      if (activeEncounter) {
        targetEncounterId = activeEncounter.id;
      } else {
        const createdEnc = await prisma.encounter.create({
          data: {
            patientId,
            type: 'FIELD_VISIT',
            status: 'IN_PROGRESS'
          }
        });
        targetEncounterId = createdEnc.id;
      }
    }

    // 12. ASSESSMENT: Capture symptoms, duration, severity, vitals, history. Store provenance.
    const assessment = await prisma.assessment.create({
      data: {
        patientId,
        encounterId: targetEncounterId,
        provenance: provenance || 'WORKER_RECORDED',
        symptoms: {
          create: validSymptoms
        }
      },
      include: { symptoms: true }
    });

    // 13. VITALS: structured vitals
    if (safeVitals.length > 0 && targetEncounterId) {
      await prisma.vital.createMany({
        data: safeVitals.map(v => ({
          encounterId: targetEncounterId,
          type: v.type,
          value: String(v.value),
          unit: v.unit
        }))
      });
    }

    // Trigger Triage Fallback/AI Generation asynchronously (or await it)
    if (assessment.id) {
      await analyzeAssessment(assessment.id, 'doc-1', req.correlationId);
    }

    // Refetch the assessment to include the AI Recommendations before returning
    const finalAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: { symptoms: true, aiRecommendations: true }
    });

    res.status(201).json(finalAssessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAssessmentsByPatient = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || (req.query.patientId as string);
    const where = patientId ? { patientId } : {};

    const assessments = await prisma.assessment.findMany({
      where,
      include: { 
        symptoms: true,
        aiRecommendations: true,
        encounter: {
          include: { vitals: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Format vitals map on each assessment for clean frontend consumption
    const formatted = assessments.map(a => {
      const vitalList = a.encounter?.vitals || [];
      const vitalsMap: Record<string, any> = {};
      for (const v of vitalList) {
        if (v.type === 'BP') vitalsMap.bloodPressure = v.value;
        if (v.type === 'HR') vitalsMap.heartRate = parseInt(v.value, 10);
        if (v.type === 'TEMP') vitalsMap.temperature = parseFloat(v.value);
        if (v.type === 'SPO2') vitalsMap.spo2 = parseFloat(v.value);
        if (v.type === 'RR') vitalsMap.respiratoryRate = parseInt(v.value, 10);
      }
      return {
        ...a,
        vitals: Object.keys(vitalsMap).length > 0 ? vitalsMap : null
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

