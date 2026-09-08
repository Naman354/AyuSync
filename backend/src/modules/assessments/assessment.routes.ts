import { Router } from 'express';
import { createAssessment, getAssessmentsByPatient } from './assessment.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission('assessment.create'), createAssessment);
router.get('/', requirePermission('assessment.read'), getAssessmentsByPatient);
router.get('/patient/:patientId', requirePermission('assessment.read'), getAssessmentsByPatient);

export default router;
