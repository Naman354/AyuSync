import { Router } from 'express';
import { processSyncBatch, pullSyncChanges } from './sync.controller';
import { resolveSyncConflict } from './conflict.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Push batch mutations from offline queue
router.post('/', authenticate, processSyncBatch);

// Delta sync: pull changes since a given timestamp
router.get('/pull', authenticate, pullSyncChanges);

// Resolve detected synchronization conflict
router.post('/conflict/resolve', authenticate, resolveSyncConflict);

export default router;
