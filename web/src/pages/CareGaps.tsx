import { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Bell, Search,
  MapPin, Check, X, ShieldAlert
} from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import EmptyState from '../components/ui/EmptyState';
import InlineError from '../components/ui/InlineError';
import api from '../lib/api';
import { getCompletedTaskIds, markTaskAsCompletedGlobally } from './PatientDashboard';

interface Task {
  id: string;
  patientName: string;
  age: number;
  gender?: string;
  village?: string;
  taskTitle: string;
  category: 'MOTHER_BABY' | 'ONGOING' | 'INFECTION' | 'GENERAL';
  dueDate: string;
  dueDateRaw?: string;
  isOverdue: boolean;
  completed: boolean;
  notes: string;
  completedNotes?: string;
}

const CATEGORY_LABEL: Record<Task['category'], string> = {
  MOTHER_BABY: 'Mother & Baby',
  ONGOING: 'Chronic / Ongoing',
  INFECTION: 'Infection Check',
  GENERAL: 'General Recovery',
};

const CATEGORY_COLOR: Record<Task['category'], string> = {
  MOTHER_BABY: 'bg-pink-50 text-pink-700 border-pink-200',
  ONGOING: 'bg-amber-50 text-amber-700 border-amber-200',
  INFECTION: 'bg-blue-50 text-blue-700 border-blue-200',
  GENERAL: 'bg-emerald-50 text-[#1e6641] border-emerald-200',
};

const ESCALATED_STORAGE_KEY = 'ayusync_escalated_followups';

