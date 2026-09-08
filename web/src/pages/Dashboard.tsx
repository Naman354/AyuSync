import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getBaseServerUrl } from '../lib/api';
import PageShell from '../components/ui/PageShell';
import StatusBadge from '../components/ui/StatusBadge';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import {
  Clock, Users, ChevronRight, Building2, Stethoscope,
  ArrowRight, X, CheckCircle, Plus
} from 'lucide-react';

const URGENCY_AVATAR: Record<string, string> = {
  URGENT:   'bg-red-100 text-red-700',
  PRIORITY: 'bg-amber-100 text-amber-700',
  ROUTINE:  'bg-[#e4efe7] text-[#1e6641]',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  const [queue, setQueue] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [admittingId, setAdmittingId] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user.name || 'Dr. Rajesh Deshmukh';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueRes, referralsRes] = await Promise.all([
        api.get('/queue').catch(() => ({ data: [] })),
        api.get('/referrals').catch(() => ({ data: [] }))
      ]);
      setQueue(Array.isArray(queueRes.data) ? queueRes.data : []);
      setReferrals(Array.isArray(referralsRes.data) ? referralsRes.data : []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time referral events so doctor dashboard receives live submissions
    const serverUrl = getBaseServerUrl();
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('ayusync_token') }
    });

    socket.on('referral:created', (newRef: any) => {
      setReferrals(prev => {
        if (prev.some(r => r.id === newRef.id)) return prev;
        return [newRef, ...prev];
      });
    });

    socket.on('referral:updated', (updatedRef: any) => {
      setReferrals(prev => {
        if (['ACCEPTED', 'SCHEDULED', 'COUNTER_REFERRED', 'COMPLETED', 'REJECTED'].includes(updatedRef.status)) {
          return prev.filter(r => r.id !== updatedRef.id);
        }
        return prev.map(r => r.id === updatedRef.id ? { ...r, ...updatedRef } : r);
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  // Dynamically calculate waiting patients (WAITING or PRIORITY)
  const waitingPatients = queue.filter(q => q.status === 'WAITING' || q.status === 'PRIORITY');
  const waitingCount = waitingPatients.length;

  // Active incoming referrals waiting for doctor triage/acceptance (CREATED or SUBMITTED)
  const pendingReferrals = referrals.filter(r => ['CREATED', 'SUBMITTED'].includes(r.status));
  const referralCount = pendingReferrals.length;

  // Real urgent / priority patients from queue
  const attentionPatients = queue
    .filter(q => q.status === 'WAITING' || q.status === 'IN_CONSULTATION')
    .slice(0, 4);

  const handleAdmitReferral = async (referral: any) => {
    try {
      setAdmittingId(referral.id);

      // Optimistically remove from incoming referrals list immediately
      setReferrals(prev => prev.filter(r => r.id !== referral.id));

      // Admit directly into queue
      const facilityId = referral.destinationId || referral.originId;
      await api.post('/queue', {
        patientId: referral.patientId,
        facilityId: facilityId,
        priority: referral.urgency === 'URGENT' ? 2 : referral.urgency === 'PRIORITY' ? 1 : 0
      });

      // Update referral status to ACCEPTED
      await api.put(`/referrals/${referral.id}/status`, { newStatus: 'ACCEPTED' }).catch(() => {});

      setShowReferralsModal(false);
      navigate('/queue');
    } catch (err: any) {
      // Revert optimistic removal on error
      await loadData();
      alert(err.response?.data?.error || err.response?.data?.message || 'Could not admit patient to queue.');
    } finally {
      setAdmittingId(null);
    }
  };

  return (
    <PageShell
      title={`${greeting}, ${name}.`}
      subtitle={`Baramati CHC, Pune District · ${today}`}
      action={
        <Link
          to="/queue"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-sm font-semibold transition-colors"
        >
          <Stethoscope size={15} />
          Open consultation queue
        </Link>
      }
    >
      <div className="space-y-5">
        {/* ── Clinical Flow Banner: Waiting Queue vs Incoming Village Referrals ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Outpatient Queue */}
          <Link
            to="/queue"
            className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#1e6641]/40 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Waiting Right Now
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? <span className="skeleton inline-block h-8 w-12 rounded" /> : waitingCount}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                {waitingCount === 1 ? 'patient waiting in OPD queue' : 'patients waiting in OPD queue'}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#1e6641] group-hover:gap-2.5 transition-all">
              Manage live queue <ArrowRight size={13} />
            </div>
          </Link>

          {/* Card 2: Community & Village Referrals */}
          <div
            onClick={() => setShowReferralsModal(true)}
            className="group cursor-pointer bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#1e6641]/40 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Incoming Referrals
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? <span className="skeleton inline-block h-8 w-12 rounded" /> : referralCount}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                {referralCount === 1 ? 'case referred from ASHA health workers' : 'cases referred from ASHA health workers'}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#1e6641] group-hover:gap-2.5 transition-all">
              Review referred patients <ArrowRight size={13} />
            </div>
          </div>
        </div>

        {/* ── Patients Needing Attention ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <div className="text-sm font-semibold text-gray-900">Patients Needing Immediate Attention</div>
              <div className="text-xs text-gray-400 mt-0.5">Prioritized by clinical severity and waiting time</div>
            </div>
            <Link to="/queue" className="text-xs font-semibold text-[#1e6641] hover:underline flex items-center gap-1">
              See full queue <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <SkeletonList rows={3} />
          ) : attentionPatients.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <CheckCircle size={28} className="mx-auto text-[#1e6641] mb-2 opacity-80" />
              <div className="font-semibold text-gray-800">All caught up!</div>
              <div className="text-xs text-gray-400 mt-1">No urgent patients currently waiting in the queue.</div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {attentionPatients.map((entry) => {
                const pat = entry.appointment?.patient || entry.patient;
                const patName = pat?.name || 'Unknown Patient';
                const urgency = entry.priority > 0 ? 'URGENT' : 'ROUTINE';
                const initials = patName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'PT';
                const arrivalStr = entry.arrivalTime
                  ? `Arrived at ${new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Waiting in OPD';

                return (
                  <li key={entry.id}>
                    <Link to="/queue" className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${URGENCY_AVATAR[urgency]}`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{patName}</span>
                          <StatusBadge status={urgency} />
                          {entry.status === 'IN_CONSULTATION' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              In Consultation
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {arrivalStr} {pat?.village ? `· ${pat.village}` : ''}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-[#e4efe7] text-[#1e6641] text-xs font-semibold hover:bg-[#1e6641] hover:text-white transition-colors">
                          Consult
                        </span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Facility quick status ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Building2 size={16} className="text-gray-400" />
              Clinic status overview
            </div>
            <Link to="/facilities" className="text-xs font-semibold text-[#1e6641] hover:underline flex items-center gap-1">
              View details <ChevronRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Beds available',  value: '18 of 24' },
              { label: 'Oxygen supply',   value: 'Full ✓'   },
              { label: 'Duty doctor',     value: 'Dr. Verma' },
              { label: 'Ambulance',       value: '2 on site' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-gray-500">{item.label}</div>
                <div className="font-semibold text-gray-900 mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Incoming Referrals Modal ── */}
      {showReferralsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-[#1e6641]" />
                  Incoming Village Referrals ({pendingReferrals.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cases referred by ASHA frontline workers awaiting admission or clinical triage
                </p>
              </div>
              <button
                onClick={() => setShowReferralsModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {pendingReferrals.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  <CheckCircle size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-medium text-gray-800">No pending referrals</p>
                  <p className="text-xs text-gray-400 mt-1">All incoming community cases have been processed.</p>
                </div>
              ) : (
                pendingReferrals.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{r.patient?.name || 'Referred Patient'}</span>
                        <StatusBadge status={r.urgency || 'ROUTINE'} />
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {r.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Reason: </span>
                        {r.reason || 'General clinical consultation referral'}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Origin: {r.origin?.name || 'Local Sub-Center'} {r.patient?.village ? `· Village: ${r.patient.village}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link
                        to={`/patients/${r.patientId}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition-colors"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => handleAdmitReferral(r)}
                        disabled={admittingId === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold transition-colors disabled:opacity-60"
                      >
                        <Plus size={13} />
                        {admittingId === r.id ? 'Admitting…' : 'Admit to Queue'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowReferralsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

