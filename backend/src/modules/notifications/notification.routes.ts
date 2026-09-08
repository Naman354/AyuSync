import { Router } from 'express';
import { createNotificationHandler, getNotificationsHandler } from './notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createNotificationHandler);
router.get('/', getNotificationsHandler);

export default router;
