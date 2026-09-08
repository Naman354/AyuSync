import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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

// ─── Protected shell ─────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const token = localStorage.getItem('ayusync_token');
  const location = useLocation();
  const navigate = useNavigate();
  const { isOffline, toggleOffline } = useNetworkStatus();

  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('ayusync_user') || '{}');
    } catch {
      return {};
    }
  });

  // Automatically derive active role from current URL path or stored user
  const getRoleFromPath = (path: string): string => {
    if (path.startsWith('/worker') || path.startsWith('/intake') || path.startsWith('/followups')) return 'WORKER';
    if (path.startsWith('/patient')) return 'PATIENT';
    if (path.startsWith('/dashboard') || path.startsWith('/queue') || path.startsWith('/facilities')) return 'DOCTOR';
    return user.role || 'DOCTOR';
  };

  const currentRole = getRoleFromPath(location.pathname);

  // Synchronize localStorage and user state when role/route changes
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
      if (stored.role !== currentRole && !location.pathname.startsWith('/patients')) {
        let name = stored.name;
        if (currentRole === 'DOCTOR') name = 'Dr. Rajesh Deshmukh';
        else if (currentRole === 'WORKER') name = 'Sunita Patil';
        else if (currentRole === 'PATIENT') name = 'Ramesh Kulkarni';

        const updated = { ...stored, role: currentRole, name };
        localStorage.setItem('ayusync_user', JSON.stringify(updated));
        setUser(updated);
      } else {
        setUser(stored);
      }
    } catch {}
  }, [location.pathname, currentRole]);

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

  const isWorker = currentRole === 'WORKER';
  const isPatient = currentRole === 'PATIENT';

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
      newName = 'Ramesh Kulkarni';
      patientId = patientId || 'pat-ramesh-kulkarni';
      targetPath = '/patient';
    } else {
      newRole = 'DOCTOR';
      newName = 'Dr. Rajesh Deshmukh';
      targetPath = '/dashboard';
    }

    const updated = { ...user, role: newRole, name: newName, patientId };
    localStorage.setItem('ayusync_user', JSON.stringify(updated));
    setUser(updated);
    navigate(targetPath, { replace: true });
  };

  const isDoctor = !isWorker && !isPatient;
  const displayName = isDoctor
    ? (user.name && (user.name.startsWith('Dr') || user.name.includes('Deshmukh') || user.name.includes('Joshi')) ? user.name : 'Dr. Rajesh Deshmukh')
    : isWorker
    ? (user.name && !user.name.includes('Dr') ? user.name : 'Sunita Patil')
    : (user.name && !user.name.includes('Dr') ? user.name : 'Ramesh Kulkarni');

  return (
    <div className="min-h-screen bg-[#f8f7f3] font-sans text-gray-900">
      {/* ── Top navigation bar ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 gap-4">

          {/* Brand */}
          <Link to={isWorker ? '/worker' : isPatient ? '/patient' : '/dashboard'} className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-[#1e6641] text-white flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <HeartPulse size={18} strokeWidth={2} />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-gray-900 leading-tight">SwasthyaSetu</div>
              <div className="text-[10px] text-gray-400 leading-tight">AyuSync · Baramati CHC</div>
            </div>
          </Link>

          {/* Role-aware navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-1 ml-6">
            {isWorker ? (
              <>
                <NavLink to="/worker" exact><LayoutDashboard size={15} />Home & Tasks</NavLink>
                <NavLink to="/patients"><Users size={15} />Community Members</NavLink>
                <NavLink to="/followups"><AlertTriangle size={15} />Care Gap Alerts</NavLink>
              </>
            ) : isPatient ? (
              <>
                <NavLink to="/patient" exact><Users size={15} />My Health Portal</NavLink>
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
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Realistic Offline/Online Simulation Toggle */}
            <button
              type="button"
              onClick={toggleOffline}
              title={isOffline ? 'Click to restore Online mode (auto-flushes local queue)' : 'Click to simulate Offline mode'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                isOffline
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-emerald-50 border-emerald-200 text-[#1e6641] hover:bg-emerald-100'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff size={12} className="text-amber-600 animate-pulse shrink-0" />
                  <span>Offline (Simulated)</span>
                </>
              ) : (
                <>
                  <Wifi size={12} className="text-[#1e6641] shrink-0" />
                  <span>Online</span>
                </>
              )}
            </button>

            {/* Prominent Demo Role Switcher */}
            <button
              onClick={switchRole}
              title="Click to switch role (Doctor / ASHA Health Worker / Patient)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs text-gray-700 shadow-xs transition-all hover:border-[#1e6641]/50 cursor-pointer"
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

            {/* Avatar + name */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-bold text-xs">
                {displayName.charAt(0)}
              </div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">
                {displayName}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('ayusync_token');
                localStorage.removeItem('ayusync_user');
                window.location.href = '/login';
              }}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Offline / Auto-sync Banner */}
        {isOffline && (
          <div className="bg-amber-500 text-white text-xs font-medium px-4 py-1.5 border-t border-amber-600 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff size={13} className="shrink-0 animate-pulse" />
                <span><strong>Simulated Offline Mode:</strong> Records & intakes will be stored in local SQLite/IndexedDB queue and synced automatically on reconnection.</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* ── Mobile bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-2 shadow-lg">
        {isWorker ? (
          <>
            <Link to="/worker" className="flex flex-col items-center text-[10px] font-medium text-gray-600 hover:text-[#1e6641]">
              <LayoutDashboard size={18} />
              <span>Tasks</span>
            </Link>
            <Link to="/intake" className="flex flex-col items-center text-[10px] font-medium text-[#1e6641]">
              <div className="w-8 h-8 rounded-full bg-[#1e6641] text-white flex items-center justify-center -mt-3 shadow-md">
                <UserPlus size={16} />
              </div>
              <span>Intake</span>
            </Link>
            <Link to="/followups" className="flex flex-col items-center text-[10px] font-medium text-gray-600 hover:text-[#1e6641]">
              <AlertTriangle size={18} />
              <span>Alerts</span>
            </Link>
            <Link to="/patients" className="flex flex-col items-center text-[10px] font-medium text-gray-600 hover:text-[#1e6641]">
              <Users size={18} />
              <span>Patients</span>
            </Link>
          </>
        ) : isPatient ? (
          <>
            <Link to="/patient" className="flex flex-col items-center text-[10px] font-medium text-[#1e6641]">
              <Users size={18} />
              <span>My Portal</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="flex flex-col items-center text-[10px] font-medium text-gray-600 hover:text-[#1e6641]">
              <LayoutDashboard size={18} />
              <span>Home</span>
            </Link>
            <Link to="/queue" className="flex flex-col items-center text-[10px] font-medium text-[#1e6641]">
              <Clock size={18} />
              <span>Queue</span>
            </Link>
            <Link to="/facilities" className="flex flex-col items-center text-[10px] font-medium text-gray-600 hover:text-[#1e6641]">
              <Building2 size={18} />
              <span>Clinic</span>
            </Link>
            <Link to="/patients" className="flex flex-col items-center text-[10px] font-medium text-gray-600 hover:text-[#1e6641]">
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
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  if (user.role === 'WORKER') return <Navigate to="/worker" replace />;
  if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  return <Navigate to="/dashboard" replace />;
}

function DoctorRouteGuard({ children }: { children: React.ReactNode }) {
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  if (user.role === 'WORKER') return <Navigate to="/worker" replace />;
  return <>{children}</>;
}

function WorkerRouteGuard({ children }: { children: React.ReactNode }) {
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  if (user.role === 'PATIENT') return <Navigate to="/patient" replace />;
  return <>{children}</>;
}

function PatientsRouteGuard() {
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  if (user.role === 'PATIENT') {
    return <Navigate to="/patient" replace />;
  }
  return <Patients />;
}

function PatientProfileGuard() {
  const user = JSON.parse(localStorage.getItem('ayusync_user') || '{}');
  if (user.role === 'PATIENT') {
    return <Navigate to="/patient" replace />;
  }
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
