import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

let cachedFacilities: any = null;
let facilitiesCacheTimestamp = 0;
const FACILITIES_CACHE_TTL_MS = 30000; // 30 seconds

// 17. FACILITY MODEL: expose operational capabilities
export const getFacilities = async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedFacilities && now - facilitiesCacheTimestamp < FACILITIES_CACHE_TTL_MS) {
      return res.json(cachedFacilities);
    }

    const facilities = await prisma.facility.findMany({
      include: {
        services: true,
        capacities: true,
        availability: true,
        doctors: {
          include: {
            doctor: {
              include: {
                specialist: true,
                user: { select: { id: true, email: true } }
              }
            }
          }
        }
      }
    });

    cachedFacilities = facilities;
    facilitiesCacheTimestamp = now;

    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateFacilityAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, readinessScore } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'Facility ID is required' });
    }

    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility) {
      return res.status(404).json({ error: 'Not Found', message: 'Facility not found' });
    }

    const validStatuses = ['OPEN', 'CLOSED', 'OVERCAPACITY'];
    const cleanStatus = status ? String(status).toUpperCase().trim() : 'OPEN';
    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({ error: 'Bad Request', message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    let cleanScore: number | undefined = undefined;
    if (readinessScore !== undefined && readinessScore !== null) {
      const scoreNum = Number(readinessScore);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        return res.status(400).json({ error: 'Bad Request', message: 'Readiness score must be a number between 0 and 100' });
      }
      cleanScore = scoreNum;
    }

    const availability = await prisma.facilityAvailability.upsert({
      where: { facilityId: id },
      update: { status: cleanStatus, readinessScore: cleanScore },
      create: { facilityId: id, status: cleanStatus, readinessScore: cleanScore ?? 80 }
    });

    cachedFacilities = null;

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateFacilityBeds = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { delta, occupied, capacityId } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'Facility ID is required' });
    }

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: { capacities: true, availability: true }
    });

    if (!facility) {
      return res.status(404).json({ error: 'Not Found', message: 'Facility not found' });
    }

    let targetCap: any = null;
    if (capacityId) {
      targetCap = facility.capacities.find((c: any) => c.id === capacityId);
    }
    if (!targetCap && facility.capacities.length > 0) {
      targetCap = facility.capacities.find((c: any) => c.resource.toLowerCase().includes('bed')) || facility.capacities[0];
    }

    if (!targetCap) {
      targetCap = await prisma.facilityCapacity.create({
        data: {
          facilityId: id,
          resource: 'General Inpatient Beds',
          total: 24,
          occupied: 14
        }
      });
    }

    let newOccupied = targetCap.occupied;
    if (delta !== undefined) {
      const deltaNum = Number(delta);
      if (!isNaN(deltaNum)) {
        newOccupied = Math.max(0, Math.min(targetCap.total, targetCap.occupied + deltaNum));
      }
    } else if (occupied !== undefined) {
      const occNum = Number(occupied);
      if (!isNaN(occNum)) {
        newOccupied = Math.max(0, Math.min(targetCap.total, occNum));
      }
    }

    const updatedCap = await prisma.facilityCapacity.update({
      where: { id: targetCap.id },
      data: { occupied: newOccupied }
    });

    // Recalculate total vs occupied for facility
    const allCapacities = await prisma.facilityCapacity.findMany({ where: { facilityId: id } });
    const totalBeds = allCapacities.reduce((sum, c) => sum + c.total, 0);
    const totalOccupied = allCapacities.reduce((sum, c) => sum + c.occupied, 0);

    // Auto-update availability status if capacity hits 100% or frees up
    let newStatus = facility.availability?.status || 'OPEN';
    let newReadiness = facility.availability?.readinessScore ?? 85;

    if (totalOccupied >= totalBeds && totalBeds > 0) {
      newStatus = 'OVERCAPACITY';
      newReadiness = Math.min(newReadiness, 45);
    } else if (newStatus === 'OVERCAPACITY' && totalOccupied < totalBeds) {
      newStatus = 'OPEN';
      newReadiness = 88;
    }

    const updatedAvailability = await prisma.facilityAvailability.upsert({
      where: { facilityId: id },
      update: { status: newStatus, readinessScore: newReadiness },
      create: { facilityId: id, status: newStatus, readinessScore: newReadiness }
    });

    // Invalidate cached facilities
    cachedFacilities = null;

    res.json({
      success: true,
      facilityId: id,
      capacity: updatedCap,
      capacities: allCapacities,
      availability: updatedAvailability
    });
  } catch (error) {
    console.error('[Facility] updateFacilityBeds error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
