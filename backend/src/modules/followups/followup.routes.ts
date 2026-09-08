import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createCounterReferral, listFollowUps, completeFollowUp, escalateFollowUp } from './followup.controller';

const router = Router();

// All followup routes require authentication
router.use(authenticate);

// POST /api/followups/counter-referral — doctor closes the loop after consultation
router.post('/counter-referral', createCounterReferral);

// GET /api/followups?status=PENDING|OVERDUE|COMPLETED — worker or doctor fetches tasks
router.get('/', listFollowUps);

// PATCH /api/followups/:id/complete — worker marks task as completed
router.patch('/:id/complete', completeFollowUp);

// PATCH /api/followups/:id/escalate — worker escalates task to Medical Officer
router.patch('/:id/escalate', escalateFollowUp);

export default router;
