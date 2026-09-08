import React from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Consistent page-level header + content wrapper used on every protected page. */
export default function PageShell({ title, subtitle, eyebrow, action, children, className = '' }: PageShellProps) {
  return (
    <div className={`space-y-5 pb-16 animate-page-in ${className}`}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1e6641] mb-0.5">{eyebrow}</p>
          )}
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
