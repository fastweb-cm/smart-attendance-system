import { Activity, Users, Clock, AlertTriangle } from 'lucide-react';
import { AttendanceSessionMetrics } from '@/types';

export default function SessionsHeader({ metrics }: { metrics: AttendanceSessionMetrics }) {
  const cards = [
    { label: "Total Sessions", value: metrics.total_recorded_sessions ?? 0, icon: Users, tone: "text-slate-700 bg-slate-100" },
    { label: "Currently Active", value: metrics.currently_active ?? 0, icon: Activity, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Late Check-ins", value: metrics.late_checkins ?? 0, icon: Clock, tone: "text-amber-700 bg-amber-50" },
    { label: "Missed Checkouts", value: metrics.missed_checkouts ?? 0, icon: AlertTriangle, tone: "text-rose-700 bg-rose-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${c.tone}`}>
            <c.icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{c.value}</div>
            <div className="text-xs text-slate-500 font-medium">{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
