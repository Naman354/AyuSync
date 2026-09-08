import axios from 'axios';
import { prisma } from '../../index';
import { broadcastTriageUpdate } from '../../events/socket';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// 40. EXPLAINABLE AI INTEGRATION (Phase 13 & 14)
export const analyzeAssessment = async (assessmentId: string, doctorId: string, correlationId?: string) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { symptoms: true, encounter: { include: { vitals: true } } }
    });

    if (!assessment) return;

    let urgencyCategory = 'ROUTINE';
    let reasons = ['Could not reach the AI service right now. Feel free to check later.'];
    let confidence = 0.5;

    try {
      // Send to Python FastAPI AI service with strict 5s timeout & correlation header
      const headers: Record<string, string> = {};
      if (correlationId) {
        headers['x-correlation-id'] = correlationId;
      }

      const response = await axios.post(
        `${AI_SERVICE_URL}/triage`,
        {
          patientId: assessment.patientId,
          symptoms: assessment.symptoms,
          vitals: assessment.encounter?.vitals || []
        },
        { timeout: 5000, headers }
      );

      urgencyCategory = response.data.urgencyCategory;
      reasons = response.data.reasons;
      confidence = response.data.confidence;
    } catch (err: any) {
      console.warn(`[AI Service] Triage request failed (${err.message}). Using deterministic fallback.`);
    }

    // 41. EXPLAINABLE TRIAGE DB RECORD
    const aiRecommendation = await prisma.aIRecommendation.create({
      data: {
        assessmentId,
        urgencyCategory,
        reasons,
        confidence
      }
    });

    // 42. REALTIME NOTIFICATION
    broadcastTriageUpdate(doctorId, {
      assessmentId,
      triage: aiRecommendation
    });

    return aiRecommendation;
  } catch (error) {
    console.error('AI Analysis failed:', error);
  }
};
