interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const URGENCY_MAP: Record<string, { label: string; className: string }> = {
  URGENT:   { label: 'Needs urgent care',       className: 'bg-red-100 text-red-700 border border-red-200' },
  PRIORITY: { label: 'Should see doctor soon',  className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  ROUTINE:  { label: 'Can be monitored',        className: 'bg-green-100 text-green-700 border border-green-200' },
};

const REFERRAL_MAP: Record<string, { label: string; className: string }> = {
  CREATED:              { label: 'Draft',                     className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  SUBMITTED:            { label: 'Sent to clinic',            className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  ACCEPTED:             { label: 'Clinic accepted',           className: 'bg-green-100 text-green-700 border border-green-200' },
  REJECTED:             { label: 'Declined',                  className: 'bg-red-100 text-red-700 border border-red-200' },
  SCHEDULED:            { label: 'Appointment set',           className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  PATIENT_ARRIVED:      { label: 'Patient arrived',           className: 'bg-green-100 text-green-700 border border-green-200' },
  IN_CONSULTATION:      { label: 'In consultation',           className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  DIAGNOSTICS_PENDING:  { label: 'Tests in progress',         className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  TREATMENT:            { label: 'Under treatment',           className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  COUNTER_REFERRED:     { label: 'Doctor sent instructions',  className: 'bg-[#e4efe7] text-[#1e6641] border border-[#1e6641]/20' },
  FOLLOW_UP_REQUIRED:   { label: 'Follow-up needed',          className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  COMPLETED:            { label: 'Case closed',               className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  CANCELLED:            { label: 'Cancelled',                 className: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const QUEUE_MAP: Record<string, { label: string; className: string }> = {
  WAITING:        { label: 'Waiting',      className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  IN_CONSULTATION:{ label: 'With doctor',  className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  COMPLETED:      { label: 'Done',         className: 'bg-gray-100 text-gray-500 border border-gray-200' },
  PRIORITY:       { label: 'Urgent',       className: 'bg-red-100 text-red-700 border border-red-200' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const map = { ...URGENCY_MAP, ...REFERRAL_MAP, ...QUEUE_MAP };
  const config = map[status] ?? { label: status.replace(/_/g, ' '), className: 'bg-gray-100 text-gray-600 border border-gray-200' };
  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