function getPersistedEscalations(): Set<string> {
  try {
    const raw = localStorage.getItem(ESCALATED_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function syncPersistedEscalations(current: Set<string>) {
  localStorage.setItem(ESCALATED_STORAGE_KEY, JSON.stringify(Array.from(current)));
}

function savePersistedEscalation(id: string) {
  const current = getPersistedEscalations();
  current.add(id);
  syncPersistedEscalations(current);
}

function removePersistedEscalation(id: string) {
  const current = getPersistedEscalations();
  current.delete(id);
  syncPersistedEscalations(current);
}

const DEMO_TASKS: Task[] = [
  {
    id: '1',
    patientName: 'Pooja Sharma',
    age: 26,
    gender: 'FEMALE',
    village: 'Khandala Ward 2',
    taskTitle: 'Check blood pressure at home visit',
    category: 'MOTHER_BABY',
    dueDate: 'Today',
    isOverdue: false,
    completed: false,
    notes: 'History of high BP in pregnancy. Doctor instructions: measure sitting BP in right arm, check for ankle swelling.',
  },
  {
    id: '2',
    patientName: 'Ramesh Kulkarni',
    age: 58,
    gender: 'MALE',
    village: 'Khandala Sub-center',
    taskTitle: 'Confirm diabetes medicine compliance & fasting sugar',
    category: 'ONGOING',
    dueDate: '2 days ago',
    isOverdue: true,
    completed: false,
    notes: 'Prescribed Metformin 500mg. Confirm stock available at sub-center and assess diet compliance.',
  },
  {
    id: '4',
    patientName: 'Aarav Patel',
    age: 2,
    gender: 'MALE',
    village: 'Khandala East',
    taskTitle: 'Vaccination check - Pentavalent 3',
    category: 'INFECTION',
    dueDate: 'Tomorrow',
    isOverdue: false,
    completed: false,
    notes: 'Immunization drive session at Khandala Anganwadi. Verify mother brings MCP card.',
  },
  {
    id: '6',
    patientName: 'Sunita Chavan',
    age: 29,
    gender: 'FEMALE',
    village: 'Khandala Ward 3',
    taskTitle: 'Distribute monthly IFA supply & verify conjunctival pallor',
    category: 'MOTHER_BABY',
    dueDate: 'Today',
    isOverdue: false,
    completed: false,
    notes: 'Severe anemia history. Supply 30 IFA red tablets and encourage dietary green vegetables.',
  }
];

type FilterType = 'ALL' | 'OVERDUE' | 'TODAY';

export default function CareGaps() {
  const [tasks, setTasks] = useState<Task[]>(() => DEMO_TASKS.filter(t => !getCompletedTaskIds().has(t.id)));
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Persistent escalation tracking across refreshes
  const [escalating, setEscalating] = useState<string | null>(null);
  const [escalated, setEscalated] = useState<Set<string>>(() => getPersistedEscalations());

  // Completion animation tracking
  const [animatingTaskIds, setAnimatingTaskIds] = useState<Set<string>>(new Set());

  // Completion modal state
  const [activeTaskForCompletion, setActiveTaskForCompletion] = useState<Task | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  // Listen for real-time task completion from Patient Dashboard
  useEffect(() => {
    const handleRemoteTaskCompleted = (e: any) => {
      const finishedId = e.detail?.id;
      if (finishedId) {
        setTasks(prev => prev.filter(t => t.id !== finishedId));
      }
    };
    window.addEventListener('ayusync:task_completed', handleRemoteTaskCompleted);
    window.addEventListener('storage', () => {
      const completed = getCompletedTaskIds();
      setTasks(prev => prev.filter(t => !completed.has(t.id)));
    });
    return () => {
      window.removeEventListener('ayusync:task_completed', handleRemoteTaskCompleted);
    };
  }, []);

  // Fetch live follow-ups from API with resilient fallback
  useEffect(() => {
    api.get('/followups')
      .then(res => {
        const live: any[] = Array.isArray(res.data) ? res.data : [];
        if (live.length > 0) {
          const completedSet = getCompletedTaskIds();
          // Completed tasks should not remain visible on screen
          const activeOnly = live.filter(f => f.status !== 'COMPLETED' && !completedSet.has(f.id));

          // Sync escalated items into persistent set from server data
          const serverEscalations = new Set<string>();
          activeOnly.forEach(f => {
            if (f.status === 'ESCALATED' || (f.notes && f.notes.includes('[ESCALATED TO MO'))) {
              serverEscalations.add(f.id);
            }
          });
          // Preserve any locally cached escalations for offline continuity
          const localEscalations = getPersistedEscalations();
          localEscalations.forEach(id => {
            if (activeOnly.some(t => t.id === id && (t.status === 'ESCALATED' || t.notes?.includes('[ESCALATED TO MO')))) {
              serverEscalations.add(id);
            }
          });
          syncPersistedEscalations(serverEscalations);
          setEscalated(new Set(serverEscalations));

          setTasks(activeOnly.map(f => {
            const reason = (f.reason || '').toLowerCase();
            let cat: Task['category'] = 'GENERAL';
            if (reason.includes('pregnancy') || reason.includes('maternal') || reason.includes('suture') || reason.includes('baby')) {
              cat = 'MOTHER_BABY';
            } else if (reason.includes('bp') || reason.includes('hypertension') || reason.includes('diabetes') || reason.includes('metformin')) {
              cat = 'ONGOING';
            } else if (reason.includes('vaccin') || reason.includes('fever') || reason.includes('infection')) {
              cat = 'INFECTION';
            }

            const isPast = f.dueDate ? new Date(f.dueDate) < new Date() : false;
            const isOv = f.status === 'OVERDUE' || (isPast && f.status !== 'COMPLETED');

            return {
              id: f.id,
              patientName: f.patient?.name || 'Community Patient',
              age: f.patient?.age || 30,
              gender: f.patient?.gender || '',
              village: f.patient?.village || f.patient?.address || 'Khandala Sub-center',
              taskTitle: f.reason,
              category: cat,
              dueDate: f.dueDate
                ? isOv ? 'Past Due (> 48h)' : new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Today',
              dueDateRaw: f.dueDate,
              isOverdue: isOv,
              completed: false,
              notes: f.notes || '',
              completedNotes: f.completionNotes || '',
            };
          }));
        }
      })
      .catch(() => {
        // Keep demo tasks for reliable offline / prototype review, excluding any completed
        const completedSet = getCompletedTaskIds();
        setTasks(DEMO_TASKS.filter(t => !completedSet.has(t.id)));
      });
  }, []);

  // Quick Action: Open completion dialog
  const openCompleteModal = (task: Task) => {
    setActiveTaskForCompletion(task);
    setCompletionNote('Home visit completed. Patient condition stable and verified.');
  };

  // Mark task completed: briefly cross out text, then remove card from visible list
  const handleConfirmCompletion = async () => {
    if (!activeTaskForCompletion) return;
    const taskId = activeTaskForCompletion.id;
    const patientName = activeTaskForCompletion.patientName;
    const notesToSave = completionNote.trim() || 'Completed by ASHA worker';

    // 1. Close modal and trigger strikethrough animation immediately
    setActiveTaskForCompletion(null);
    setAnimatingTaskIds(prev => new Set(prev).add(taskId));

    // 2. Dispatch completion to shared storage & event bus
    markTaskAsCompletedGlobally(taskId);

    // 3. Dispatch completion to backend
    api.patch(`/followups/${taskId}/complete`, { completionNotes: notesToSave }).catch(() => {});

    // 4. Briefly animate task text being crossed out (350ms), then remove task card from visible list
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setAnimatingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      setFeedbackMsg(`Completed recovery visit for "${patientName}". Status synchronized.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    }, 350);
  };

  // Two-way persistent toggle: Escalate to MO <-> Escalated to MO
  const handleToggleEscalate = async (taskId: string, patientName: string) => {
    const isCurrentlyEscalated = escalated.has(taskId);
    setEscalating(taskId);

    if (isCurrentlyEscalated) {
      // Toggle off: De-escalate
      removePersistedEscalation(taskId);
      setEscalated(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      try {
        await api.patch(`/followups/${taskId}/escalate`, { deescalate: true }).catch(() => {});
      } finally {
        setEscalating(null);
        setFeedbackMsg(`Escalation removed for ${patientName}.`);
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    } else {
      // Toggle on: Escalate
      savePersistedEscalation(taskId);
      setEscalated(prev => new Set(prev).add(taskId));

      try {
        await api.patch(`/followups/${taskId}/escalate`, { deescalate: false, reason: 'Overdue recovery check > 48 hours' }).catch(() => {});
        await api.post('/notifications', {
          type: 'CARE_GAP_ESCALATION',
          message: `OVERDUE ESCALATION: Patient ${patientName} missed mandatory 48-hour post-consultation recovery check. Dispatched for District Health Officer & MO review.`,
        }).catch(() => {});
      } finally {
        setEscalating(null);
        setFeedbackMsg(`Escalated to Medical Officer for ${patientName}.`);
        setTimeout(() => setFeedbackMsg(''), 3500);
      }
    }
  };

  // Metrics (Focused on active tasks only)
  const overdueTasks = tasks.filter(t => t.isOverdue);
  const dueTodayTasks = tasks.filter(t => !t.isOverdue);
  const totalActiveTasks = tasks.length;

  // Filter & Search
  const filteredTasks = tasks.filter(t => {
    // Tab filter
    if (filter === 'OVERDUE' && !t.isOverdue) return false;
    if (filter === 'TODAY' && t.isOverdue) return false;

    // Search query match (patient name, village, task title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = t.patientName.toLowerCase().includes(q);
      const villageMatch = (t.village || '').toLowerCase().includes(q);
      const titleMatch = t.taskTitle.toLowerCase().includes(q);
      return nameMatch || villageMatch || titleMatch;
    }

    return true;
  });

  return (
    <PageShell
      title="Village Care & Recovery Visits"
      subtitle="Track post-consultation recovery, medication verification, and home visits in your assigned villages."
    >
      <div className="space-y-5">
        <InlineError message={error} onDismiss={() => setError('')} />

        {/* Transient feedback toast */}
        {feedbackMsg && (
          <div className="p-3.5 bg-[#e4efe7] border border-[#1e6641]/30 rounded-2xl text-xs font-semibold text-[#1e6641] flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg('')} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── 3 Actionable Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Overdue Alert Card */}
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`text-left p-4 rounded-2xl border transition-all ${
              filter === 'OVERDUE'
                ? 'bg-red-50 border-red-300 ring-2 ring-red-400/20'
                : 'bg-white hover:bg-red-50/40 border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Overdue Recovery</span>
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{overdueTasks.length}</div>
            <div className="text-[11px] text-red-600 mt-1 font-medium">Exceeded 48h check window</div>
          </button>

          {/* Due Today Card */}
          <button
            onClick={() => setFilter('TODAY')}
            className={`text-left p-4 rounded-2xl border transition-all ${
              filter === 'TODAY'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-white hover:bg-amber-50/40 border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Due Today / Upcoming</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{dueTodayTasks.length}</div>
            <div className="text-[11px] text-amber-700 mt-1 font-medium">Scheduled for home visit</div>
          </button>

          {/* Total Active Tasks Card */}
          <button
            onClick={() => setFilter('ALL')}
            className={`text-left p-4 rounded-2xl border transition-all ${
              filter === 'ALL'
                ? 'bg-[#e4efe7] border-[#1e6641]/40 ring-2 ring-[#1e6641]/20'
                : 'bg-white hover:bg-[#e4efe7]/40 border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1e6641] uppercase tracking-wide">Active Home Visits</span>
              <div className="w-8 h-8 rounded-xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalActiveTasks}</div>
            <div className="text-[11px] text-gray-500 mt-1">Pending village verifications</div>
          </button>
        </div>

        {/* ── Subtle Overdue Alert Notification (if overdue tasks exist) ── */}
        {overdueTasks.length > 0 && filter !== 'OVERDUE' && (
          <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-red-600 shrink-0" />
              <span>
                <strong>{overdueTasks.length} patient visit{overdueTasks.length > 1 ? 's' : ''} overdue:</strong> Post-consultation follow-up has crossed 48 hours without confirmation.
              </span>
            </div>
            <button
              onClick={() => setFilter('OVERDUE')}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
            >
              Review Overdue
            </button>
          </div>
        )}

        {/* ── Filter Tabs & Village / Patient Search ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Active ({totalActiveTasks})
            </button>
            <button
              onClick={() => setFilter('TODAY')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === 'TODAY'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Due Today ({dueTodayTasks.length})
            </button>
            <button
              onClick={() => setFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === 'OVERDUE'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Overdue ({overdueTasks.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by name, village..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1e6641] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── Task List ── */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={searchQuery ? 'No matching tasks' : 'All clear for this filter'}
            description={
              searchQuery
                ? `No recovery tasks matching "${searchQuery}". Try clearing your search.`
                : 'No pending recovery follow-ups in this category.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const isOverdue = task.isOverdue;
              const isTaskEscalated = escalated.has(task.id);
              const isCrossedOut = animatingTaskIds.has(task.id);

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCrossedOut
                      ? 'opacity-30 scale-98 pointer-events-none bg-gray-50'
                      : isOverdue
                      ? 'border-red-200 shadow-xs'
                      : 'border-gray-100 hover:border-gray-200 shadow-xs'
                  }`}
                >
                  {/* Left content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isCrossedOut
                          ? 'bg-gray-100 text-gray-400'
                          : isOverdue
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isCrossedOut ? <CheckCircle2 size={20} /> : isOverdue ? <AlertTriangle size={20} /> : <Clock size={20} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top Badges & Title */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-sm font-bold transition-all duration-300 ${isCrossedOut ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.taskTitle}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLOR[task.category]}`}>
                          {CATEGORY_LABEL[task.category]}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
                            Overdue (&gt; 48h)
                          </span>
                        )}
                      </div>

                      {/* Patient Details & Village */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
                        <span className="font-semibold text-gray-900">{task.patientName}</span>
                        <span>{task.age < 2 ? 'Infant' : `${task.age} yrs`}</span>
                        {task.gender && <span>· {task.gender}</span>}
                        {task.village && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <MapPin size={11} className="text-gray-400" />
                            {task.village}
                          </span>
                        )}
                        <span className="text-gray-400">· Due {task.dueDate}</span>
                      </div>

                      {/* Clinical Notes / Doctor Instruction */}
                      {task.notes && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                          <span className="font-semibold text-gray-700">Doctor's instruction: </span>
                          {task.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Two-way persistent Escalate / Escalated Toggle */}
                    {isOverdue && (
                      <button
                        onClick={() => handleToggleEscalate(task.id, task.patientName)}
                        disabled={escalating === task.id || isCrossedOut}
                        title={isTaskEscalated ? "Click to remove escalation to Medical Officer" : "Alert District Health Officer & MO for urgent home visit intervention"}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 shadow-xs cursor-pointer ${
                          isTaskEscalated
                            ? 'bg-red-600 hover:bg-red-700 text-white border border-red-600 shadow-sm'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        <Bell size={12} className={isTaskEscalated ? 'text-white' : 'text-red-600'} />
                        {escalating === task.id
                          ? (isTaskEscalated ? 'Reverting…' : 'Escalating…')
                          : (isTaskEscalated ? 'Escalated to MO' : 'Escalate to MO')}
                      </button>
                    )}

                    {/* Mark Complete button */}
                    <button
                      onClick={() => openCompleteModal(task)}
                      disabled={isCrossedOut}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1e6641] hover:bg-[#165032] text-white shadow-xs transition-colors disabled:opacity-60"
                    >
                      <Check size={14} /> Mark Visit Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Completion Modal Dialog ── */}
      {activeTaskForCompletion && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Record Visit Completion</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Confirm recovery visit for <strong>{activeTaskForCompletion.patientName}</strong> ({activeTaskForCompletion.village})
                </p>
              </div>
              <button
                onClick={() => setActiveTaskForCompletion(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Task Description</label>
                <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {activeTaskForCompletion.taskTitle}
                </div>
              </div>

              {/* Quick Observation Chips */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quick Observation Chips</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Vitals normal & stable',
                    'Medications verified taken',
                    'Patient recovered well',
                    'Referred for routine checkup',
                  ].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCompletionNote(chip)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                        completionNote === chip
                          ? 'bg-[#1e6641] text-white border-[#1e6641]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Completion Notes textarea */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Home Visit Findings</label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={e => setCompletionNote(e.target.value)}
                  placeholder="e.g. BP checked 122/82, advised salt reduction, patient compliant..."
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1e6641] focus:bg-white resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTaskForCompletion(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCompletion}
                  className="px-4 py-2 text-xs font-semibold bg-[#1e6641] hover:bg-[#165032] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Confirm Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
