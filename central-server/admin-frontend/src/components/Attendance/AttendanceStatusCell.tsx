
import { AttendanceStatusCellProps } from '@/types'
import React from 'react'

export default function AttendanceStatusCell({
    record,
    isHoliday,
    isWeekend
}: AttendanceStatusCellProps) {

  // Handle missing records safely based on the day type
  if (!record || (isWeekend && !isHoliday && record.checkin_status === 'absent')) {
    if (isWeekend && !isHoliday) {
      return <span className="text-slate-600 text-[10px] font-mono block py-1">—</span>;
    }
    return (
      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-2 py-1 rounded font-mono block w-full text-center">
        ABS
      </span>
    );
  }

  // Holiday rule: Filter exception dates unless checking timestamp is explicitly logged
  if (isHoliday) {
    if (record.first_checkin !== null) {
      return (
        <div className="flex flex-col gap-0.5 w-full">
          <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold block truncate">
            HOL WORKER
          </span>
          <span className="text-[9px] font-mono text-emerald-400 font-semibold">{record.total_hours} hrs</span>
        </div>
      );
    } else {
      return <span className="text-slate-600 text-[10px] font-mono block py-1">—</span>;
    }
  }

  // Missed Checkout scenario (needs manual correction)
  if (record.session_status === 'missed_checkout') {
    return (
      <div className="w-full flex flex-col gap-0.5">
        <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold block truncate animate-pulse">
          MISSED CO
        </span>
        <span className="text-[8px] font-mono text-slate-500">In: {record.first_checkin ? record.first_checkin.split('T')[1].substring(0,5) : '—'}</span>
      </div>
    );
  }

  // Standard checks status mapping
  switch (record.checkin_status) {
    case 'on time':
      return (
        <div className="w-full flex flex-col gap-0.5 items-center justify-center">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1 justify-center w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            OK
          </span>
          <span className="text-[9px] text-slate-400 font-mono font-semibold">{record.total_hours}h</span>
        </div>
      );
    case 'late':
      return (
        <div className="w-full flex flex-col gap-0.5 items-center justify-center">
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1 py-0.5 rounded font-mono font-bold block w-full text-center">
            +{record.variance || 0}m
          </span>
          <span className="text-[9px] text-amber-500/80 font-mono font-semibold">{record.total_hours}h</span>
        </div>
      );
    case 'absent':
      return (
        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-2 py-1 rounded font-mono block w-full text-center">
          ABS
        </span>
      );
    default:
      return <span className="text-slate-500 text-[10px] font-mono block">—</span>;
  }
}
