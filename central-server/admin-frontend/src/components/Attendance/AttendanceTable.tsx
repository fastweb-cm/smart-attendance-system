import { AttendanceTableProps } from '@/types'
import { ChevronRight, Database, ShieldAlert, SlidersHorizontal } from 'lucide-react'
import React from 'react'
import AttendanceStatusCell from './AttendanceStatusCell';
import Pagination from '../ui/pagination';

export default function AttendanceTable({
    calendarDates,
    users,
    exceptions,
    context,
    attendanceSummary,
    onRowClick,
    paginationMeta
}: AttendanceTableProps) {
    const EmptyColSpan = calendarDates.length + 2;

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-112.5">
        {/* table title and action header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 text-slate-800 font-medium text-sm tracking-wide flex items-center justify-between">
            <div>
                <h2 className="font-extrabold tracking-wider text-slate-900">OVERALL ATTENDANCE LEDGER MATRIX</h2>
                <p className="text-xs mt-1 text-slate-500">Select any user row to view attendance summary, perform overrides and inspect raw logs.</p>
            </div>
            <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-1 rounded font-mono flex items-center gap-1.5 font-semibold">
                <Database className="w-3 h-3" /> Live Attendance Summary Report
            </span>
            </div>
        </div>

        {/* main grid wrapper */}
        <div className="flex-1 overflow-x-auto relative">
            <table className="w-full text-left border-collapse table-fixed min-w-200">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide border-b border-slate-200">
                    <tr>
                        {/* frozen column header */}
                        <th className="sticky left-0 edit-z z-20 p-6 border-r border-b border-slate-200 bg-slate-50 font-bold w-70 text-slate-700">EMPLOYEE CREDENTIALS</th>

                        { calendarDates.map(cd => {
                            const isHoliday = exceptions.some(ex => ex.date === cd.exact_date);

                            return (
                                <th key={cd.raw} className={`p-3 border-r border-b border-slate-200 text-center text-xs uppercase tracking-wide ${isHoliday ? "bg-blue-50/50" : ""}`}>
                                    <div className="text-slate-400 font-bold uppercase tracking-normal">{cd.dayName}</div>
                                    <div className="text-slate-800 text-xs mt-0.5 font-extrabold">{cd.label}</div>
                                    { isHoliday && (
                                        <div className="text-[8px] text-blue-600 font-bold bg-blue-100/60 border border-blue-200 rounded py-0.5 px-1 mt-1 truncate">
                                            HOLIDAY
                                        </div>
                                    )}
                                </th>
                            )
                        }) }

                        <th className="p-4 text-center bg-slate-100/80 border-b border-slate-200 w-22.5 font-bold text-slate-700">AUDIT</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                    { users.length === 0 ? (
                        <tr>
                            <td colSpan={EmptyColSpan} className="p-12 text-center text-slate-400 text-sm bg-white">
                                <div className="flex flex-col items-center gap-3">
                                    <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
                                    <span className='text-rose-500 font-medium'>No matching operational user records found.</span>
                                </div>
                            </td>
                        </tr>
                    ):(
                      users.map(u => {
                        const records = attendanceSummary.filter(r => u.id === r.employee_id);
                        return (
                            <tr key={u.id} className='hover:bg-slate-50/60 transition group cursor-pointer text-xs' onClick={() => u.id !== undefined && onRowClick?.(u.id)}>
                                {/* Sticky Column Content Row */}
                                <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition z-10 p-3 border-r border-slate-200 flex items-center justify-between shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-lg ${u.avatarColor || 'bg-blue-600'} flex items-center justify-center text-white font-extrabold shadow-sm font-mono text-xs border border-white/20 shrink-0`}>
                                        {u?.name?.split(' ').map(n=>n[0]).join('')}
                                        </div>
                                        <div className="truncate">
                                        <span className="font-bold text-slate-800 group-hover:text-blue-600 transition truncate block text-xs">
                                            {u.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono truncate block">
                                            {u.regno} • {u.role}
                                        </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition" />
                                </td>

                                {/* matrix cell rendering dynamically */}
                                {calendarDates.map(cd => {
                                    const record = records.find(r => r.date === cd.exact_date)
                                    const isHoliday = exceptions.some(ex => ex.date === cd.exact_date)
                                    const dayNormalized = cd?.dayName?.toLowerCase() || '';
                                    const isWeekend = dayNormalized.includes('sat') || dayNormalized.includes('sun');

                                    return (
                                        <td key={cd.raw} className={`p-2 border-r border-slate-200 text-center relative ${isHoliday ? 'bg-blue-50/20' : isWeekend ? 'bg-slate-50/30' : ''}`}>
                                            <div className="flex justify-center items-center">
                                                <AttendanceStatusCell record={record || null} isHoliday={isHoliday} isWeekend={isWeekend} />
                            
                                                {/* Override flag marker dot */}
                                                {record && record.derived_from_session === 0 && (
                                                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 border border-white shadow-sm" title="Manual audit override active" />
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}

                                {/* Fast Action Access row */}
                                <td className="p-3 text-center bg-slate-50/20">
                                    <button 
                                        className="p-1.5 bg-white border border-slate-200 cursor-pointer rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition shadow-sm"
                                        onClick={(e) => {
                                        e.stopPropagation();
                                        if (u.id !== undefined) onRowClick?.(u.id);
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

        {/* pagination footer component container */}
        <Pagination total_pages={paginationMeta.total_pages} current_page={paginationMeta.current_page} total_records={paginationMeta.total_records} limit={paginationMeta.limit} onPageChange={paginationMeta.onPageChange}  />
    </section>
  )
}
