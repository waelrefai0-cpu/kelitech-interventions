import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: string;
  hint?: string;
}

export function MetricCard({ label, value, icon, accent = "#1d4ed8", hint }: MetricCardProps) {
  return (
    <Paper elevation={0} className="rounded-lg border border-slate-200 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          {hint ? <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p> : null}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: accent }}>
          {icon}
        </div>
      </div>
    </Paper>
  );
}

