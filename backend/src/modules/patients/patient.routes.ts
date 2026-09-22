import { Router } from 'express';
import { createPatient, searchPatients, getPatientTimeline, createEncounter, addCondition } from './patient.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

// Apply auth middleware to all patient routes
router.use(authenticate);

// Routes
router.post('/', requirePermission('patient.create'), createPatient);
router.get('/search', requirePermission('patient.read'), searchPatients);
router.get('/:id', requirePermission('patient.read'), getPatientTimeline);
router.get('/:id/timeline', requirePermission('patient.read'), getPatientTimeline);
router.post('/:id/conditions', requirePermission('patient.update'), addCondition);

// Encounter routes
router.post('/encounter', requirePermission('encounter.create'), createEncounter);

export default router;
