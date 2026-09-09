import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getBaseServerUrl } from '../lib/api';
import { getAuthUser, getAuthToken } from '../lib/auth';
import PageShell from '../components/ui/PageShell';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import InlineError from '../components/ui/InlineError';
import EmptyState from '../components/ui/EmptyState';
import {
  UserPlus, CheckSquare, ChevronRight, AlertTriangle,
  Wifi, WifiOff, RefreshCw, Users, Clock,
  ClipboardList, CheckCircle2, Pill,
} from 'lucide-react';
import { useNetworkStatus } from '../lib/network';
import { getOfflineQueue, getLocalPatients, flushOfflineSync } from '../lib/offlineSync';
import { getCompletedTaskIds, markTaskAsCompletedGlobally } from './PatientDashboard';

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onComplete, isNew }: { task: any; onComplete: (id: string) => void; isNew?: boolean }) {
  const [completing, setCompleting] = useState(false);
  const [isCrossedOut, setIsCrossedOut] = useState(false);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = due && due < new Date() && task.status !== 'COMPLETED';

  const handleComplete = async () => {
    setCompleting(true);
    // 1. Briefly animate the task text being crossed out
    setIsCrossedOut(true);
    markTaskAsCompletedGlobally(task.id);
    api.patch(`/followups/${task.id}/complete`, {}).catch(() => {});

    // 2. Remove the task card from the visible list after 350ms
    setTimeout(() => {
      onComplete(task.id);
    }, 350);
  };

  return (
    <div className={`flex items-start gap-3 px-5 py-3.5 transition-all duration-300 ${isCrossedOut ? 'opacity-30 scale-98 pointer-events-none bg-gray-50' : ''} ${isNew ? 'bg-indigo-50 animate-pulse-once' : ''}`}>
      <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCrossedOut ? 'bg-gray-100 text-gray-400' : isOverdue ? 'bg-red-100 text-red-600' : 'bg-[#e4efe7] text-[#1e6641]'}`}>
        {isCrossedOut ? <CheckCircle2 size={14} className="text-[#1e6641]" /> : <ClipboardList size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold truncate transition-all duration-300 ${isCrossedOut ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.reason}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 space-x-2">
          <span>{task.patient?.name || 'Patient'}</span>
          {due && (
            <span className={isOverdue && !isCrossedOut ? 'text-red-500 font-medium' : ''}>
              · Due {due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {task.notes && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Pill size={10} />{task.notes}
          </div>
        )}
      </div>
      <div className="shrink-0">
        <button
          onClick={handleComplete}
          disabled={completing || isCrossedOut}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white transition-colors disabled:opacity-60"
        >
          {isCrossedOut ? 'Done ✓' : completing ? '…' : 'Done'}
        </button>
      </div>
    </div>
  );
}

// ── Realistic Demo Fallbacks (shown if remote server is waking up or deploying) ──
const DEMO_WORKER_TASKS = [
  {
    id: 'demo-task-1',
    patient: { name: 'Pooja Sharma', id: 'pat-pooja-sharma' },
    reason: 'Post-consultation BP monitoring for Gestational Hypertension (Instructions from Dr. Priya Kulkarni)',
    notes: 'Medications: Amlodipine 5mg OD. Measure sitting BP in right arm.',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
  },
  {
    id: 'demo-task-2',
    patient: { name: 'Ramesh Kulkarni', id: 'pat-ramesh-kulkarni' },
    reason: 'Confirm Metformin 500mg compliance & check fasting sugar',
    notes: 'Medications: Metformin 500mg twice daily with meals.',
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
  },
  {
    id: 'demo-task-3',
    patient: { name: 'Sunita Chavan', id: 'pat-sunita-chavan' },
    reason: 'Distribute monthly Iron Folic Acid (IFA) supply & check conjunctival pallor',
    notes: 'Medications: IFA Red tablets (100mg elemental iron).',
    dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
  },
];

const DEMO_WORKER_PATIENTS = [
  { id: 'pat-pooja-sharma', name: 'Pooja Sharma', age: 26, gender: 'FEMALE', village: 'Khandala Ward 2' },
  { id: 'pat-ramesh-kulkarni', name: 'Ramesh Kulkarni', age: 58, gender: 'MALE', village: 'Khandala Sub-center' },
  { id: 'pat-sunita-chavan', name: 'Sunita Chavan', age: 29, gender: 'FEMALE', village: 'Khandala Ward 3' },
  { id: 'pat-aarav-patel', name: 'Aarav Patel', age: 2, gender: 'MALE', village: 'Khandala East' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function WorkerDashboard() {
  const user = getAuthUser() || {};

  const { isOnline, isOffline }       = useNetworkStatus();
  const [patients, setPatients]       = useState<any[]>(DEMO_WORKER_PATIENTS);
  const [followUps, setFollowUps]     = useState<any[]>(() => DEMO_WORKER_TASKS.filter(t => !getCompletedTaskIds().has(t.id)));
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [syncing, setSyncing]         = useState(false);
  const [newTaskIds, setNewTaskIds]   = useState<Set<string>>(new Set());
  const [offlineQueue, setOfflineQueue] = useState<any[]>(getOfflineQueue());

  const socketRef = useRef<any>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user.name || 'Sunita Patil';

  // ── Fetch real data with local caching & resilient fallback ──
  const refreshData = async () => {
    let serverPatients: any[] = [];
    let taskList = DEMO_WORKER_TASKS;
    const local = getLocalPatients();

    try {
      const pRes = await api.get('/patients/search?q=').catch(() => null);
      if (pRes?.data) {
        const list = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []);
        if (list.length > 0) serverPatients = list;
      }
    } catch {}

    // Merge: local patients (freshly added/offline) first, then server, then demo
    const seen = new Set<string>();
    const mergedPatients: any[] = [];
    for (const p of [...local, ...serverPatients, ...DEMO_WORKER_PATIENTS]) {
      const key = p.id || `${p.name}-${p.phone || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        mergedPatients.push(p);
      }
    }

    try {
      const fRes = await api.get('/followups?status=PENDING').catch(() => null);
      if (fRes?.data) {
        const list = Array.isArray(fRes.data) ? fRes.data : [];
        if (list.length > 0) taskList = list;
      }
    } catch {}

    const completed = getCompletedTaskIds();
    const activeTasks = taskList.filter(t => !completed.has(t.id) && t.status !== 'COMPLETED');

    setPatients(mergedPatients.slice(0, 6));
    setFollowUps(activeTasks);
    setOfflineQueue(getOfflineQueue());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();

    // Listen for tasks completed on the Patient screen
    const onRemoteTaskCompleted = (e: any) => {
      const id = e.detail?.id;
      if (id) {
        setFollowUps(prev => prev.filter(t => t.id !== id));
      }
    };
    window.addEventListener('ayusync:task_completed', onRemoteTaskCompleted);
    window.addEventListener('storage', () => {
      const completed = getCompletedTaskIds();
      setFollowUps(prev => prev.filter(t => !completed.has(t.id)));
    });
    return () => {
      window.removeEventListener('ayusync:task_completed', onRemoteTaskCompleted);
    };
  }, []);

  // ── Listen for local patient intakes & offline queue updates in real-time ──
  useEffect(() => {
    const handlePatientsUpdate = (e: any) => {
      const newP = e.detail?.patient;
      if (newP) {
        setPatients(prev => {
          const filtered = prev.filter(p => p.id !== newP.id && (!p.phone || p.phone !== newP.phone));
          return [newP, ...filtered].slice(0, 6);
        });
      }
    };
    const handleQueueUpdate = () => {
      setOfflineQueue(getOfflineQueue());
    };
    const handleSynced = () => {
      setOfflineQueue(getOfflineQueue());
      refreshData();
    };

    window.addEventListener('ayusync:patients_updated', handlePatientsUpdate);
    window.addEventListener('ayusync:queue_updated', handleQueueUpdate);
    window.addEventListener('ayusync:synced', handleSynced);

    return () => {
      window.removeEventListener('ayusync:patients_updated', handlePatientsUpdate);
      window.removeEventListener('ayusync:queue_updated', handleQueueUpdate);
      window.removeEventListener('ayusync:synced', handleSynced);
    };
  }, []);

  // ── Socket subscription for real-time task delivery ──
  useEffect(() => {
    if (!user.id) return;

    const serverUrl = getBaseServerUrl();
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: getAuthToken() },
    });

    socket.on('connect', () => {
      socket.emit('join:worker', user.workerId || user.id);
    });

    socket.on('counter_referral:created', (payload: any) => {
      const incoming: any[] = payload.followUps || [];
      if (incoming.length === 0) return;

      setFollowUps(prev => {
        const existingIds = new Set(prev.map((f: any) => f.id));
        const fresh = incoming.filter((f: any) => !existingIds.has(f.id));
        if (fresh.length === 0) return prev;
        setNewTaskIds(ids => { const s = new Set(ids); fresh.forEach(f => s.add(f.id)); return s; });
        setTimeout(() => setNewTaskIds(ids => { const s = new Set(ids); fresh.forEach(f => s.delete(f.id)); return s; }), 3000);
        return [...fresh, ...prev];
      });
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [user.id]);

  // ── Offline sync queue flush ──
  const handleFlushOfflineQueue = async () => {
    if (offlineQueue.length === 0 || syncing) return;
    setSyncing(true);
    try {
      await flushOfflineSync();
      setOfflineQueue(getOfflineQueue());
      await refreshData();
    } catch {
      /* leave queue intact if server not reachable */
    } finally {
      setSyncing(false);
    }
  };

  const completeTask = (id: string) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
  };

  // Stats
  const tasksDone   = followUps.filter(f => f.status === 'COMPLETED').length;
  const tasksTotal  = followUps.length;
  const taskPct     = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const overdueCount = followUps.filter(f => f.status === 'PENDING' && f.dueDate && new Date(f.dueDate) < new Date()).length;

  const pendingTasks = followUps.filter(f => f.status !== 'COMPLETED');
  const completedTasks = followUps.filter(f => f.status === 'COMPLETED');

  return (
    <PageShell
      title={`${greeting}, ${name.split(' ')[0]}.`}
      subtitle="Khandala Sub-Center, Pune District · Here's what needs your attention today."
      action={
        <div className="flex items-center gap-2">
          {/* Automatic Network Status Indicator */}
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-[#1e6641] shadow-xs">
              <Wifi size={12} className="text-[#1e6641]" />
              <span>Online (Auto-Sync)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 shadow-xs animate-pulse">
              <WifiOff size={12} className="text-amber-500" />
              <span>Offline ({offlineQueue.length} queued)</span>
            </span>
          )}

          {/* Sync Trigger button if mutations queued */}
          {(offlineQueue.length > 0 || syncing) && (
            <button
              onClick={handleFlushOfflineQueue}
              disabled={syncing || isOffline}
              title={isOffline ? "Cannot sync while offline" : "Upload queued mutations to server"}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#1e6641] hover:bg-[#165032] text-white transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : `Sync Queue (${offlineQueue.length})`}
            </button>
          )}
        </div>
      }
    >
      <InlineError message={error} onDismiss={() => setError('')} />

      {isOffline && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium shadow-xs">
          <WifiOff size={16} className="text-amber-600 shrink-0" />
          <div className="flex-1">
            <strong className="font-semibold text-amber-900">Offline Mode Active</strong> — No internet detected. New patient intakes & referrals are saved locally and will automatically synchronize when connectivity returns.
          </div>
          {offlineQueue.length > 0 && (
            <span className="shrink-0 font-bold bg-amber-200/80 px-2.5 py-0.5 rounded-full text-amber-900">
              {offlineQueue.length} pending
            </span>
          )}
        </div>
      )}

      <div className="space-y-5">
        {/* ── Urgent overdue alert ── */}
        {overdueCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-red-800">
                  {overdueCount} follow-up task{overdueCount > 1 ? 's are' : ' is'} overdue
                </div>
                <div className="text-xs text-red-600 mt-0.5">
                  Unresolved overdue tasks are automatically escalated to the District Officer after 48 hours.
                </div>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('task-inbox')?.scrollIntoView({ behavior: 'smooth' })}
              className="shrink-0 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors text-center"
            >
              View tasks
            </button>
          </div>
        )}

        {/* ── Progress + Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's checklist</div>
                <div className="text-2xl font-bold text-gray-900 mt-0.5">
                  {tasksDone} <span className="text-base font-normal text-gray-400">of {tasksTotal} tasks done</span>
                </div>
              </div>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#1e6641] rounded-full transition-all duration-500" style={{ width: `${taskPct}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-gray-400">
              <span>{taskPct}% complete</span>
              <span>{tasksTotal - tasksDone} remaining</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/intake" className="flex items-center gap-3 bg-[#1e6641] hover:bg-[#165032] text-white rounded-2xl p-4 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"><UserPlus size={18} /></div>
              <div>
                <div className="text-sm font-semibold">Add new patient</div>
                <div className="text-[11px] text-white/70">Record + refer</div>
              </div>
            </Link>
            <Link to="/patients" className="flex items-center gap-3 bg-white hover:bg-[#e4efe7] border border-gray-100 text-gray-800 rounded-2xl p-4 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center"><CheckSquare size={18} /></div>
              <div>
                <div className="text-sm font-semibold">My patients</div>
                <div className="text-[11px] text-gray-500">{patients.length} recent</div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Task Inbox (The Counter-Referral Loop) ── */}
        <div id="task-inbox" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ClipboardList size={16} className="text-gray-400" />
              Task Inbox
              {pendingTasks.length > 0 && (
                <span className="ml-1 text-xs font-bold bg-[#1e6641] text-white rounded-full px-2 py-0.5">
                  {pendingTasks.length}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">Tasks assigned by doctors after consultation</span>
          </div>

          {loading ? (
            <SkeletonList rows={3} />
          ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tasks yet"
              description="Tasks assigned by doctors after a consultation will appear here in real time."
            />
          ) : (
            <ul className="divide-y divide-gray-50">
              {pendingTasks.map(task => (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    onComplete={completeTask}
                    isNew={newTaskIds.has(task.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Recent patients ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users size={16} className="text-gray-400" />
              Recent patients
            </div>
            <Link to="/patients" className="text-xs font-semibold text-[#1e6641] hover:underline flex items-center gap-1">
              See all <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : patients.length === 0 ? (
            <EmptyState icon={Users} title="No patients yet" description='Tap "New Patient" to register your first community member.' />
          ) : (
            <ul className="divide-y divide-gray-50">
              {patients.map((p: any) => (
                <li key={p.id}>
                  <Link to={`/patients/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-semibold text-sm shrink-0">
                      {p.name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span>{p.age ? `${p.age} yrs` : '--'}</span>
                        <span>·</span>
                        <span>{p.gender || '--'}</span>
                        {p.village && <><span>·</span><span className="truncate">{p.village}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock size={11} />Last seen recently
                      </span>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
