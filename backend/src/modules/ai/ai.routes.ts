import { Router } from 'express';
import { handleTriage, handleRoute } from './ai.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Allow authenticated requests or fallback for demo
router.use(authenticate);

router.post('/triage', handleTriage);
router.post('/route', handleRoute);

export default router;
