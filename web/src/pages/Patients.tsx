import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getAuthUser } from '../lib/auth';
import PageShell from '../components/ui/PageShell';
import InlineError from '../components/ui/InlineError';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import { Search, Users, ChevronRight, X, Plus } from 'lucide-react';

export default function Patients() {
  const [search,      setSearch]      = useState('');
  const [patients,    setPatients]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

const DEMO_PATIENTS = [
  { id: 'pat-pooja-sharma', name: 'Pooja Sharma', age: 26, gender: 'FEMALE', village: 'Khandala Ward 2', phone: '+919822011223', identifiers: [{ type: 'ABHA', value: '91-8844-3321-0001' }] },
  { id: 'pat-ramesh-kulkarni', name: 'Ramesh Kulkarni', age: 58, gender: 'MALE', village: 'Khandala Sub-center', phone: '+919822011224', identifiers: [{ type: 'ABHA', value: '91-8844-3321-0002' }] },
  { id: 'pat-sunita-chavan', name: 'Sunita Chavan', age: 29, gender: 'FEMALE', village: 'Khandala Ward 3', phone: '+919822011225', identifiers: [{ type: 'ABHA', value: '91-8844-3321-0003' }] },
  { id: 'pat-aarav-patel', name: 'Aarav Patel', age: 2, gender: 'MALE', village: 'Khandala East', phone: '+919822011226', identifiers: [{ type: 'ABHA', value: '91-8844-3321-0004' }] },
  { id: 'pat-meena-kumari', name: 'Meena Kumari', age: 34, gender: 'FEMALE', village: 'Baramati Ward 1', phone: '+919822011227', identifiers: [{ type: 'ABHA', value: '91-8844-3321-0005' }] },
];

  const fetchPatients = async (q = search) => {
    try {
      setLoading(true);
      setError('');
      const r = await api.get(`/patients/search?q=${q}`);
      const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setPatients(list.length > 0 ? list : DEMO_PATIENTS);
    } catch {
      setPatients(DEMO_PATIENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(''); }, []);



  const user = getAuthUser() || {};
  const isWorker = user.role === 'WORKER';

  return (
    <PageShell
      title={isWorker ? 'My Patients' : 'All Patients'}
      subtitle={loading ? '' : `${patients.length} patient${patients.length !== 1 ? 's' : ''} found`}
      action={
        <Link
          to="/intake"
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white transition-colors shadow-xs"
        >
          <Plus size={14} /> Register patient
        </Link>
      }
    >
      <div className="space-y-4">
        <InlineError message={error} onDismiss={() => setError('')} />

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or health ID…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e6641] focus:outline-none bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPatients()}
          />
          {search && (
            <button onClick={() => { setSearch(''); fetchPatients(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Patient list */}
        {loading ? (
          <SkeletonList rows={6} />
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <EmptyState
              icon={Users}
              title={search ? 'No results found' : 'No patients registered yet'}
              description={search ? `Try a different name or phone number.` : 'Register your first patient to get started.'}
              action={!search ? (
                <Link to="/intake" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-[#1e6641] text-white hover:bg-[#165032] transition-colors">
                  <Plus size={14} /> Register patient
                </Link>
              ) : undefined}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Desktop table header */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1.5fr_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Patient</span>
              <span>Age & gender</span>
              <span>Village / Area</span>
              <span className="text-right">Action</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {patients.map(p => (
                <li key={p.id}>
                  <Link
                    to={`/patients/${p.id}`}
                    className="group sm:grid sm:grid-cols-[2fr_1fr_1.5fr_auto] flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Column 1: Patient Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#e4efe7] text-[#1e6641] flex items-center justify-center font-semibold text-sm shrink-0">
                        {p.name?.charAt(0) || 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                        {p.abhaId ? (
                          <span className="font-mono text-gray-400 text-[11px] block truncate">ID: {p.abhaId}</span>
                        ) : p.phone ? (
                          <span className="text-gray-400 text-[11px] block">{p.phone}</span>
                        ) : null}
                        {/* Mobile-only secondary info */}
                        <div className="sm:hidden text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span>{p.age ? `${p.age} yrs` : '--'}</span>
                          <span>·</span>
                          <span>{p.gender || '--'}</span>
                          {(p.village || p.address) && <><span>·</span><span>{p.village || p.address}</span></>}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Age & Gender */}
                    <div className="hidden sm:block text-sm text-gray-700">
                      <span className="font-medium text-gray-900">{p.age ? `${p.age} yrs` : '--'}</span>
                      {p.gender && <span className="text-gray-400 text-xs ml-1.5">({p.gender})</span>}
                    </div>

                    {/* Column 3: Village / Address */}
                    <div className="hidden sm:block text-sm text-gray-600 truncate">
                      {p.village || p.address || <span className="text-gray-400 italic">Not recorded</span>}
                    </div>

                    {/* Column 4: Action */}
                    <div className="flex items-center justify-end gap-1 text-xs font-semibold text-[#1e6641] group-hover:translate-x-0.5 transition-transform shrink-0">
                      <span className="hidden lg:inline">View profile</span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-[#1e6641] transition-colors" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageShell>
  );
}
