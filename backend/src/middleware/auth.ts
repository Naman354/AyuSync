import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'ayusync_super_secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    roles: string[];
    permissions: string[];
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        roles: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User inactive or not found' });
    }

    const roles = user.roles.map((r: any) => r.name);
    let permissions = Array.from(new Set(user.roles.flatMap((r: any) => r.permissions?.map((p: any) => p.action) || []))) as string[];

    // Ensure built-in roles have their standard operational permissions
    if (roles.includes('PATIENT')) {
      const patientPerms = ['patient.read', 'assessment.read', 'referral.read', 'task.read'];
      permissions = Array.from(new Set([...permissions, ...patientPerms]));
    }
    if (roles.includes('WORKER')) {
      const workerPerms = [
        'patient.read', 'patient.create', 'patient.update',
        'encounter.read', 'encounter.create',
        'assessment.read', 'assessment.create',
        'referral.read', 'referral.create',
        'facility.read',
        'queue.read',
        'task.read', 'task.update'
      ];
      permissions = Array.from(new Set([...permissions, ...workerPerms]));
    }
    if (roles.includes('DOCTOR') || roles.includes('ADMIN')) {
      const doctorPerms = [
        'patient.read', 'patient.create', 'patient.update',
        'encounter.read', 'encounter.create',
        'assessment.read', 'assessment.create',
        'referral.read', 'referral.create', 'referral.update',
        'facility.read', 'facility.update',
        'queue.read', 'queue.manage',
        'task.read', 'task.update'
      ];
      permissions = Array.from(new Set([...permissions, ...doctorPerms]));
    }

    req.user = {
      id: user.id,
      roles,
      permissions
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};
