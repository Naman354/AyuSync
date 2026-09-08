import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
}

export default function InlineError({ message, onDismiss }: InlineErrorProps) {
  const [visible, setVisible] = useState(true);
  if (!visible || !message) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in">
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={() => { setVisible(false); onDismiss(); }} className="shrink-0 hover:text-red-900">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
