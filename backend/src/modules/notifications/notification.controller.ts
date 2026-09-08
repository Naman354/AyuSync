import { Request, Response } from 'express';
import { prisma } from '../../index';
import { getIO } from '../../events/socket';

// In-memory fallback if database connection drops
const inMemoryNotifications: any[] = [];

export const createNotificationHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type = 'GENERAL', message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const targetUserId = userId || user?.id || 'demo-officer';

    let notif: any = null;
    try {
      notif = await prisma.notification.create({
        data: {
          userId: targetUserId,
          type,
          message,
          isRead: false
        }
      });
    } catch {
      // Fallback in-memory notification
      notif = {
        id: `notif-${Date.now()}`,
        userId: targetUserId,
        type,
        message,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      inMemoryNotifications.unshift(notif);
    }

    // Broadcast in real time via Socket.io
    try {
      const io = getIO();
      io.emit('notification:new', notif);
      if (type === 'CARE_GAP_ESCALATION') {
        io.emit('care_gap:escalated', notif);
      }
    } catch {
      // Non-blocking
    }

    res.status(201).json(notif);
  } catch (error: any) {
    console.error('[Notification] create error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getNotificationsHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.id;

    let notifications: any[] = [];
    try {
      notifications = await prisma.notification.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' },
        take: 30
      });
    } catch {
      notifications = inMemoryNotifications;
    }

    res.json(notifications);
  } catch (error: any) {
    console.error('[Notification] list error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
