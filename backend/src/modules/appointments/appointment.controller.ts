import { Request, Response } from 'express';
import { prisma } from '../../index';

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const { patientId, facilityId, doctorId, scheduledAt } = req.body;

    if (!patientId || !facilityId || !doctorId || !scheduledAt) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing required fields' });
    }

    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid scheduledAt date format' });
    }

    const nowMinus24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (parsedDate < nowMinus24h) {
      return res.status(400).json({ error: 'Bad Request', message: 'Appointment cannot be scheduled in the past' });
    }

    // 1. Validate entities exist
    const [patient, doctor, facility] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.doctor.findUnique({ where: { id: doctorId } }),
      prisma.facility.findUnique({ where: { id: facilityId }, include: { availability: true } })
    ]);

    if (!patient) return res.status(404).json({ error: 'Not Found', message: 'Patient not found' });
    if (!doctor) return res.status(404).json({ error: 'Not Found', message: 'Doctor not found' });
    if (!facility) return res.status(404).json({ error: 'Not Found', message: 'Facility not found' });

    // 2. Check facility availability
    if (facility.availability && facility.availability.status === 'CLOSED') {
      return res.status(409).json({ error: 'Conflict', message: 'Facility is currently closed' });
    }

    // 3. Check for doctor conflicts (exactly at the same time)
    const existingDoctorAppt = await prisma.appointment.findFirst({
      where: {
        doctorId,
        scheduledAt: parsedDate,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingDoctorAppt) {
      return res.status(409).json({ error: 'Conflict', message: 'Doctor is already booked at this time' });
    }

    // 4. Check for patient conflicts (exactly at the same time)
    const existingPatientAppt = await prisma.appointment.findFirst({
      where: {
        patientId,
        scheduledAt: parsedDate,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingPatientAppt) {
      return res.status(409).json({ error: 'Conflict', message: 'Patient already has an appointment at this time' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        facilityId,
        doctorId,
        scheduledAt: parsedDate,
        status: 'BOOKED'
      }
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        facility: true
      }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
