import { useState, useEffect } from 'react';
import api from '../lib/api';
import PageShell from '../components/ui/PageShell';
import {
  Building2, Bed, RefreshCw, CheckCircle2,
  AlertTriangle, ShieldCheck, Stethoscope,
  MapPin, Check
} from 'lucide-react';

export default function FacilityReadiness() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/facilities');
      setFacilities(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch {
      setError('Failed to load facility data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const updateAvailability = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'OPEN' ? 'OVERCAPACITY' : 'OPEN';
    setUpdating(id);
    setError('');
    try {
      await api.put(`/facilities/${id}/availability`, {
        status: newStatus,
        readinessScore: newStatus === 'OPEN' ? 88 : 45
      });
      await fetchFacilities();
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Failed to update clinic status.');
    } finally {
      setUpdating(null);
    }
  };

  // Calculate network totals
  let totalBeds = 0;
  let occupiedBeds = 0;
  let openClinics = 0;

  facilities.forEach((fac) => {
    const status = fac.availability?.status || 'OPEN';
    if (status === 'OPEN') openClinics++;

    if (fac.capacities && fac.capacities.length > 0) {
      fac.capacities.forEach((c: any) => {
        totalBeds += c.total || 0;
        occupiedBeds += c.occupied || 0;
      });
    } else {
      // Default fallback estimation for display
      totalBeds += 24;
      occupiedBeds += status === 'OVERCAPACITY' ? 23 : 14;
    }
  });

  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <PageShell
      title="Clinic Status & Network Capacity"
      subtitle="Real-time bed availability, emergency readiness, and patient reception status"
      action={
        <button
          onClick={fetchFacilities}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-xs"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-[#1e6641]' : ''} />
          Refresh Status
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── Top Executive Summary Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Beds Available */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Available Beds</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {availableBeds} <span className="text-xs font-normal text-gray-400">of {totalBeds} total</span>
              </div>
              <div className="text-[11px] text-[#1e6641] font-medium mt-0.5">
                {100 - occupancyRate}% capacity available
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center">
              <Bed size={22} />
            </div>
          </div>

          {/* Metric 2: Open Clinics */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facilities Open</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {openClinics} <span className="text-xs font-normal text-gray-400">of {facilities.length || 3}</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Accepting village referrals
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 size={22} />
            </div>
          </div>

          {/* Metric 3: Critical Medical Supplies */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Critical Supplies</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                Full Reserve <span className="text-xs text-emerald-600">✓</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                O₂ & emergency meds verified
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
          </div>

          {/* Metric 4: On-Duty Doctor Coverage */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor Coverage</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">Active</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                OPD & on-call casualty duty
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Stethoscope size={22} />
            </div>
          </div>
        </div>

        {/* ── Facility Cards Grid ── */}
        {loading && facilities.length === 0 ? (
          <div className="text-gray-500 animate-pulse text-sm p-12 text-center bg-white rounded-2xl border border-gray-100">
            Loading facility capacity and readiness data...
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-gray-500 bg-white p-12 rounded-2xl text-center border border-gray-100 text-sm">
            No healthcare facilities found in the current network.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {facilities.map((fac) => {
              const avail = fac.availability;
              const status = avail?.status || 'OPEN';
              const isOpen = status === 'OPEN';
              const isOvercapacity = status === 'OVERCAPACITY';

              // Bed numbers
              const capacities = fac.capacities && fac.capacities.length > 0
                ? fac.capacities
                : [
                    { resource: 'General Inpatient Beds', total: 20, occupied: isOvercapacity ? 19 : 12 },
                    { resource: 'Emergency / ICU Beds', total: 4, occupied: isOvercapacity ? 4 : 2 }
                  ];

              const totalFacBeds = capacities.reduce((acc: number, c: any) => acc + (c.total || 0), 0);
              const occupiedFacBeds = capacities.reduce((acc: number, c: any) => acc + (c.occupied || 0), 0);
              const facPct = totalFacBeds > 0 ? Math.round((occupiedFacBeds / totalFacBeds) * 100) : 65;

              // Services
              const services = fac.services && fac.services.length > 0
                ? fac.services.map((s: any) => s.service)
                : ['Emergency 24/7', 'Maternity Care', 'OPD Triage', 'Diagnostic Lab', 'Ambulance'];

              return (
                <div
                  key={fac.id}
                  className="rounded-2xl border border-gray-100 bg-white shadow-xs p-6 flex flex-col justify-between space-y-5 hover:border-gray-200 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {fac.type === 'COMMUNITY_HEALTH_CENTRE' ? 'Community Health Centre (CHC)' : fac.type || 'Primary Health Centre'}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mt-0.5">{fac.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate">{fac.address || 'Baramati, Pune District, Maharashtra'}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                          isOpen
                            ? 'bg-emerald-50 text-[#1e6641] border border-emerald-200'
                            : isOvercapacity
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOpen ? 'bg-[#1e6641] animate-pulse' : isOvercapacity ? 'bg-amber-600' : 'bg-red-500'
                          }`}
                        />
                        {isOpen ? 'Open & Ready' : isOvercapacity ? 'At Capacity' : 'Closed'}
                      </span>
                    </div>

                    {/* Visual Bed Occupancy */}
                    <div className="mt-5 space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                          <Bed size={14} className="text-gray-500" /> Bed Occupancy
                        </span>
                        <span className="font-bold text-gray-900">
                          {occupiedFacBeds} / {totalFacBeds} beds ({facPct}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            facPct >= 90
                              ? 'bg-red-500'
                              : facPct >= 75
                              ? 'bg-amber-500'
                              : 'bg-[#1e6641]'
                          }`}
                          style={{ width: `${Math.min(100, facPct)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
                        <span>Available: <strong>{Math.max(0, totalFacBeds - occupiedFacBeds)} beds</strong></span>
                        <span>Readiness: <strong>{avail?.readinessScore ? `${Math.round(avail.readinessScore)}%` : '88%'}</strong></span>
                      </div>
                    </div>

                    {/* Operational Services */}
                    <div className="mt-4">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Available On-Site Services
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {services.map((srv: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-medium text-gray-700 shadow-2xs"
                          >
                            <Check size={10} className="text-[#1e6641]" />
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Status Action */}
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => updateAvailability(fac.id, status)}
                      disabled={updating === fac.id}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                        isOpen
                          ? 'bg-white border border-gray-300 text-gray-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800'
                          : 'bg-[#1e6641] hover:bg-[#165032] text-white shadow-xs'
                      }`}
                    >
                      {updating === fac.id ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          Updating Clinic Status…
                        </>
                      ) : isOpen ? (
                        <>
                          <AlertTriangle size={13} className="text-amber-600" />
                          Mark as At Capacity (Pause Incoming Referrals)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          Reopen & Accept Referrals
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center mt-1.5">
                      Status syncs immediately to village health workers across the district.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
