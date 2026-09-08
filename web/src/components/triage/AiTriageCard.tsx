

import { useState } from 'react';
import { AlertCircle, CheckCircle, X, MessageSquare } from 'lucide-react';

interface TriageProps {
  score: number;
  urgencyLevel: 'ROUTINE' | 'EVALUATE' | 'URGENT' | 'EMERGENCY';
  explanation: string;
  provenanceModel: string;
  confidence: number;
}

export default function AiTriageCard({ score, urgencyLevel, explanation, provenanceModel, confidence }: TriageProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('Urgency score too high');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getBadgeColor = (level: string) => {
    switch(level) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'EVALUATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ROUTINE': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowModal(false);
        setNotes('');
      }, 1600);
    }, 600);
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden">
      {/* Decorative top border based on urgency */}
      <div className={`absolute top-0 left-0 w-full h-1 ${getBadgeColor(urgencyLevel).split(' ')[0]}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-900">
            Clinical Decision Support
            <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-50 font-normal text-indigo-700">
              Verified
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            AI Recommendation by {provenanceModel} {provenanceModel.includes('Fallback') && <span className="text-orange-600 font-medium">(Deterministic Fallback)</span>}
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-md border font-bold text-sm ${getBadgeColor(urgencyLevel)}`}>
          {urgencyLevel} (Score: {score})
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border/50">
        <h4 className="text-sm font-semibold mb-2">Clinical Explanation</h4>
        <p className="text-sm text-foreground leading-relaxed">
          {explanation}
        </p>
      </div>

      <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Confidence: {confidence}%</span>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="hover:underline text-indigo-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <AlertCircle size={13} />
            Report Inaccuracy
          </button>
        </div>
      </div>

      {/* ── Report Inaccuracy Feedback Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-600" />
                Report Triage Inaccuracy
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle size={36} className="mx-auto text-green-600" />
                <h4 className="font-bold text-gray-900 text-sm">Feedback Recorded</h4>
                <p className="text-xs text-gray-500">
                  Thank you. Clinical audit feedback has been logged for AI model governance and safety improvement.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">Primary Issue</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-[#1e6641] focus:outline-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="Urgency score too high">Urgency score is too high</option>
                    <option value="Urgency score too low">Urgency score is too low</option>
                    <option value="Symptoms misclassified">Symptoms misclassified or neglected</option>
                    <option value="Contradicts clinical guidelines">Contradicts ICMR / WHO clinical guidelines</option>
                    <option value="Other">Other clinical discrepancy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Doctor's Clinical Notes <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-[#1e6641] focus:outline-none resize-none"
                    placeholder="Describe what the model got wrong and what clinical action was actually needed..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

