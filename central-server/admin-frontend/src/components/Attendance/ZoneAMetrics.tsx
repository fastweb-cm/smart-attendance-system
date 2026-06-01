"use client";

import { useAttendanceLedger } from "@/hooks/useAttendance";
import { AttendanceQueryParams, AttendanceUserAnalyticsMetrics } from "@/types";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function ZoneAMetrics({ 
  queryParams,
  user
}: AttendanceUserAnalyticsMetrics) {
  const params: AttendanceQueryParams = {
    ...queryParams,
    search: user
  };

  // Search attendance for only this user
  const { data, isLoading } = useAttendanceLedger(params);

  const isEventContext = queryParams.context === 'event';

  // Compute metrics with contextual calculations
  const metrics = useMemo(() => {
    if (!data?.attendanceSummary) {
      return { expected: 0, present: 0, late: 0, permissions: 0, absent: 0 };
    }

    // Filter summary list down to the targeted worker
    const userSummary = data.attendanceSummary;

    // Isolate actual operational work dates (exclude unworked weekends if context is daily)
    const validSummaryRows = userSummary.filter(at => {
      if (isEventContext) return true; // Events include all continuous schedule elements
      
      // Determine if date falls on a weekend day index (0 = Sunday, 6 = Saturday)
      if (at.date) {
        const dayIndex = new Date(at.date).getDay();
        const isWeekend = dayIndex === 0 || dayIndex === 6;
        
        // If it's an unworked weekend with an absent state, discard from operational counts
        if (isWeekend && at.attendance_status === "absent") {
          return false;
        }
      }
      return true;
    });

    const exceptionsCount = data.exceptions?.length ?? 0;

    const present = validSummaryRows.filter(at => at.attendance_status === "present").length;
    const late = validSummaryRows.filter(at => at.checkin_status === "late").length;
    const permissions = validSummaryRows.filter(at => at.attendance_status === "on permission").length;
    
    // Normalize baselines against holiday exception records
    const expected = Math.max(0, validSummaryRows.length - exceptionsCount);
    const absent = Math.max(0, validSummaryRows.filter(at => at.attendance_status === "absent").length - exceptionsCount);

    return { expected, present, late, permissions, absent };
  }, [data, isEventContext]);

  // FIX 1: Wrap this inside an explicit return keyword wrapper statement
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center text-center p-8">
          <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3"/>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">Loading {user} attendance metrics </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-bold text-slate-600 tracking-widest font-mono uppercase">Individual Operational Metrics</h4>
        <span className="text-[9px] text-slate-600 font-mono">Calculated for Selected User</span>
      </div>
      
      <div className="grid grid-cols-5 gap-2.5">
        
        {/* Expected working days */}
        <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-slate-600 font-semibold font-mono block leading-tight">Expected Days</span>
          <span className="text-lg font-extrabold font-mono text-slate-900 mt-1.5">{metrics.expected - metrics.permissions}d</span>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">Excludes Holidays</span>
        </div>

        {/* Present Days */}
        <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-emerald-700 font-bold font-mono block leading-tight">Present Days</span>
          <span className="text-lg font-extrabold font-mono text-emerald-600 mt-1.5">{metrics.present}d</span>
          <span className="text-[9px] text-emerald-500 font-mono mt-0.5">Checked In</span>
        </div>

        {/* Late entries counts */}
        <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-amber-800 font-bold font-mono block leading-tight">Late Arrivals</span>
          <span className="text-lg font-extrabold font-mono text-amber-600 mt-1.5">{metrics.late}d</span>
          <span className="text-[9px] text-amber-500 font-mono mt-0.5">Late Checkins</span>
        </div>

        {/* Excused Leave / Permissions */}
        <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-blue-700 font-bold font-mono block leading-tight">Excused Leave</span>
          <span className="text-lg font-extrabold font-mono text-blue-600 mt-1.5">{metrics.permissions}d</span>
          <span className="text-[9px] text-blue-500 font-mono mt-0.5">Authorized</span>
        </div>

        {/* Unexcused absences total */}
        <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100 text-center flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-rose-700 font-bold font-mono block leading-tight">Absent</span>
          <span className="text-lg font-extrabold font-mono text-rose-600 mt-1.5">{metrics.absent}d</span>
          <span className="text-[9px] text-rose-500 font-mono mt-0.5">Unexcused</span>
        </div>

      </div>
    </div>
  );
}
