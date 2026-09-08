import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';
import {
  AlertTriangle, ArrowRight, CheckCircle2, Phone, Search
} from 'lucide-react';

interface GuidanceItem {
  id: string;
  category: 'VITALS' | 'MATERNAL' | 'PEDIATRIC' | 'EMERGENCY' | 'ACTIONS';
  title: string;
  normalRange?: string;
  cautionRange?: string;
  redFlag: string;
  actionRequired: string;
  urgencyLevel: 'ROUTINE' | 'PRIORITY' | 'URGENT';
}

const HIGH_VALUE_GUIDANCE: GuidanceItem[] = [
  // ── 1. Standard Reference Metrics ──
  {
    id: 'vital-bp',
    category: 'VITALS',
    title: 'Blood Pressure (BP)',
    normalRange: '< 120 / 80 mmHg',
    cautionRange: '120–139 / 80–89 mmHg (Pre-hypertension)',
    redFlag: '≥ 140/90 mmHg (≥ 160/100 mmHg is hypertensive emergency; in pregnancy, ≥ 140/90 mmHg indicates Pre-Eclampsia)',
    actionRequired: 'If systolic ≥ 140 or diastolic ≥ 90 in pregnancy, refer immediately to Baramati CHC. If non-pregnant adult, advise salt restriction and re-check in 7 days.',
    urgencyLevel: 'URGENT',
  },
  {
    id: 'vital-spo2',
    category: 'VITALS',
    title: 'Oxygen Saturation (SpO₂)',
    normalRange: '≥ 95% on room air',
    cautionRange: '91%–94% (Mild Hypoxia: rest in upright sitting position, re-check in 10 mins)',
    redFlag: '< 90% at rest (Severe Hypoxia / Respiratory Distress)',
    actionRequired: 'Immediate referral to CHC. Request 108 emergency ambulance. Keep patient seated upright and calm.',
    urgencyLevel: 'URGENT',
  },
  {
    id: 'vital-pulse',
    category: 'VITALS',
    title: 'Pulse / Heart Rate',
    normalRange: '60–100 beats per minute (bpm) at rest',
    cautionRange: '100–120 bpm (Mild Tachycardia: assess for fever, anxiety, or pain)',
    redFlag: '> 120 bpm persistent or < 50 bpm accompanied by dizziness / cold sweats',
    actionRequired: 'Assess for severe infection, dehydration, or cardiac arrhythmia. Escalate for physician review.',
    urgencyLevel: 'PRIORITY',
  },
  {
    id: 'vital-temp',
    category: 'VITALS',
    title: 'Body Temperature',
    normalRange: '97.5°F–99.0°F (36.4°C–37.2°C)',
    cautionRange: '99.1°F–101.0°F (Mild to moderate fever)',
    redFlag: '> 102.0°F persistent, or ANY fever in infants under 2 months',
    actionRequired: 'Any infant < 2 months with fever is a medical emergency — transfer to CHC immediately. For children 2–60 months, initiate sponge cooling and refer if fever persists > 48h.',
    urgencyLevel: 'URGENT',
  },

  // ── 2. Maternal & Antenatal Red Flags ──
  {
    id: 'maternal-danger',
    category: 'MATERNAL',
    title: 'Antenatal & Postnatal High-Risk Danger Signs',
    redFlag: 'Severe persistent headache, blurred vision, sudden facial or hand edema, or epigastric pain (Pre-Eclampsia/Eclampsia). Any vaginal bleeding during pregnancy.',
    actionRequired: 'Do NOT delay. Immediate emergency transfer to Baramati CHC. Notify Medical Officer. If convulsions occur, protect airway and do not leave patient alone.',
    urgencyLevel: 'URGENT',
  },
  {
    id: 'maternal-labor',
    category: 'MATERNAL',
    title: 'Premature Labor & Reduced Fetal Movement',
    redFlag: 'Water breaking (fluid leaking) before 37 weeks, fever during labor, or absent/sharply reduced fetal kicks in the 3rd trimester.',
    actionRequired: 'Arrange urgent hospital transport. Alert labor room at Baramati CHC for high-risk obstetric admission.',
    urgencyLevel: 'URGENT',
  },

  // ── 3. Pediatric Danger Signs (< 5 Years) ──
  {
    id: 'pediatric-respiratory',
    category: 'PEDIATRIC',
    title: 'Childhood Fast Breathing & Pneumonia',
    normalRange: '< 50 breaths/min (2–11 months) | < 40 breaths/min (1–5 years)',
    redFlag: 'Chest in-drawing (lower chest wall sucking inward on inhalation), grunting, or stridor at rest.',
    actionRequired: 'Indicates severe pneumonia. Immediate referral to CHC. Keep child warm. Do not force oral fluids if breathing is labored.',
    urgencyLevel: 'URGENT',
  },
  {
    id: 'pediatric-general',
    category: 'PEDIATRIC',
    title: 'General Child Danger Signs (IMNCI Protocol)',
    redFlag: 'Inability to breastfeed/drink, persistent vomiting of all feeds, lethargy / unresponsiveness, or convulsions / fits.',
    actionRequired: 'Critical danger signs under IMNCI. Request 108 ambulance for immediate pediatric evaluation.',
    urgencyLevel: 'URGENT',
  },

  // ── 4. Adult Acute Emergencies ──
  {
    id: 'emergency-cardiac',
    category: 'EMERGENCY',
    title: 'Chest Pain / Acute Coronary Syndrome',
    redFlag: 'Crushing or heavy pressure in center of chest, radiating to left arm, neck, or jaw, accompanied by cold sweat or shortness of breath.',
    actionRequired: 'Suspected Heart Attack (Myocardial Infarction). Keep patient sitting quietly. Call 108 Ambulance immediately. Do not allow patient to walk.',
    urgencyLevel: 'URGENT',
  },
  {
    id: 'emergency-stroke',
    category: 'EMERGENCY',
    title: 'Stroke Warning Signs (F.A.S.T. Protocol)',
    redFlag: 'Face drooping on one side, Arm weakness (unable to raise both arms evenly), Slurred or incomprehensible Speech.',
    actionRequired: 'Time is brain. Dispatch patient to Baramati CHC or District Hospital immediately. Note exact time symptoms began.',
    urgencyLevel: 'URGENT',
  },

  // ── 5. Action Rules & Escalation ──
  {
    id: 'action-protocol',
    category: 'ACTIONS',
    title: 'When to Refer vs. When to Supervise at Village',
    redFlag: 'Patient condition worsening, vital measurements crossing red-flag thresholds, or recovery check unresolved after 48 hours.',
    actionRequired: 'Rule 1: If any RED FLAG is present → 108 Ambulance + Urgent Referral. Rule 2: If chronic condition is stable → Home visit in 48h. Rule 3: If overdue > 48h → Tap "Escalate to MO" for supervisory physician intervention.',
    urgencyLevel: 'PRIORITY',
  },
];

