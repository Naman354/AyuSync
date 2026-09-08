import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../index';

export const login = async (req: Request, res: Response) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Phone and password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 6 characters long' });
    }

    const cleanPhone = String(phone).trim().replace(/[\s-]/g, '');
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Bad Request', message: 'Please enter a valid 10-digit phone number' });
    }
    const phoneVariants = [cleanPhone];
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
      phoneVariants.push('+91' + cleanPhone);
    } else if (cleanPhone.startsWith('+91')) {
      phoneVariants.push(cleanPhone.slice(3));
    } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      phoneVariants.push('+' + cleanPhone);
      phoneVariants.push(cleanPhone.slice(2));
    }

    const user = await prisma.user.findFirst({
      where: { phone: { in: phoneVariants } },
      include: { roles: true }
    });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const primaryRole = user.roles.length > 0 ? user.roles[0].name : 'USER';

    let displayName: string | undefined = undefined;
    let patientId: string | undefined = undefined;

    if (primaryRole === 'DOCTOR') {
      if (user.phone?.includes('9876543210')) displayName = 'Dr. Rajesh Deshmukh';
      else if (user.phone?.includes('9876543211')) displayName = 'Dr. Priya Kulkarni';
      else if (user.phone?.includes('9876543212')) displayName = 'Dr. Anand Joshi';
      else displayName = 'Dr. Deshmukh';
    } else if (primaryRole === 'WORKER') {
      if (user.phone?.includes('9998887776')) displayName = 'Sunita Patil';
      else if (user.phone?.includes('9998887777')) displayName = 'Vandana Shinde';
      else if (user.phone?.includes('9998887778')) displayName = 'Kavita More';
      else displayName = 'Sunita Patil';
    } else if (primaryRole === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { phone: { in: phoneVariants } }
      });
      if (patient) {
        patientId = patient.id;
        displayName = patient.name;
      } else {
        displayName = 'Patient';
      }
    }

    const token = jwt.sign(
      { id: user.id, role: primaryRole, phone: user.phone },
      process.env.JWT_SECRET || 'ayusync_super_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: primaryRole,
        name: displayName,
        patientId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

let cachedDoctors: any = null;
let doctorsCacheTimestamp = 0;
const DOCTORS_CACHE_TTL_MS = 60000; // 60 seconds

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedDoctors && now - doctorsCacheTimestamp < DOCTORS_CACHE_TTL_MS) {
      return res.json(cachedDoctors);
    }

    const doctors = await prisma.doctor.findMany({
      include: {
        user: { select: { id: true, phone: true } }
      }
    });

    cachedDoctors = doctors;
    doctorsCacheTimestamp = now;

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
