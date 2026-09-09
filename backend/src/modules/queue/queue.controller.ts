import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { broadcastQueueUpdate } from '../../events/socket';

// 21. QUEUE ENGINE: Explicit queue states
export const enqueuePatient = async (req: Request, res: Response) => {
  try {
    const { appointmentId, patientId, facilityId, doctorId, priority } = req.body;

    let finalApptId = appointmentId;

    let targetPatientId = patientId;
    if (!targetPatientId && appointmentId) {
      const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      targetPatientId = appt?.patientId;
    }

    // Prevent duplicate active queue entries for the same patient
    if (targetPatientId) {
      const existingActiveEntry = await prisma.queueEntry.findFirst({
        where: {
          appointment: { patientId: targetPatientId },
          status: { in: ['WAITING', 'IN_CONSULTATION', 'PRIORITY'] }
        }
      });
      if (existingActiveEntry) {
        return res.status(400).json({
          error: 'Patient Already in Queue',
          message: 'This patient is already waiting or in consultation in the queue.'
        });
      }
    }

    // Validate entities if creating a walk-in appointment
    if (!finalApptId && patientId && facilityId) {
      const [patientExists, facilityExists] = await Promise.all([
        prisma.patient.findUnique({ where: { id: patientId } }),
        prisma.facility.findUnique({ where: { id: facilityId } })
      ]);

      if (!patientExists) {
        return res.status(404).json({ error: 'Not Found', message: 'Patient not found' });
      }
      if (!facilityExists) {
        return res.status(404).json({ error: 'Not Found', message: 'Facility not found' });
      }

      const walkIn = await prisma.appointment.create({
        data: {
          patientId,
          facilityId,
          doctorId: doctorId || null,
          scheduledAt: new Date(),
          status: 'BOOKED'
        }
      });
      finalApptId = walkIn.id;
    }

    if (!finalApptId) {
      return res.status(400).json({ error: 'Bad Request', message: 'appointmentId or patientId+facilityId is required' });
    }

    const cleanPriority = Math.max(0, Math.min(100, parseInt(String(priority ?? 0), 10) || 0));

    const queueEntry = await prisma.queueEntry.create({
      data: {
        appointmentId: finalApptId,
        doctorId: doctorId || null,
        priority: cleanPriority,
        status: 'WAITING'
      },
      include: {
        appointment: { include: { patient: true } }
      }
    });

    try {
      if (queueEntry.appointment?.facilityId) {
        broadcastQueueUpdate(queueEntry.appointment.facilityId, doctorId, {
          action: 'ENQUEUE',
          entry: queueEntry
        });
      }
    } catch (sockErr) {
      console.warn('[Queue] Socket broadcast warning on enqueue:', sockErr);
    }

    res.status(201).json(queueEntry);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getQueueForDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const queue = await prisma.queueEntry.findMany({
      where: { doctorId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      orderBy: [
        { priority: 'desc' },
        { arrivalTime: 'asc' }
      ],
      include: {
        appointment: {
          include: { patient: true }
        }
      }
    });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateQueueStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const queueEntry = await prisma.queueEntry.findUnique({ where: { id } });
    if (!queueEntry) {
      return res.status(404).json({ error: 'Not Found', message: 'Queue entry not found' });
    }

    const currentStatus = queueEntry.status;

    if (currentStatus === status) {
      return res.json(queueEntry);
    }

    // Define allowed transitions
    const VALID_QUEUE_TRANSITIONS: Record<string, string[]> = {
      'WAITING': ['IN_CONSULTATION', 'CANCELLED', 'COMPLETED'],
      'PRIORITY': ['IN_CONSULTATION', 'CANCELLED', 'COMPLETED'],
      'IN_CONSULTATION': ['WAITING', 'COMPLETED', 'CANCELLED']
    };

    const allowed = VALID_QUEUE_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid Transition', message: `Cannot transition from ${currentStatus} to ${status}` });
    }

    // In a single-doctor consultation room, starting a consultation on a patient completes any other active consultation
    if (status === 'IN_CONSULTATION') {
      try {
        await prisma.queueEntry.updateMany({
          where: {
            id: { not: id },
            status: 'IN_CONSULTATION',
            ...(queueEntry.doctorId ? { doctorId: queueEntry.doctorId } : {})
          },
          data: { status: 'COMPLETED' }
        });
      } catch (multiErr) {
        console.warn('[Queue] Note: could not auto-complete previous in-consultation entries:', multiErr);
      }
    }

    const updated = await prisma.queueEntry.update({
      where: { id },
      data: { status },
      include: { appointment: { include: { patient: true } } }
    });

    try {
      if (updated.appointment?.facilityId) {
        broadcastQueueUpdate(updated.appointment.facilityId, updated.doctorId, {
          action: 'UPDATE_STATUS',
          entry: updated
        });
      }
    } catch (sockErr) {
      console.warn('[Queue] Socket broadcast warning on status update:', sockErr);
    }

    res.json(updated);
  } catch (error) {
    console.error('[Queue] updateQueueStatus error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllQueue = async (req: Request, res: Response) => {
  try {
    const queue = await prisma.queueEntry.findMany({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      orderBy: [
        { priority: 'desc' },
        { arrivalTime: 'asc' }
      ],
      include: {
        appointment: {
          include: { patient: true }
        },
        doctor: {
          include: { user: true }
        }
      }
    });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
