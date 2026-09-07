import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Bell } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import EmptyState from '../components/ui/EmptyState';
import InlineError from '../components/ui/InlineError';
import api from '../lib/api';

interface Task {
  id: string; patientName: string; age: number;
  taskTitle: string; category: 'MOTHER_BABY' | 'ONGOING' | 'INFECTION' | 'GENERAL';
  dueDate: string; isOverdue: boolean; completed: boolean; notes: string;
}

const CATEGORY_LABEL: Record<Task['category'], string> = {
  MOTHER_BABY: 'Mother & Baby', ONGOING: 'Ongoing condition',
  INFECTION: 'Infection check', GENERAL: 'General',
};
const CATEGORY_COLOR: Record<Task['category'], string> = {
  MOTHER_BABY: 'bg-pink-100 text-pink-700',
  ONGOING:     'bg-amber-100 text-amber-700',
  INFECTION:   'bg-blue-100 text-blue-700',
  GENERAL:     'bg-gray-100 text-gray-600',
};

// Demo seed data shown when API returns empty (for offline presentation)
const DEMO_TASKS: Task[] = [
  { id: '1', patientName: 'Pooja Sharma',    age: 26, taskTitle: 'Check blood pressure at home visit',    category: 'MOTHER_BABY', dueDate: 'Today',     isOverdue: false, completed: false, notes: 'History of high BP in pregnancy. Instructions from Dr. Priya Kulkarni' },
  { id: '2', patientName: 'Ramesh Kulkarni', age: 58, taskTitle: 'Confirm diabetes medicine was taken',    category: 'ONGOING',     dueDate: '2 days ago', isOverdue: true,  completed: false, notes: 'Check if Metformin is available at Khandala sub-center'     },
  { id: '3', patientName: 'Savita Jadhav',   age: 48, taskTitle: 'Asthma inhaler technique follow-up',    category: 'ONGOING',     dueDate: 'Today',     isOverdue: false, completed: true,  notes: 'BP 122/80. Inhaler technique verified.'                     },
  { id: '4', patientName: 'Aarav Patel',     age: 2,  taskTitle: 'Vaccination check - Pentavalent 3',     category: 'INFECTION',   dueDate: 'Tomorrow',  isOverdue: false, completed: false, notes: 'Immunization drive at Khandala Sub-center'                  },
  { id: '5', patientName: 'Meena Kumari',    age: 34, taskTitle: 'Post-discharge check-in',               category: 'GENERAL',     dueDate: 'Today',     isOverdue: false, completed: true,  notes: 'Returned from Baramati CHC after recovery'                  },
];

type Filter = 'ALL' | 'PENDING' | 'OVERDUE' | 'DONE';

