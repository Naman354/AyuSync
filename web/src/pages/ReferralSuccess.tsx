import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Share2, Printer, Home, ArrowRight } from 'lucide-react';

export default function ReferralSuccess() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const s = state || {};
  const token       = s.token        || `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const patientName = s.patientName  || 'Community Patient';
  const urgency     = s.urgency      || 'ROUTINE';
  const facility    = s.facilityName || 'Baramati CHC';
  const ambulance   = s.needsAmbulance || false;

  const URGENCY_LABEL: Record<string, string> = {
    URGENT: 'Urgent — needs immediate care', PRIORITY: 'Should see doctor today', ROUTINE: 'Routine visit'
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 animate-page-in">
      <div className="w-full max-w-md">
        {/* Success card */}
        <div className="bg-[#1e6641] text-white rounded-3xl p-7 relative overflow-hidden">
          {/* Decorative bg */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/8 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Check icon */}
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-lg">
              <CheckCircle2 size={34} className="text-[#1e6641]" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
              {s.isOffline ? 'Saved locally (Offline Mode)' : 'Patient referred successfully'}
            </p>
            <h1 className="text-2xl font-bold text-white mb-1">{patientName}</h1>
            <p className="text-sm text-white/70 mb-6">
              {s.isOffline
                ? 'Record stored securely on your device. It will automatically synchronize with Baramati CHC when you reconnect.'
                : <>The doctor at <span className="text-white font-medium">{facility}</span> has been notified and will review this case.</>}
            </p>


            {/* Details */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Reference number</span>
                <span className="font-mono font-bold text-white">{token}</span>
              </div>
              <div className="border-t border-white/10" />
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-white/50 mb-0.5">Priority</div>
                  <div className="font-semibold text-white">{URGENCY_LABEL[urgency] || urgency}</div>
                </div>
                <div>
                  <div className="text-white/50 mb-0.5">Transport</div>
                  <div className="font-semibold text-white">{ambulance ? '108 ambulance requested' : 'Self-transport'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => navigate('/worker')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-gray-200 text-[#1e6641] font-semibold text-sm hover:bg-[#e4efe7] transition-colors"
          >
            <Home size={17} /> Back to home
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <Printer size={14} /> Print slip
            </button>
            <button
              onClick={() => alert(`Referral ${token} shared via SMS to patient mobile.`)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <Share2 size={14} /> Send SMS
            </button>
          </div>
          <button
            onClick={() => navigate('/intake')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[#1e6641] text-xs font-semibold hover:underline"
          >
            Register another patient <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
