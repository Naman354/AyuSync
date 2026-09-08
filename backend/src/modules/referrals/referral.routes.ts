import { Router } from 'express';
import { updateReferralStatus, createReferral, getReferrals } from './referral.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getReferrals);
router.post('/', createReferral);
router.put('/:id/status', updateReferralStatus);

export default router;
