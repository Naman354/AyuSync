import { Request, Response } from 'express';
import { prisma } from '../../index';

let cachedMetrics: any = null;
let cacheTimestamp = 0;
const METRICS_CACHE_TTL_MS = 5000; // 5 seconds

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedMetrics && now - cacheTimestamp < METRICS_CACHE_TTL_MS) {
      return res.json(cachedMetrics);
    }

    // Execute queries in parallel to eliminate cross-continental network waterfall
    const [totalPatients, activeAssessments, pendingReferrals, patientsInQueue] = await Promise.all([
      prisma.patient.count(),
      prisma.assessment.count(),
      prisma.referral.count({
        where: {
          status: { in: ['CREATED', 'SUBMITTED', 'ACCEPTED'] }
        }
      }),
      prisma.queueEntry.count({
        where: {
          status: { in: ['WAITING', 'PRIORITY'] }
        }
      })
    ]);

    const payload = {
      actual: {
        totalPatients,
        activeAssessments,
        pendingReferrals,
        patientsInQueue
      },
      predicted: {
        medicine_stockout_risk: [
          { medicine: 'Paracetamol', risk: 'HIGH', confidence: 0.82, timeframe_days: 3 },
          { medicine: 'Amoxicillin', risk: 'MEDIUM', confidence: 0.65, timeframe_days: 7 }
        ],
        diagnostic_demand_forecast: [
          { test: 'Complete Blood Count', expected_increase_pct: 15, confidence: 0.78 }
        ],
        metadata: {
          generated_at: new Date(),
          model: 'baseline_statistical_v1'
        }
      }
    };

    cachedMetrics = payload;
    cacheTimestamp = now;

    res.json(payload);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
