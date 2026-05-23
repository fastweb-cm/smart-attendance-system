import { AttendanceUserAnalyticsMetrics } from "@/types";

export default function ZoneAMetrics({ 
  expected_days, 
  present_days, 
  late_arrivals, 
  absent_days, 
  permission_days 
}: AttendanceUserAnalyticsMetrics) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-bold text-slate-600 tracking-widest font-mono uppercase">Individual Operational Metrics</h4>
        <span className="text-[9px] text-slate-600 font-mono">Calculated for Selected User</span>
      </div>
      
      {/* Expanded to 5 columns to flawlessly accommodate permissions */}
      <div className="grid grid-cols-5 gap-2.5">
        
        {/* Expected working days */}
        <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-slate-600 font-semibold font-mono block leading-tight">Expected Days</span>
          <span className="text-lg font-extrabold font-mono text-slate-900 mt-1.5">{expected_days}d</span>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">Excludes Holidays</span>
        </div>

        {/* Present Days */}
        <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-emerald-700 font-bold font-mono block leading-tight">Present Days</span>
          <span className="text-lg font-extrabold font-mono text-emerald-600 mt-1.5">{present_days}d</span>
          <span className="text-[9px] text-emerald-500 font-mono mt-0.5">Checked In</span>
        </div>

        {/* Late entries counts */}
        <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-amber-800 font-bold font-mono block leading-tight">Late Arrivals</span>
          <span className="text-lg font-extrabold font-mono text-amber-600 mt-1.5">{late_arrivals}d</span>
          <span className="text-[9px] text-amber-500 font-mono mt-0.5">Over Buffer</span>
        </div>

        {/* Excused Leave / Permissions */}
        <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-blue-700 font-bold font-mono block leading-tight">Excused Leave</span>
          <span className="text-lg font-extrabold font-mono text-blue-600 mt-1.5">{permission_days}d</span>
          <span className="text-[9px] text-blue-500 font-mono mt-0.5">Authorized</span>
        </div>

        {/* Unexcused absences total */}
        <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-rose-700 font-bold font-mono block leading-tight">Absent</span>
          <span className="text-lg font-extrabold font-mono text-rose-600 mt-1.5">{absent_days}d</span>
          <span className="text-[9px] text-rose-500 font-mono mt-0.5">Unexcused</span>
        </div>

      </div>
    </div>
  );
}
