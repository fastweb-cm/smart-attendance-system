import { AttendanceStatusCellProps } from '@/types'
import React from 'react'

export default function AttendanceStatusCell({
    record,
    isHoliday,
    isWeekend
}: AttendanceStatusCellProps) {

  const missedCheckout = record?.session_status === 'missed_checkout';

  // Handle missing records safely based on the day type
  if (!record || (isWeekend && !isHoliday && record.attendance_status === 'absent')) {
    if (isWeekend && !isHoliday) {
      return <span className="text-slate-400 text-[10px] font-mono block py-1 font-medium">—</span>;
    }
    return (
      <span className="bg-rose-50 text-rose-600 border border-rose-200/60 text-[9px] px-2 py-0.5 rounded font-mono font-bold block w-full text-center tracking-wider">
        ABS
      </span>
    );
  }

  // Holiday rule: Filter exception dates unless checking timestamp is explicitly logged
  if (isHoliday) {
    if (record.first_checkin !== null) {
      return (
        <div className="flex flex-col gap-0.5 w-full items-center">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold block truncate max-w-full tracking-tight">
            HOL WORKER
          </span>
          <span className="text-[9px] font-mono text-emerald-600 font-bold">{record.total_hours} hrs</span>
        </div>
      );
    } else {
      return <span className="text-slate-400 text-[10px] font-mono block py-1 font-medium">—</span>;
    }
  }

  // Standard checks status mapping
  switch (record.attendance_status) {
    case 'present':
      return (
        <div className="w-full flex flex-col gap-0.5 items-center justify-center">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 justify-center w-full tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            PRESENT
          </span>
          {missedCheckout ? (
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold block truncate max-w-full tracking-wide animate-pulse">
              MISSED CO
            </span>
          ):(
            <span className="text-[9px] text-slate-500 font-mono font-bold">{record.total_hours}h</span>
          )}
        </div>
      );
    case 'on permission':
      return (
        <div className="w-full flex flex-col gap-0.5 items-center justify-center">
          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] px-1 py-0.5 rounded font-mono font-bold block w-full text-center tracking-wide">
            ON PERMISSION
          </span>
          <span className="text-[9px] text-slate-500 font-mono font-bold">0h</span>
        </div>
      );
    case 'absent':
      return (
        <div className="w-full flex flex-col gap-0.5 items-center justify-center">
          <span className="bg-rose-50 text-rose-600 border border-rose-200/60 text-[9px] px-2 py-0.5 rounded font-mono font-bold block w-full text-center tracking-wider">
            ABS
          </span>
          <span className="text-[9px] text-slate-500 font-mono font-bold">0h</span>
        </div>
        
      );
    default:
      return <span className="text-slate-400 text-[10px] font-mono block font-medium">—</span>;
  }
}
