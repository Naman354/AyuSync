import { Router } from 'express';
import { getFacilities, updateFacilityAvailability, updateFacilityBeds } from './facility.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('facility.read'), getFacilities);
router.put('/:id/availability', requirePermission('facility.update'), updateFacilityAvailability);
router.put('/:id/beds', requirePermission('facility.update'), updateFacilityBeds);

export default router;
