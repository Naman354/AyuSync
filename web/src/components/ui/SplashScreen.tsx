import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 600);
    const exitTimer = setTimeout(() => setPhase('exit'), 2000);
    const doneTimer = setTimeout(() => onFinish(), 2700);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1c3a28 0%, #2d6e4a 50%, #3d8a5c 100%)',
        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Decorative pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[520px] h-[520px] rounded-full border border-white/5" style={{ animation: 'spl-ring1 3s ease-in-out infinite' }} />
        <div className="absolute w-[380px] h-[380px] rounded-full border border-white/8" style={{ animation: 'spl-ring2 3s ease-in-out 0.4s infinite' }} />
        <div className="absolute w-[240px] h-[240px] rounded-full border border-white/10" style={{ animation: 'spl-ring3 3s ease-in-out 0.8s infinite' }} />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #cfb08d 0%, transparent 70%)', transform: 'translate(40%, -40%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #5e6e39 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      {/* Main content card */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8"
        style={{ animation: 'spl-in 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards', opacity: 0 }}
      >
        {/* Logo Icon */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 relative"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" style={{ animation: 'spl-ecg 1.2s ease-out 0.5s forwards', opacity: 0, strokeDasharray: 60, strokeDashoffset: 60 }} />
          </svg>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-3xl" style={{ animation: 'spl-pulse 2s ease-out 0.5s infinite' }} />
        </div>

        {/* Brand name */}
        <div className="text-4xl font-black tracking-tight text-white mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
          SwasthyaSetu
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-5" style={{ background: 'rgba(207,176,141,0.22)', color: '#cfb08d', border: '1px solid rgba(207,176,141,0.3)', letterSpacing: '0.18em' }}>
          AyuSync Platform
        </div>
        <p className="text-white/55 text-sm font-medium max-w-[260px] leading-relaxed">
          Closed-Loop Rural Healthcare &amp; Frontline Triage
        </p>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3" style={{ animation: 'spl-fadein 0.5s ease 0.8s forwards', opacity: 0 }}>
        <div className="w-44 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #cfb08d, #ffffff)', animation: 'spl-bar 1.5s cubic-bezier(0.4,0,0.2,1) 0.6s forwards', width: '0%' }} />
        </div>
        <span className="text-white/35 text-[10px] font-semibold tracking-widest uppercase">Connecting to Care Network</span>
      </div>

      <style>{`
        @keyframes spl-in {
          from { opacity: 0; transform: translateY(28px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spl-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spl-ring1 {
          0%,100% { transform: scale(1); opacity: 0.06; }
          50%     { transform: scale(1.04); opacity: 0.12; }
        }
        @keyframes spl-ring2 {
          0%,100% { transform: scale(1); opacity: 0.08; }
          50%     { transform: scale(1.06); opacity: 0.14; }
        }
        @keyframes spl-ring3 {
          0%,100% { transform: scale(1); opacity: 0.10; }
          50%     { transform: scale(1.08); opacity: 0.18; }
        }
        @keyframes spl-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.35); }
          70%  { box-shadow: 0 0 0 20px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes spl-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes spl-ecg {
          from { opacity: 0; stroke-dashoffset: 60; }
          to   { opacity: 1; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
