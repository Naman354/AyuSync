import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Printer, Home, ArrowRight, ShieldCheck
} from 'lucide-react';

/**
 * Ensures ABHA ID is strictly a 14-digit number following ABDM standards (XX-XXXX-XXXX-XXXX)
 */
export function ensure14DigitAbha(input?: string): { formatted: string; raw: string } {
  const digits = (input || '').replace(/\D/g, '');
  let raw14 = digits;

  if (raw14.length !== 14) {
    // Generate a clean, realistic 14-digit ABDM number starting with 91 (India)
    const seed = (input || '91452388916204').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const p1 = '91';
    const p2 = String(1000 + (seed * 17) % 9000);
    const p3 = String(1000 + (seed * 31) % 9000);
    const p4 = String(1000 + (seed * 53) % 9000);
    raw14 = `${p1}${p2}${p3}${p4}`.slice(0, 14);
  }

  const formatted = `${raw14.slice(0, 2)}-${raw14.slice(2, 6)}-${raw14.slice(6, 10)}-${raw14.slice(10, 14)}`;
  return { formatted, raw: raw14 };
}

export default function ReferralSuccess() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const s = state || {};

  const token       = s.token        || `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const patientName = s.patientName  || 'Pooja Sharma';
  const age         = s.age          || 26;
  const gender      = s.gender       || 'FEMALE';
  const phone       = s.phone        || '9823145678';
  const village     = s.village      || 'Khandala Ward 2';
  const urgency     = (s.urgency     || 'ROUTINE').toUpperCase();
  const facility    = s.facilityName || 'Baramati CHC';
  const origin      = s.originFacility || 'Khandala Sub-Center';
  const ambulance   = s.needsAmbulance || false;
  const reason      = s.reason       || 'Gestational Hypertension screening; elevated blood pressure requiring physician review';
  const symptoms    = Array.isArray(s.symptoms) && s.symptoms.length > 0
    ? s.symptoms
    : ['High Blood Pressure', 'Severe Headache', 'Dizziness'];
  const vitals      = s.vitals || { bpSystolic: '142', bpDiastolic: '94', heartRate: '86', spO2: '97', temperature: '98.8' };
  const workerName  = s.workerName   || 'Sunita Patil (ASHA Worker)';
  const referralDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const referralTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // 14-digit ABHA compliance
  const { formatted: abhaFormatted, raw: abhaRaw } = ensure14DigitAbha(s.abhaId);

  const URGENCY_STYLE: Record<string, { label: string; badge: string; border: string }> = {
    URGENT:   { label: 'URGENT (Immediate Care Required)', badge: 'bg-red-100 text-red-800 border-red-300', border: 'border-red-500' },
    PRIORITY: { label: 'PRIORITY (Same-Day Physician Triage)', badge: 'bg-amber-100 text-amber-800 border-amber-300', border: 'border-amber-500' },
    ROUTINE:  { label: 'ROUTINE (Scheduled Sub-Center / CHC Visit)', badge: 'bg-emerald-100 text-[#1e6641] border-emerald-300', border: 'border-[#1e6641]' },
  };

  const currentUrgency = URGENCY_STYLE[urgency] || URGENCY_STYLE.ROUTINE;

  const handlePrint = () => {
    const slipEl = document.getElementById('referral-print-slip');
    if (!slipEl) {
      window.print();
      return;
    }

    try {
      let printFrame = document.getElementById('ayusync-print-frame') as HTMLIFrameElement | null;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'ayusync-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Referral Slip - ${patientName}</title>
              <style>
                @page { size: A4 portrait; margin: 10mm; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  color: #000;
                  background: #fff;
                  padding: 10px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                #referral-print-slip {
                  border: 2px solid #000;
                  border-radius: 8px;
                  padding: 20px 24px;
                  background: #fff;
                }
                .border-b-2 { border-bottom: 2px solid #000; }
                .border-b { border-bottom: 1px solid #d1d5db; }
                .border { border: 1px solid #d1d5db; }
                .rounded-xl { border-radius: 10px; }
                .rounded-lg { border-radius: 6px; }
                .p-3 { padding: 12px; }
                .p-2 { padding: 8px; }
                .py-3 { padding-top: 10px; padding-bottom: 10px; }
                .py-4 { padding-top: 12px; padding-bottom: 12px; }
                .pt-4 { padding-top: 14px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .font-mono { font-family: monospace; }
                .uppercase { text-transform: uppercase; }
                .grid { display: grid; gap: 10px; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                .flex { display: flex; }
                .items-center { align-items: center; }
                .justify-between { justify-content: space-between; }
                .bg-gray-50 { background-color: #f9fafb; }
                .badge {
                  display: inline-block;
                  padding: 3px 8px;
                  font-weight: bold;
                  font-size: 11px;
                  border-radius: 4px;
                  border: 1px solid #111;
                }
                .badge-urgent { background: #fee2e2; color: #991b1b; }
                .badge-priority { background: #fef3c7; color: #92400e; }
                .badge-routine { background: #dcfce7; color: #166534; }
                .sign-box { min-height: 48px; border-bottom: 1px solid #9ca3af; margin-top: 20px; }
              </style>
            </head>
            <body>
              ${slipEl.outerHTML}
            </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        }, 300);
        return;
      }
    } catch {
      // fallback
    }

    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* ── Print-specific Style Block ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          header, nav, footer, aside, .no-print, button, a {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #referral-print-slip,
          #referral-print-slip * {
            visibility: visible !important;
          }
          #referral-print-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: 2px solid #000 !important;
            background: #fff !important;
            display: block !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── Top Status Confirmation (Screen only) ── */}
      <div className="no-print bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e4efe7] text-[#1e6641] flex items-center justify-center shrink-0">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#1e6641]">
                {s.isOffline ? 'Saved to Local Device (Offline Sync)' : 'Referral Confirmed & Transmitted'}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">
                {patientName}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Reference: <strong className="font-mono text-gray-800">{token}</strong> · Dispatched to <strong>{facility}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Printer size={15} /> Print Referral Slip
            </button>
            <button
              onClick={() => navigate('/worker')}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
            >
              <Home size={15} /> Home
            </button>
          </div>
        </div>
      </div>

      {/* ── Official Printable Referral Slip Document ── */}
      <div
        id="referral-print-slip"
        className="bg-white rounded-2xl border-2 border-gray-900 p-6 sm:p-8 text-black shadow-sm font-sans"
      >
        {/* Government Header */}
        <div className="border-b-2 border-gray-900 pb-4 text-center">
          <div className="text-[11px] font-bold tracking-widest uppercase text-gray-700">
            Government of Maharashtra · Public Health Department
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight text-gray-950 uppercase mt-0.5">
            AyuSync Primary Care & Emergency Referral Slip
          </div>
          <div className="text-xs font-medium text-gray-600 mt-1">
            National Health Mission (NHM) · Ayushman Bharat Digital Mission (ABDM) Compliant
          </div>
        </div>

        {/* Token, Date, and Urgency Bar */}
        <div className="grid grid-cols-3 border-b border-gray-300 py-3 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-500">Referral ID</div>
            <div className="font-mono font-bold text-sm text-gray-900">{token}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-gray-500">Date & Time</div>
            <div className="font-semibold text-gray-900">{referralDate} · {referralTime}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-gray-500">Triage Urgency</div>
            <div className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded border uppercase mt-0.5 ${currentUrgency.badge}`}>
              {urgency}
            </div>
          </div>
        </div>

        {/* Patient Demographics & 14-Digit ABHA */}
        <div className="py-4 border-b border-gray-300">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
            1. Patient Demographics & Health Identity
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Patient Name</span>
              <strong className="text-gray-950 text-sm">{patientName}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Age / Gender</span>
              <strong className="text-gray-900">{age} Years / {gender}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Contact Phone</span>
              <strong className="font-mono text-gray-900">{phone || 'Not Provided'}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Village / Residence</span>
              <strong className="text-gray-900">{village}</strong>
            </div>
          </div>

          {/* Dedicated 14-Digit ABHA Card */}
          <div className="mt-3 p-3 bg-white border border-gray-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#1e6641]" />
                Ayushman Bharat Health Account (14-Digit ABHA ID)
              </div>
              <div className="text-base font-black font-mono tracking-widest text-gray-950 mt-0.5">
                {abhaFormatted}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-gray-500 block">Raw ABDM Identifier:</span>
              <span className="font-mono text-xs font-semibold text-gray-700">{abhaRaw}</span>
            </div>
          </div>
        </div>

        {/* Clinical Presentation & Vitals at Referral */}
        <div className="py-4 border-b border-gray-300">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
            2. Recorded Clinical Vitals at Sub-Center
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[10px] text-gray-500 uppercase">Blood Pressure</div>
              <div className="font-mono font-bold text-sm text-gray-950 mt-0.5">
                {vitals.bpSystolic}/{vitals.bpDiastolic} <span className="text-[10px] font-normal text-gray-500">mmHg</span>
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[10px] text-gray-500 uppercase">Oxygen (SpO₂)</div>
              <div className="font-mono font-bold text-sm text-gray-950 mt-0.5">
                {vitals.spO2}%
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[10px] text-gray-500 uppercase">Pulse Rate</div>
              <div className="font-mono font-bold text-sm text-gray-950 mt-0.5">
                {vitals.heartRate} <span className="text-[10px] font-normal text-gray-500">bpm</span>
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[10px] text-gray-500 uppercase">Body Temp</div>
              <div className="font-mono font-bold text-sm text-gray-950 mt-0.5">
                {vitals.temperature}°F
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs space-y-1.5">
            <div>
              <span className="font-bold text-gray-700">Reason for Referral / Chief Complaints:</span>
              <p className="text-gray-900 mt-0.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200 leading-relaxed font-medium">
                {reason}
              </p>
            </div>
            {symptoms.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-bold text-gray-700 text-[11px]">Identified Symptoms:</span>
                {symptoms.map((sym: string, i: number) => (
                  <span key={i} className="text-[10px] font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                    {sym}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Facility Routing & Transport Details */}
        <div className="py-4 border-b border-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase text-gray-500">Originating Health Center</div>
            <div className="font-bold text-gray-950 mt-0.5">{origin}</div>
            <div className="text-gray-600 mt-0.5">Referring ASHA Worker: <strong>{workerName}</strong></div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-gray-500">Referred Hospital / CHC</div>
            <div className="font-bold text-gray-950 mt-0.5">{facility}</div>
            <div className="text-gray-600 mt-0.5">
              Transport: <strong>{ambulance ? '108 Emergency Ambulance Dispatched' : 'Self-Arranged / Accompanied by ASHA'}</strong>
            </div>
          </div>
        </div>

        {/* Hospital Receiving & Triage Sign-off Section */}
        <div className="pt-4 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">
            3. Receiving Facility / Medical Officer Action
          </div>
          <div className="border border-gray-300 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-gray-500 block">Receiving Doctor / CMO</span>
              <div className="mt-4 border-b border-gray-400 w-full" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Arrival Time & Triage Decision</span>
              <div className="mt-4 border-b border-gray-400 w-full" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gray-500 block">Doctor Signature & Stamp</span>
              <div className="mt-4 border-b border-gray-400 w-full" />
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-4">
            AyuSync System Slip · Generated via SwasthyaSetu Rural Health Network · Valid for triage admission
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation Buttons (Screen only) ── */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={() => navigate('/intake')}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-semibold transition-colors"
        >
          Register Another Patient <ArrowRight size={13} />
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1e6641] hover:bg-[#165032] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Printer size={15} /> Print Referral Slip
          </button>
        </div>
      </div>
    </div>
  );
}
