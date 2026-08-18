import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
        {icon && <span className="text-brand-600">{icon}</span>}
      </div>
      <span className="text-2xl font-bold text-ink-900">{value}</span>
      {sublabel && <span className="text-xs text-ink-500">{sublabel}</span>}
    </div>
  );
}
