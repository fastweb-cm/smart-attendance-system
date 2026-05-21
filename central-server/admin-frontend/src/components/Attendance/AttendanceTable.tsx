
import { AttendanceTableProps } from '@/types'
import { ChevronRight, Database, ShieldAlert, SlidersHorizontal } from 'lucide-react'
import React from 'react'
import { tr } from 'zod/locales';
import AttendanceStatusCell from './AttendanceStatusCell';

export default function AttendanceTable({
    calendarDates,
    users,
    exceptions,
    context,
    attendanceSummary,
    onRowClick
}: AttendanceTableProps) {
    const EmptyColSpan = calendarDates.length + 2;
  return (
    <section className="bg-slate-800/98 border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-112.5">
        {/* table title and action header */}
        <div className="px-6 py-4 border border-slate-700/50 bg-slate-900/40 text-slate-200 font-medium text-sm tracking-wide flex items-center justify-between">
            <div>
                <h2 className="font-extrabold tracking-wider">OVERALL ATTENDANCE LEDGER MATRIX</h2>
                <p className="text-xs mt-1 text-slate-400">Select any employee row to view attendance session, perform overrides and inspect raw logs.</p>
            </div>
            <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-1 rounded font-mono flex items-center gap-1.5">
                <Database className="w-3 h-3" /> Live Sync Session Active
            </span>
            </div>
        </div>

        {/* main grid wrapper */}
        <div className="flex-1 overflow-x-auto relative">
            <table className="w-full text-left border-collapse table-fixed min-w-200">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                        {/* frozen column header */}
                        <th className="sticky left-0 z-20 p-6 border border-slate-700/50 w-70">EMPLOYEE CREDENTIALS </th>

                        { calendarDates.map(cd => {
                            const isHoliday = exceptions.some(ex => ex.date === cd.raw);

                            return (
                                <th key={cd.raw} className={`p-3 border border-slate-700/50 text-center text-xs uppercase tracking-wide ${isHoliday ? "bg-indigo-950/80" : ""}`}>
                                    <div className="text-slate-500 font-bold uppercase tracking-normal">{cd.dayName}</div>
                                    <div className="text-white text-xs mt-0.5 font-bold">{cd.label}</div>
                                    { isHoliday && (
                                        <div className="text-[8px] text-indigo-400 font-bold bg-indigo-900/30 border border-indigo-500/20 rounded py-0.5 px-1 mt-1 truncate">
                                            HOLIDAY
                                        </div>
                                    )}
                                </th>
                            )
                        }) }

                        <th className="p-4 text-center bg-slate-950/60 w-22.5">AUDIT</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-850">
                    { users.length === 0 ? (
                        <tr>
                            <td colSpan={EmptyColSpan} className="p-12 text-center text-slate-500 text-sm">
                                <div className="flex flex-col items-center gap-3">
                                    <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
                                    <span className='text-red-400'>No matching operational user records found.</span>
                                </div>
                            </td>
                        </tr>
                    ):(
                      users.map(u => {
                        const records = attendanceSummary.filter(r => u.id === r.employee_id);
                        return (
                            <tr key={u.id} className='hover:bg-slate-900/30 transition group cursor-pointer text-xs' onClick={() => onRowClick?.(u, context)}>
                                {/* Sticky Column Content Row */}
                                <td className="sticky left-0 bg-slate-950/95 group-hover:bg-slate-900/95 transition z-10 p-3 border-r border-slate-800 flex items-center justify-between shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-lg ${u.avatarColor} flex items-center justify-center text-white font-extrabold shadow font-mono text-xs border border-white/10 shrink-0`}>
                                        {u?.name?.split(' ').map(n=>n[0]).join('')}
                                        </div>
                                        <div className="truncate">
                                        <span className="font-bold text-white group-hover:text-indigo-300 transition truncate block text-xs">
                                            {u.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono truncate block">
                                            {u.regno} • {u.role}
                                        </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 transition" />
                                </td>

                                {/* matric cell rendering dynamically */}
                                {calendarDates.map(cd => {
                                    const record = records.find(r => r.date === cd.raw)
                                    const isHoliday = exceptions.some(ex => ex.date === cd.raw)

                                    console.log(record)
                                    console.log("is holiday: ", isHoliday)

                                    // Compute if current column is a weekend day cleanly
                                    const dayNormalized = cd?.dayName?.toLowerCase() || '';
                                    const isWeekend = dayNormalized.includes('sat') || dayNormalized.includes('sun');
                                    console.log("is weekend:", isWeekend)

                                    return (
                                        <td key={cd.raw} className={`p-2 border-r border-slate-850 text-center relative ${isHoliday ? 'bg-indigo-950/10' : ''}`}>
                                            <div className="flex justify-center items-center">
                                                <AttendanceStatusCell record={record || null} isHoliday={isHoliday} isWeekend={isWeekend} />
                            
                                                {/* Override flag marker dot */}
                                                {record && record.derived_from_session === 0 && (
                                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 border border-slate-900" title="Manual audit override active" />
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}

                                {/* Fast Action Access row */}
                                <td className="p-3 text-center">
                                    <button 
                                        className="p-1.5 bg-slate-900 border border-slate-800 cursor-pointer rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                                        onClick={(e) => {
                                        e.stopPropagation();
                                        onRowClick?.(u, context);
                                        }}
                                    >
                                        <SlidersHorizontal className="w-4 h-4" />
                                    </button>
                                </td>

                            </tr>
                        )
                      })
                    )}
                </tbody>
            </table>
        </div>
    </section>
  )
}
