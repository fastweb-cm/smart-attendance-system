
import { AttendanceLedgerMetrics } from "@/types"

export default function AttendanceHeader({ globalMetrics }: { globalMetrics: AttendanceLedgerMetrics }) {
  return (
    <div className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
          
          {/* Left: Titles */}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Attendance Report
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              View and manage detailed attendance records across your organization.
            </p>
          </div>

          {/* Right: Premium, High-Contrast Operational Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Late Card */}
            <div className="bg-slate-50 border border-slate-200/80 hover:border-amber-200 px-4 py-2 rounded-xl flex items-center gap-3 transition-all shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 leading-none">Late Arrivals</span>
                <span className="font-bold text-lg text-slate-800 mt-0.5">
                  {globalMetrics.total_late ?? 0}
                </span>
              </div>
            </div>

            {/* Missed Checkout Card */}
            <div className="bg-slate-50 border border-slate-200/80 hover:border-rose-200 px-4 py-2 rounded-xl flex items-center gap-3 transition-all shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 leading-none">Missed Checkout</span>
                <span className="font-bold text-lg text-slate-800 mt-0.5">
                  {globalMetrics.total_missed_checkout ?? 0}
                </span>
              </div>
            </div>

            {/* Audit Override Card (Using your Primary variant blue look) */}
            <div className="bg-blue-50/60 border border-blue-100 hover:border-blue-200 px-4 py-2 rounded-xl flex items-center gap-3 transition-all shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wider text-blue-600/80 leading-none">Audit Overrides</span>
                <span className="font-bold text-lg text-blue-900 mt-0.5">
                  {globalMetrics.total_audit_override ?? 0}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
  )
}
