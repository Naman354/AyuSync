import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import InlineError from '../components/ui/InlineError';

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Booking Form State
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);

  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = () => {
    setShowBookingForm(true);
    if (patients.length === 0) api.get('/patients/search?q=').then(res => setPatients(res.data)).catch(console.error);
    if (doctors.length === 0) api.get('/auth/doctors').then(res => setDoctors(res.data)).catch(console.error);
    if (facilities.length === 0) api.get('/facilities').then(res => setFacilities(res.data.data || res.data || [])).catch(console.error);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const validateBooking = () => {
    const errors: Record<string, string> = {};
    if (!selectedPatient) errors.selectedPatient = 'Please select a patient.';
    if (!selectedDoctor) errors.selectedDoctor = 'Please select a doctor.';
    if (!selectedFacility) errors.selectedFacility = 'Please select a facility.';
    if (!date) errors.date = 'Date is required.';
    if (!bookingTime) errors.bookingTime = 'Time is required.';

    if (date && bookingTime) {
      const scheduledDate = new Date(`${date}T${bookingTime}:00`);
      if (isNaN(scheduledDate.getTime())) {
        errors.bookingTime = 'Please provide a valid time.';
      } else if (scheduledDate.getTime() < Date.now() - 5 * 60 * 1000) {
        errors.bookingTime = 'Appointment cannot be in the past.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBook = async () => {
    setModalError('');
    if (!validateBooking()) return;

    setBookingLoading(true);
    try {
      const scheduledAt = new Date(`${date}T${bookingTime}:00`).toISOString();
      await api.post('/appointments', {
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        facilityId: selectedFacility,
        scheduledAt
      });
      setShowBookingForm(false);
      setSelectedPatient('');
      setSelectedDoctor('');
      setSelectedFacility('');
      setBookingTime('');
      setFieldErrors({});
      await fetchAppointments();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const apptDate = new Date(a.scheduledAt).toISOString().split('T')[0];
    return apptDate === date;
  });

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
        <div className="flex gap-4 items-center">
          <Button variant="outline" onClick={fetchAppointments}>Refresh</Button>
          <input 
            type="date" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button onClick={openBookingModal}>Book Slot</Button>
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Book Appointment</h3>
            {modalError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {modalError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient *</label>
                <select
                  className={`w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#1e6641] focus:outline-none bg-white ${
                    fieldErrors.selectedPatient ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                  }`}
                  value={selectedPatient}
                  onChange={e => {
                    setSelectedPatient(e.target.value);
                    if (fieldErrors.selectedPatient) setFieldErrors(prev => ({ ...prev, selectedPatient: '' }));
                  }}
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id.slice(0,6)})</option>)}
                </select>
                {fieldErrors.selectedPatient && <p className="text-xs text-red-500 mt-1">{fieldErrors.selectedPatient}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor *</label>
                <select
                  className={`w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#1e6641] focus:outline-none bg-white ${
                    fieldErrors.selectedDoctor ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                  }`}
                  value={selectedDoctor}
                  onChange={e => {
                    setSelectedDoctor(e.target.value);
                    if (fieldErrors.selectedDoctor) setFieldErrors(prev => ({ ...prev, selectedDoctor: '' }));
                  }}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.phone || 'Doctor'} (ID: {d.id.slice(0,6)})</option>)}
                </select>
                {fieldErrors.selectedDoctor && <p className="text-xs text-red-500 mt-1">{fieldErrors.selectedDoctor}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Facility *</label>
                <select
                  className={`w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#1e6641] focus:outline-none bg-white ${
                    fieldErrors.selectedFacility ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                  }`}
                  value={selectedFacility}
                  onChange={e => {
                    setSelectedFacility(e.target.value);
                    if (fieldErrors.selectedFacility) setFieldErrors(prev => ({ ...prev, selectedFacility: '' }));
                  }}
                >
                  <option value="">Select Facility</option>
                  {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {fieldErrors.selectedFacility && <p className="text-xs text-red-500 mt-1">{fieldErrors.selectedFacility}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  className={`w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[#1e6641] focus:outline-none bg-white ${
                    fieldErrors.bookingTime ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                  }`}
                  value={bookingTime}
                  onChange={e => {
                    setBookingTime(e.target.value);
                    if (fieldErrors.bookingTime) setFieldErrors(prev => ({ ...prev, bookingTime: '' }));
                  }}
                />
                {fieldErrors.bookingTime && <p className="text-xs text-red-500 mt-1">{fieldErrors.bookingTime}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowBookingForm(false); setFieldErrors({}); setModalError(''); }}>Cancel</Button>
              <Button onClick={handleBook} disabled={bookingLoading} className="bg-[#1e6641] hover:bg-[#165032] text-white">
                {bookingLoading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <InlineError message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-gray-500 bg-gray-50 p-8 rounded-xl text-center border">
          No appointments found for this date. Try changing the date.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Facility</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appt) => (
                <tr key={appt.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    {appt.patient?.name || 'Unknown Patient'}
                  </td>
                  <td className="px-6 py-4">
                    {appt.doctor?.user?.phone || 'Assigned Doctor'}
                  </td>
                  <td className="px-6 py-4">
                    {appt.facility?.name || 'Unknown Facility'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      appt.status === 'BOOKED' ? 'bg-blue-100 text-blue-800' :
                      appt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Show all appointments count just for info */}
      <div className="mt-4 text-xs text-gray-400">
        Total appointments in database: {appointments.length} (Showing {filteredAppointments.length} for {date})
      </div>
    </div>
  );
}
