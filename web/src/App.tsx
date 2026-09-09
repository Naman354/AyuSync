import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuthToken, getAuthUser, updateAuthUser, clearAuthSession } from './lib/auth';
import SplashScreen from './components/ui/SplashScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import PatientIntakeFlow from './pages/PatientIntakeFlow';
import ReferralSuccess from './pages/ReferralSuccess';
import CareGaps from './pages/CareGaps';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import PatientDashboard from './pages/PatientDashboard';
import FacilityReadiness from './pages/FacilityReadiness';
import Queue from './pages/Queue';
import {
  HeartPulse,
  LogOut,
  LayoutDashboard,
  Users,
  Clock,
  Building2,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNetworkStatus } from './lib/network';


// ─── Shared nav link component ───────────────────────────────────────────────
function NavLink({ to, exact, children }: { to: string; exact?: boolean; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isActive = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[#e4efe7] text-[#1e6641]'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}

// ─── Known Demo Patient Lookup for Instant Zero-Latency Navigation ───────────
const KNOWN_DEMO_PATIENTS: Record<string, string> = {
  'pat-pooja-sharma': 'Pooja Sharma',
  'pat-ramesh-kulkarni': 'Ramesh Kulkarni',
  'pat-sunita-chavan': 'Sunita Chavan',
  'pat-aarav-patel': 'Aarav Patel',
  'pat-meena-kumari': 'Meena Kumari',
};

// ─── Protected shell ─────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const token = getAuthToken();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOffline, toggleOffline } = useNetworkStatus();

  const [user, setUser] = useState<any>(() => getAuthUser() || {});
  const [activePatient, setActivePatient] = useState<{ id?: string; name?: string } | null>(() => {
    try {
      const raw = sessionStorage.getItem('ayusync_active_patient');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Listen to active patient changes dispatched from PatientProfile or PatientDashboard
  useEffect(() => {
    const onActivePatient = (e: any) => {
      if (e.detail && e.detail.name) {
        setActivePatient(e.detail);
        try {
          sessionStorage.setItem('ayusync_active_patient', JSON.stringify(e.detail));
          if (e.detail.id) sessionStorage.setItem('ayusync_selected_patient_id', e.detail.id);
        } catch {}
      } else if (e.detail === null) {
        setActivePatient(null);
        try {
          sessionStorage.removeItem('ayusync_active_patient');
        } catch {}
      }
    };
    window.addEventListener('ayusync:active_patient', onActivePatient);
    return () => window.removeEventListener('ayusync:active_patient', onActivePatient);
  }, []);

  // Listen to auth user state updates (e.g. role switch)
  useEffect(() => {
    const onAuthUpdate = () => {
      setUser(getAuthUser() || {});
    };
    window.addEventListener('storage', onAuthUpdate);
    window.addEventListener('ayusync:user_updated', onAuthUpdate);
    return () => {
      window.removeEventListener('storage', onAuthUpdate);
      window.removeEventListener('ayusync:user_updated', onAuthUpdate);
    };
  }, []);

  const isPatientPortalPath = location.pathname === '/patient' || location.pathname.startsWith('/patient/') || location.pathname.startsWith('/patient?');
  const isPatientProfilePath = location.pathname.startsWith('/patients/');

  // Strictly derive role without mutating sessionStorage on route navigation
  const getRoleFromPath = (path: string): string => {
    if (path.startsWith('/worker') || path.startsWith('/intake') || path.startsWith('/followups')) return 'WORKER';
    if (path.startsWith('/dashboard') || path.startsWith('/queue') || path.startsWith('/facilities')) return 'DOCTOR';
    if (isPatientPortalPath) {
      return user?.role === 'PATIENT' ? 'PATIENT' : (user?.role || 'PATIENT');
    }
    // On /patients or /patients/:id or other routes: maintain current user role
    return user?.role || 'DOCTOR';
  };

  const currentRole = getRoleFromPath(location.pathname);
  const isWorker = currentRole === 'WORKER';
  const isPatient = currentRole === 'PATIENT';
  const isDoctor = !isWorker && !isPatient;

  // Dynamic top-right profile name and initial:
  // When a patient profile (/patients/:id) or portal (/patient) is open, dynamically reflect that patient!
  let displayName = '';
  let isDisplayingPatient = false;

  if (isPatientProfilePath) {
    const routePatientId = location.pathname.replace('/patients/', '').split('/')[0];
    const resolvedName = (activePatient?.id === routePatientId && activePatient?.name) || KNOWN_DEMO_PATIENTS[routePatientId] || activePatient?.name;
    displayName = resolvedName || 'Patient Profile';
    isDisplayingPatient = true;
  } else if (isPatientPortalPath) {
    const searchParams = new URLSearchParams(location.search);
    const queryId = searchParams.get('id');
    const targetId = queryId || activePatient?.id || user.patientId;
    const resolvedName = (targetId && KNOWN_DEMO_PATIENTS[targetId]) || activePatient?.name || (user.role === 'PATIENT' && user.name ? user.name : 'Pooja Sharma');
    displayName = resolvedName;
    isDisplayingPatient = true;
  } else {
    // Standard role-based name for Doctor / Worker / Patient
    if (isDoctor) {
      displayName = (user.name && (user.name.startsWith('Dr') || user.name.includes('Deshmukh') || user.name.includes('Joshi')))
        ? user.name
        : 'Dr. Rajesh Deshmukh';
    } else if (isWorker) {
      displayName = (user.name && !user.name.includes('Dr')) ? user.name : 'Sunita Patil';
    } else {
      displayName = user.name || activePatient?.name || 'Pooja Sharma';
    }
  }

  // Determine active patient portal link target (defaults to Pooja Sharma if no specific patient selected)
  const activePortalPatientId = activePatient?.id || user.patientId || (typeof window !== 'undefined' ? sessionStorage.getItem('ayusync_selected_patient_id') : null) || 'pat-pooja-sharma';
  const patientPortalUrl = `/patient?id=${activePortalPatientId}`;

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    const onStart = () => { setSyncing(true); setSyncMsg('Syncing offline queue to central server...'); };
    const onEnd = () => { setSyncing(false); };
    const onSynced = (e: any) => {
      const count = e.detail?.syncedCount || 0;
      if (count > 0) {
        setSyncMsg(`Synced ${count} offline record(s) successfully!`);
        setTimeout(() => setSyncMsg(''), 4000);
      }
    };
    window.addEventListener('ayusync:sync_start', onStart);
    window.addEventListener('ayusync:sync_end', onEnd);
    window.addEventListener('ayusync:synced', onSynced);
    return () => {
      window.removeEventListener('ayusync:sync_start', onStart);
      window.removeEventListener('ayusync:sync_end', onEnd);
      window.removeEventListener('ayusync:synced', onSynced);
    };
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  const switchRole = () => {
    let newRole = 'DOCTOR';
    let newName = 'Dr. Rajesh Deshmukh';
    let targetPath = '/dashboard';
    let patientId = user.patientId;

    if (currentRole === 'DOCTOR') {
      newRole = 'WORKER';
      newName = 'Sunita Patil';
      targetPath = '/worker';
    } else if (currentRole === 'WORKER') {
      newRole = 'PATIENT';
      // Use active or stored patient ID if available, not defaulting to Ramesh Kulkarni
      const activeId = activePatient?.id || sessionStorage.getItem('ayusync_selected_patient_id') || 'pat-pooja-sharma';
      const activeName = (activeId && KNOWN_DEMO_PATIENTS[activeId]) || activePatient?.name || 'Pooja Sharma';
      newName = activeName;
      patientId = activeId;
      targetPath = `/patient?id=${activeId}`;
    } else {
      newRole = 'DOCTOR';
      newName = 'Dr. Rajesh Deshmukh';
      targetPath = '/dashboard';
    }

    const updated = updateAuthUser({ role: newRole, name: newName, patientId });
    setUser(updated);
    window.dispatchEvent(new CustomEvent('ayusync:user_updated', { detail: updated }));
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f3] font-sans text-gray-900">
      {/* ── Top navigation bar ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4">

          {/* Brand */}
          <Link to={isWorker ? '/worker' : isPatient ? patientPortalUrl : '/dashboard'} className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-[#1e6641] text-white flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <HeartPulse size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">SwasthyaSetu</div>
              <div className="hidden sm:block text-[10px] text-gray-400 leading-tight">AyuSync · Baramati CHC</div>
            </div>
          </Link>

          {/* Role-aware desktop navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-1 ml-6">
            {isWorker ? (
              <>
                <NavLink to="/worker" exact><LayoutDashboard size={15} />Home & Tasks</NavLink>
                <NavLink to="/patients"><Users size={15} />Community Members</NavLink>
                <NavLink to="/followups"><AlertTriangle size={15} />Care Gap Alerts</NavLink>
              </>
            ) : isPatient ? (
              <>
                <NavLink to={patientPortalUrl} exact><Users size={15} />My Health Portal</NavLink>
                <NavLink to="/patients"><Building2 size={15} />Patient Directory</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" exact><LayoutDashboard size={15} />Dashboard</NavLink>
                <NavLink to="/queue"><Clock size={15} />Queue</NavLink>
                <NavLink to="/patients"><Users size={15} />Patients</NavLink>
                <NavLink to="/facilities"><Building2 size={15} />Clinic Status</NavLink>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Realistic Offline/Online Simulation Toggle */}
            <button
              type="button"
              onClick={toggleOffline}
              title={isOffline ? 'Click to restore Online mode (auto-flushes local queue)' : 'Click to simulate Offline mode'}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border text-[11px] sm:text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                isOffline
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-emerald-50 border-emerald-200 text-[#1e6641] hover:bg-emerald-100'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff size={12} className="text-amber-600 animate-pulse shrink-0" />
                  <span className="hidden xs:inline sm:inline">Offline</span>
                </>
              ) : (
                <>
                  <Wifi size={12} className="text-[#1e6641] shrink-0" />
                  <span className="hidden xs:inline sm:inline">Online</span>
                </>
              )}
            </button>

            {/* Prominent Demo Role Switcher */}
            <button
              onClick={switchRole}
              title="Click to switch role (Doctor / ASHA Health Worker / Patient)"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[11px] sm:text-xs text-gray-700 shadow-xs transition-all hover:border-[#1e6641]/50 cursor-pointer"
            >
              <span className="font-semibold text-[#1e6641] flex items-center gap-1">
                {isWorker ? '👩‍⚕️ ASHA' : isPatient ? '🧑 Patient' : '👨‍⚕️ Doctor'}
              </span>
              <RefreshCw size={10} className="text-gray-400 ml-0.5" />
            </button>

            {/* + New Patient (worker only, persistent CTA) */}
            {isWorker && (
              <Link
                to="/intake"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <UserPlus size={13} />
                New Patient
              </Link>
            )}

            {/* Dynamic Avatar + Active Name (Mobile & Desktop) */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-gray-200"
              title={isDisplayingPatient ? `Active Patient: ${displayName}` : displayName}
            >
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 shadow-xs ${
                isDisplayingPatient ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-300' : 'bg-[#e4efe7] text-[#1e6641]'
              }`}>
                {displayName.charAt(0) || 'P'}
              </div>
              <div className="hidden sm:block text-xs font-semibold text-gray-800 leading-tight truncate max-w-[120px] md:max-w-[160px]">
                {displayName}
              </div>
            </div>

            <button
              onClick={() => {
                clearAuthSession();
                navigate('/login');
              }}
              title="Sign out of this tab"
              className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Dynamic Offline / Auto-sync Banner */}
        {isOffline && (
          <div className="bg-amber-500 text-white text-xs font-medium px-4 py-1.5 border-t border-amber-600 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff size={13} className="shrink-0 animate-pulse" />
                <span className="text-[11px] sm:text-xs"><strong>Simulated Offline Mode:</strong> Records & intakes will be stored in local SQLite/IndexedDB queue and synced automatically on reconnection.</span>
              </div>
              <button
                type="button"
                onClick={toggleOffline}
                className="underline font-bold text-white hover:text-amber-100 ml-3 text-[11px] shrink-0 cursor-pointer"
              >
                Restore Online & Auto-Sync →
              </button>
            </div>
          </div>
        )}
        {syncMsg && (
          <div className="bg-[#1e6641] text-white text-xs font-medium px-4 py-1.5 flex items-center justify-center gap-2 transition-all">
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            <span>{syncMsg}</span>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* ── Mobile bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center justify-around py-2 px-2 shadow-lg">
        {isWorker ? (
          <>
            <Link to="/worker" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname === '/worker' ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <LayoutDashboard size={18} />
              <span>Tasks</span>
            </Link>
            <Link to="/intake" className="flex flex-col items-center text-[10px] font-medium text-[#1e6641]">
              <div className="w-8 h-8 rounded-full bg-[#1e6641] text-white flex items-center justify-center -mt-3 shadow-md">
                <UserPlus size={16} />
              </div>
              <span>Intake</span>
            </Link>
            <Link to="/followups" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname.startsWith('/followups') ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <AlertTriangle size={18} />
              <span>Alerts</span>
            </Link>
            <Link to="/patients" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname.startsWith('/patients') ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <Users size={18} />
              <span>Patients</span>
            </Link>
          </>
        ) : isPatient ? (
          <>
            <Link to={patientPortalUrl} className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname === '/patient' && (!location.search || location.search.includes('tab=OVERVIEW') || !location.search.includes('tab=')) ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <Users size={18} />
              <span>Portal</span>
            </Link>
            <Link to={`${patientPortalUrl}${patientPortalUrl.includes('?') ? '&' : '?'}tab=REFERRALS`} className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.search.includes('tab=REFERRALS') ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <HeartPulse size={18} />
              <span>Care Plans</span>
            </Link>
            <Link to={`${patientPortalUrl}${patientPortalUrl.includes('?') ? '&' : '?'}tab=CONDITIONS`} className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.search.includes('tab=CONDITIONS') ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <Clock size={18} />
              <span>Conditions</span>
            </Link>
            <Link to="/patients" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname.startsWith('/patients') ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <Building2 size={18} />
              <span>Directory</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <LayoutDashboard size={18} />
              <span>Home</span>
            </Link>
            <Link to="/queue" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname === '/queue' ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <Clock size={18} />
              <span>Queue</span>
            </Link>
            <Link to="/facilities" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname === '/facilities' ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <Building2 size={18} />
              <span>Clinic</span>
            </Link>
            <Link to="/patients" className={`flex flex-col items-center text-[10px] font-medium transition-colors ${location.pathname.startsWith('/patients') ? 'text-[#1e6641]' : 'text-gray-600 hover:text-[#1e6641]'}`}>
              <Users size={18} />
              <span>Patients</span>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
};

function RootRedirect() {
  const user = getAuthUser() || {};
  if (user.role === 'WORKER') return <Navigate to="/worker" replace />;
  if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  return <Navigate to="/dashboard" replace />;
}

function DoctorRouteGuard({ children }: { children: React.ReactNode }) {
  // Allow seamless navigation across portal sections without bounce redirects
  return <>{children}</>;
}

function WorkerRouteGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function PatientsRouteGuard() {
  return <Patients />;
}

function PatientProfileGuard() {
  return <PatientProfile />;
}

// ─── Root app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('spl_shown') === '1'
  );

  return (
    <>
      {!splashDone && (
        <SplashScreen onFinish={() => {
          sessionStorage.setItem('spl_shown', '1');
          setSplashDone(true);
        }} />
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard"         element={<DoctorRouteGuard><Dashboard /></DoctorRouteGuard>} />
            <Route path="/worker"            element={<WorkerRouteGuard><WorkerDashboard /></WorkerRouteGuard>} />
            <Route path="/patient"           element={<PatientDashboard />} />
            <Route path="/intake"            element={<WorkerRouteGuard><PatientIntakeFlow /></WorkerRouteGuard>} />
            <Route path="/referral-success"  element={<ReferralSuccess />} />
            <Route path="/followups"         element={<WorkerRouteGuard><CareGaps /></WorkerRouteGuard>} />
            <Route path="/patients"          element={<PatientsRouteGuard />} />
            <Route path="/patients/:id"      element={<PatientProfileGuard />} />
            <Route path="/queue"             element={<DoctorRouteGuard><Queue /></DoctorRouteGuard>} />
            <Route path="/facilities"        element={<DoctorRouteGuard><FacilityReadiness /></DoctorRouteGuard>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

