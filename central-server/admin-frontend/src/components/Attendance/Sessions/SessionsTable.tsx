"use client";

import React from 'react';
import { AttendanceSessionTableProps } from '@/types';
import { ArrowRight, Circle, CheckCircle2, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import Pagination from '@/components/ui/pagination';

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  "missed checkout": "bg-rose-50 text-rose-700 border-rose-200",
};

const syncStyles: Record<string, string> = {
  synced: "text-emerald-600",
  pending: "text-amber-600",
  error: "text-rose-600",
};

function formatTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SessionsTable({ sessions, paginationMeta, isRefreshing }: AttendanceSessionTableProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-112.5">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold tracking-wider text-slate-900 text-sm">REAL-TIME SESSION LOG</h2>
          <p className="text-xs mt-1 text-slate-500">Every check-in / check-out event matching the current filters.</p>
        </div>
        {isRefreshing && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-blue-600">
            <Radio className="w-3 h-3 animate-pulse" /> Live
          </span>
        )}
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold">Employee</th>
              <th className="p-3 font-bold">Context</th>
              <th className="p-3 font-bold">Check-in</th>
              <th className="p-3 font-bold">Check-out</th>
              <th className="p-3 font-bold text-center">Status</th>
              <th className="p-3 font-bold text-center">Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    No sessions match the current filters.
                  </div>
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{s.user_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.employee_id}</div>
                  </td>
                  <td className="p-3">
                    <span className="capitalize text-slate-600">{s.attendance_context}</span>
                    {s.event_name && (
                      <div className="text-[10px] text-slate-400 truncate max-w-32">{s.event_name}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-slate-700">{formatTime(s.checkin_timestamp)}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-28">{s.checkin_terminal_name ?? "—"}</div>
                    {s.checkin_status === "late" && (
                      <span className="text-[9px] font-bold text-amber-600 uppercase">Late</span>
                    )}
                  </td>
                  <td className="p-3">
                    {s.checkout_timestamp ? (
                      <>
                        <div className="font-mono text-slate-700 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          {formatTime(s.checkout_timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-28">{s.checkout_terminal_name ?? "—"}</div>
                        {s.checkout_status === "early" && (
                          <span className="text-[9px] font-bold text-amber-600 uppercase">Early</span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-300 italic">Not yet</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusStyles[s.session_status ?? ""] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      {s.session_status === "active" ? <Circle className="w-2 h-2 fill-current" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                      {s.session_status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase ${syncStyles[s.sync_status ?? ""] ?? "text-slate-400"}`}>
                      <RefreshCw className="w-2.5 h-2.5" /> {s.sync_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        total_pages={paginationMeta.total_pages}
        current_page={paginationMeta.current_page}
        total_records={paginationMeta.total_records}
        limit={paginationMeta.limit}
        onPageChange={paginationMeta.onPageChange}
      />
    </section>
  );
}