type CategoryFilter = 'ALL' | 'VITALS' | 'MATERNAL' | 'PEDIATRIC' | 'EMERGENCY' | 'ACTIONS';

export default function HealthGuidance() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = HIGH_VALUE_GUIDANCE.filter(item => {
    if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchRed = item.redFlag.toLowerCase().includes(q);
      const matchAction = item.actionRequired.toLowerCase().includes(q);
      return matchTitle || matchRed || matchAction;
    }
    return true;
  });

  return (
    <PageShell
      title="ASHA Clinical Guidance & Red Flags"
      subtitle="Standard health metrics, warning signs, and action protocols for village screenings and referral triage."
    >
      <div className="space-y-5 max-w-5xl">
        {/* Quick Emergency Banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Phone size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-red-900">
              Emergency Contact & 108 Ambulance Dispatch
            </div>
            <div className="text-xs text-red-700 mt-0.5 leading-relaxed">
              If an infant is unconscious, a pregnant mother has convulsions or heavy bleeding, or an adult has sudden chest pain / stroke signs:
              <strong> call 108 immediately</strong> and submit an <strong>Urgent Referral</strong> to Baramati Sub-District Hospital / CHC.
            </div>
          </div>
        </div>

        {/* Filter Navigation & Search */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'All Guidance' },
              { key: 'VITALS', label: 'Vitals Thresholds' },
              { key: 'MATERNAL', label: 'Maternal Red Flags' },
              { key: 'PEDIATRIC', label: 'Child Danger Signs' },
              { key: 'EMERGENCY', label: 'Adult Emergencies' },
              { key: 'ACTIONS', label: 'Referral Rules' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key as CategoryFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeCategory === tab.key
                    ? 'bg-[#1e6641] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search metrics, symptoms..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1e6641] focus:bg-white"
            />
          </div>
        </div>

        {/* Guidance Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:border-gray-200 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.urgencyLevel === 'URGENT'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.urgencyLevel}
                  </span>
                </div>

                {/* Normal & Caution Ranges (if applicable) */}
                {item.normalRange && (
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Normal</span>
                      <strong className="text-gray-800">{item.normalRange}</strong>
                    </div>
                    {item.cautionRange && (
                      <div>
                        <span className="text-[10px] text-amber-600 uppercase font-semibold block">Monitor / Caution</span>
                        <span className="text-gray-700 font-medium">{item.cautionRange}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Red Flag Warning */}
                <div className="mb-3">
                  <div className="text-[11px] font-bold text-red-700 flex items-center gap-1 mb-1">
                    <AlertTriangle size={13} className="text-red-600 shrink-0" />
                    RED FLAG / DANGER SIGN
                  </div>
                  <div className="text-xs text-red-900 bg-red-50/70 border border-red-200 p-2.5 rounded-xl leading-relaxed font-medium">
                    {item.redFlag}
                  </div>
                </div>

                {/* Action Required */}
                <div>
                  <div className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                    <CheckCircle2 size={13} className="text-[#1e6641] shrink-0" />
                    REQUIRED ASHA ACTION
                  </div>
                  <div className="text-xs text-gray-700 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl leading-relaxed">
                    {item.actionRequired}
                  </div>
                </div>
              </div>

              {/* Bottom quick CTA */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <Link
                  to="/intake"
                  className="text-xs font-semibold text-[#1e6641] hover:underline flex items-center gap-1"
                >
                  Record new patient intake <ArrowRight size={13} />
                </Link>
                <Link
                  to="/followups"
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  View Care Gaps
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
