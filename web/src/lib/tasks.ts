// AyuSync Unified Task Registry & Bi-directional Synchronization Helper

const COMPLETED_TASKS_KEY = 'ayusync_completed_task_ids';

// Alias dictionary to bridge historical demo IDs, seed IDs, and new unified task IDs
const TASK_ID_ALIASES: Record<string, string[]> = {
  '1': ['demo-task-1', 'demo-fu-pooja'],
  'demo-task-1': ['1', 'demo-fu-pooja'],
  'demo-fu-pooja': ['1', 'demo-task-1'],

  '2': ['demo-task-2', 'demo-fu-ramesh'],
  'demo-task-2': ['2', 'demo-fu-ramesh'],
  'demo-fu-ramesh': ['2', 'demo-task-2'],

  '3': ['demo-task-3', 'demo-fu-sunita', '6'],
  '6': ['demo-task-3', 'demo-fu-sunita', '3'],
  'demo-task-3': ['3', '6', 'demo-fu-sunita'],
  'demo-fu-sunita': ['3', '6', 'demo-task-3'],

  '4': ['demo-task-4', 'demo-fu-aarav'],
  'demo-task-4': ['4', 'demo-fu-aarav'],
  'demo-fu-aarav': ['4', 'demo-task-4'],
};

export function getCompletedTaskIds(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_TASKS_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    const expanded = new Set<string>();

    for (const id of parsed) {
      expanded.add(id);
      const aliases = TASK_ID_ALIASES[id];
      if (aliases) {
        for (const alias of aliases) {
          expanded.add(alias);
        }
      }
    }
    return expanded;
  } catch {
    return new Set();
  }
}

export function markTaskAsCompletedGlobally(id: string) {
  try {
    const ids = getCompletedTaskIds();
    ids.add(id);
    const aliases = TASK_ID_ALIASES[id] || [];
    for (const alias of aliases) {
      ids.add(alias);
    }

    localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(Array.from(ids)));

    // Broadcast completion to all active components
    window.dispatchEvent(new CustomEvent('ayusync:task_completed', { detail: { id, status: 'COMPLETED' } }));
    for (const alias of aliases) {
      window.dispatchEvent(new CustomEvent('ayusync:task_completed', { detail: { id: alias, status: 'COMPLETED' } }));
    }
  } catch {}
}

export interface UnifiedFollowupTask {
  id: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    village?: string;
  };
  reason: string;
  notes: string;
  category: 'MOTHER_BABY' | 'ONGOING' | 'INFECTION' | 'GENERAL';
  dueDate: string;
  dueDateFormatted: string;
  isOverdue: boolean;
  status: 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'ESCALATED';
}

export const UNIFIED_DEMO_TASKS: UnifiedFollowupTask[] = [
  {
    id: 'demo-task-1',
    patientId: 'pat-pooja-sharma',
    patient: {
      id: 'pat-pooja-sharma',
      name: 'Pooja Sharma',
      age: 26,
      gender: 'FEMALE',
      village: 'Khandala Ward 2',
    },
    reason: 'Post-consultation BP monitoring for Gestational Hypertension',
    notes: 'Medications: Amlodipine 5mg OD. Measure sitting BP in right arm, check for ankle swelling.',
    category: 'MOTHER_BABY',
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    dueDateFormatted: 'Today',
    isOverdue: false,
    status: 'PENDING',
  },
  {
    id: 'demo-task-2',
    patientId: 'pat-ramesh-kulkarni',
    patient: {
      id: 'pat-ramesh-kulkarni',
      name: 'Ramesh Kulkarni',
      age: 58,
      gender: 'MALE',
      village: 'Khandala Sub-center',
    },
    reason: 'Confirm Metformin 500mg compliance & check fasting sugar',
    notes: 'Medications: Metformin 500mg twice daily with meals. Assess dietary compliance.',
    category: 'ONGOING',
    dueDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    dueDateFormatted: '2 days ago',
    isOverdue: true,
    status: 'OVERDUE',
  },
  {
    id: 'demo-task-3',
    patientId: 'pat-sunita-chavan',
    patient: {
      id: 'pat-sunita-chavan',
      name: 'Sunita Chavan',
      age: 29,
      gender: 'FEMALE',
      village: 'Khandala Ward 3',
    },
    reason: 'Distribute monthly Iron Folic Acid (IFA) supply & check conjunctival pallor',
    notes: 'Medications: IFA Red tablets (100mg iron + 500mcg folic acid). Verify anemia pallor.',
    category: 'MOTHER_BABY',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    dueDateFormatted: 'Tomorrow',
    isOverdue: false,
    status: 'PENDING',
  },
  {
    id: 'demo-task-4',
    patientId: 'pat-aarav-patel',
    patient: {
      id: 'pat-aarav-patel',
      name: 'Aarav Patel',
      age: 2,
      gender: 'MALE',
      village: 'Khandala East',
    },
    reason: 'Vaccination check - Pentavalent 3 & growth milestone review',
    notes: 'Immunization drive session at Khandala Anganwadi. Verify mother brings MCP card.',
    category: 'INFECTION',
    dueDate: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    dueDateFormatted: 'In 2 days',
    isOverdue: false,
    status: 'PENDING',
  },
];
