import api from './api';

export const MUTATION_QUEUE_KEY = 'ayusync_mutation_queue';
export const LOCAL_PATIENTS_KEY = 'ayusync_local_patients';

export interface OfflineMutation {
  operationId: string;
  entity: 'PATIENT' | 'REFERRAL' | 'ASSESSMENT' | 'FOLLOWUP' | 'TASK' | string;
  action: 'CREATE' | 'UPDATE';
  payload: any;
  timestamp: string;
}

export function getOfflineQueue(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(MUTATION_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(q: OfflineMutation[]): void {
  try {
    localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(q));
  } catch (err) {
    console.error('[OfflineSync] Failed to persist queue:', err);
  }
}

export function enqueueOfflineMutation(mutation: Omit<OfflineMutation, 'operationId' | 'timestamp'> & { operationId?: string }): OfflineMutation {
  const q = getOfflineQueue();
  const opId = mutation.operationId || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const fullMutation: OfflineMutation = {
    ...mutation,
    operationId: opId,
    entity: mutation.entity.toUpperCase() as any,
    timestamp: new Date().toISOString()
  };

  q.push(fullMutation);
  saveOfflineQueue(q);
  window.dispatchEvent(new CustomEvent('ayusync:queue_updated', { detail: { count: q.length } }));
  return fullMutation;
}

// ── Local Patient Cache (Ensures offline / freshly created patients appear immediately in Recent Patients) ──

export function getLocalPatients(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_PATIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPatient(patient: any): void {
  try {
    const current = getLocalPatients();
    // Prepend and deduplicate by id or phone
    const filtered = current.filter((p: any) => p.id !== patient.id && (!p.phone || p.phone !== patient.phone));
    const updated = [patient, ...filtered].slice(0, 30);
    localStorage.setItem(LOCAL_PATIENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ayusync:patients_updated', { detail: { patient } }));
  } catch (err) {
    console.error('[OfflineSync] Failed to save local patient:', err);
  }
}

// ── Background Flush & Sync ──

let isSyncing = false;

export async function flushOfflineSync(): Promise<{ success: boolean; syncedCount: number; remainingCount: number }> {
  if (isSyncing) {
    return { success: false, syncedCount: 0, remainingCount: getOfflineQueue().length };
  }

  const q = getOfflineQueue();
  if (q.length === 0) {
    return { success: true, syncedCount: 0, remainingCount: 0 };
  }

  isSyncing = true;
  window.dispatchEvent(new CustomEvent('ayusync:sync_start'));

  try {
    const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
    const workerId = user.workerId || user.id || 'worker-sunita-patil';

    const response = await api.post('/sync', {
      workerId,
      mutations: q
    });

    const results = response.data?.results || [];
    const successfulOpIds = new Set(
      results
        .filter((r: any) => r.status === 'SUCCESS' || r.status === 'ALREADY_SYNCED')
        .map((r: any) => r.operationId)
    );

    // Filter out successfully processed mutations
    const remaining = q.filter((m) => !successfulOpIds.has(m.operationId));
    saveOfflineQueue(remaining);

    const syncedCount = q.length - remaining.length;
    console.log(`[OfflineSync] Successfully synced ${syncedCount} mutation(s) to backend.`);

    window.dispatchEvent(new CustomEvent('ayusync:synced', { detail: { syncedCount, remainingCount: remaining.length } }));
    return { success: true, syncedCount, remainingCount: remaining.length };
  } catch (err) {
    console.warn('[OfflineSync] Flush attempt postponed (network/server unavailable):', err);
    return { success: false, syncedCount: 0, remainingCount: q.length };
  } finally {
    isSyncing = false;
    window.dispatchEvent(new CustomEvent('ayusync:sync_end'));
  }
}