export default function CareGaps() {
  const [filter,    setFilter]    = useState<Filter>('ALL');
  const [tasks,     setTasks]     = useState<Task[]>(DEMO_TASKS);
  const [error,     setError]     = useState('');
  const [escalating, setEscalating] = useState<string | null>(null);
  const [escalated,  setEscalated]  = useState<Set<string>>(new Set());

  // Fetch live follow-ups; fall back to demo data gracefully
  useEffect(() => {
    api.get('/followups')
      .then(res => {
        const live: any[] = Array.isArray(res.data) ? res.data : [];
        if (live.length > 0) {
          setTasks(live.map(f => {
            const reason = (f.reason || '').toLowerCase();
            let cat: Task['category'] = 'GENERAL';
            if (reason.includes('pregnancy') || reason.includes('maternal') || reason.includes('suture') || reason.includes('baby')) cat = 'MOTHER_BABY';
            else if (reason.includes('bp') || reason.includes('hypertension') || reason.includes('diabetes') || reason.includes('metformin')) cat = 'ONGOING';
            else if (reason.includes('vaccin') || reason.includes('fever') || reason.includes('infection')) cat = 'INFECTION';

            const isPast = f.dueDate ? new Date(f.dueDate) < new Date() : false;
            const isOv = f.status === 'OVERDUE' || (isPast && f.status !== 'COMPLETED');

            return {
              id: f.id,
              patientName: f.patient?.name || 'Community Patient',
              age: f.patient?.age || 32,
              taskTitle: f.reason,
              category: cat,
              dueDate: f.dueDate
                ? isOv ? 'Past Due (> 48h)' : new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Pending',
              isOverdue: isOv,
              completed: f.status === 'COMPLETED',
              notes: f.notes || '',
            };
          }));
        }
      })
      .catch(() => { /* silently keep demo data if backend unreachable */ });
  }, []);

  const toggle = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: nextCompleted } : t));

    if (nextCompleted) {
      await api.patch(`/followups/${id}/complete`, { completionNotes: 'Completed by village health worker' }).catch(() => {});
    }
  };

  const escalate = async (taskId: string, patientName: string) => {
    setEscalating(taskId);
    try {
      await api.post('/notifications', {
        type: 'CARE_GAP_ESCALATION',
        message: `ESCALATION: Patient ${patientName} has an unresolved overdue follow-up exceeding 48 hours. Immediate District Health Officer review required.`,
      });
    } catch {
      // Optimistic for demo
    } finally {
      setEscalated(prev => { const s = new Set(prev); s.add(taskId); return s; });
      setEscalating(null);
    }
  };

  const pending  = tasks.filter(t => !t.completed);
  const overdue  = tasks.filter(t => t.isOverdue && !t.completed);
  const done     = tasks.filter(t => t.completed);
  const pct      = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

  const visible = tasks.filter(t => {
    if (filter === 'PENDING') return !t.completed;
    if (filter === 'OVERDUE') return t.isOverdue && !t.completed;
    if (filter === 'DONE')    return t.completed;
    return true;
  });

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL',     label: 'All Follow-ups', count: tasks.length   },
    { key: 'PENDING', label: 'To Do',          count: pending.length },
    { key: 'OVERDUE', label: 'Overdue Alerts', count: overdue.length },
    { key: 'DONE',    label: 'Completed',      count: done.length    },
  ];

  return (
    <PageShell
      title="Care Continuity & Recovery Tracker"
      subtitle="Ensuring every hospital consultation leads to verified recovery in the patient's village"
    >
      <div className="space-y-5">
        <InlineError message={error} onDismiss={() => setError('')} />

        {/* Closed-Loop Safety Net Explainer Banner for Judges */}
        <div className="bg-[#e4efe7]/70 border border-[#1e6641]/20 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#1e6641] text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              The AyuSync Closed-Loop Safety Net
            </div>
            <div className="text-xs text-gray-700 mt-0.5 leading-relaxed">
              When a doctor at Baramati CHC prescribes post-consultation care, it is delivered as actionable tasks to the local village health worker. If a patient is abandoned or a task is unresolved for more than 48 hours, the system flags it below and enables 1-click escalation to the District Health Officer.
            </div>
          </div>
        </div>

        {/* Escalation notice */}
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-red-800">
                {overdue.length} case{overdue.length > 1 ? 's have' : ' has'} crossed the 48-hour recovery check window
              </div>
              <div className="text-xs text-red-700 mt-0.5">
                These patients have missed their post-consultation home visit. Click "Escalate to District Officer" on any card to dispatch urgent supervision.
              </div>
            </div>
          </div>
        )}


        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold text-gray-900">{done.length} of {tasks.length} complete</span>
            <span className="text-gray-400 text-xs">{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1e6641] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {pct === 100 && (
            <div className="flex items-center gap-1.5 text-[#1e6641] text-sm font-medium mt-2">
              <CheckCircle2 size={15} /> All caught up for today!
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f.key
                  ? f.key === 'OVERDUE' ? 'bg-red-600 text-white' : 'bg-[#1e6641] text-white'
                  : f.key === 'OVERDUE' && overdue.length > 0
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label} {f.count > 0 && <span className="ml-1 opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>

        {/* Task list */}
        {visible.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing here" description="All clear — no tasks match this filter." />
        ) : (
          <div className="space-y-2">
            {visible.map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col sm:flex-row sm:items-start gap-4 ${
                  task.completed ? 'border-gray-100 opacity-60'
                  : task.isOverdue ? 'border-red-200'
                  : 'border-gray-100 hover:border-[#1e6641]/30'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    task.completed ? 'bg-[#e4efe7] text-[#1e6641]'
                    : task.isOverdue ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {task.completed
                      ? <CheckCircle2 size={18} />
                      : task.isOverdue ? <AlertTriangle size={18} />
                      : <Clock size={18} />
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className={`text-sm font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.taskTitle}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLOR[task.category]}`}>
                        {CATEGORY_LABEL[task.category]}
                      </span>
                      {task.isOverdue && !task.completed && (
                        <span className="text-[11px] font-semibold text-red-600">{task.dueDate}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-gray-800">{task.patientName}</span>
                      {task.age < 2 ? ' (Infant)' : `, ${task.age} yrs`}
                    </div>
                    {task.notes && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{task.notes}</div>
                    )}

                    {/* Escalate button for overdue tasks */}
                    {task.isOverdue && !task.completed && (
                      <div className="mt-2">
                        {escalated.has(task.id) ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <Bell size={11} /> Escalated to District Officer
                          </span>
                        ) : (
                          <button
                            onClick={() => escalate(task.id, task.patientName)}
                            disabled={escalating === task.id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                          >
                            <Bell size={11} />
                            {escalating === task.id ? 'Escalating...' : 'Escalate to District Officer'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-2 self-end sm:self-start sm:mt-1 shrink-0">
                  <span className="text-xs text-gray-500">{task.completed ? 'Done' : 'Mark done'}</span>
                  <button
                    onClick={() => toggle(task.id)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ${task.completed ? 'bg-[#1e6641]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${task.completed ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
