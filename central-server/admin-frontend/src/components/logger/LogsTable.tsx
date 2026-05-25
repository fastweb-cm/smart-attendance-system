"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, AlertCircle, Info, ShieldAlert, Globe } from 'lucide-react';
import { logLevels, LogsTableProps } from '@/types';
import Pagination from '../ui/pagination';

export default function LogsTable({ logs, paginationMeta }: LogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const levelStyles = {
    info: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };

  const levelIcons = {
    info: <Info className="w-3.5 h-3.5" />,
    warning: <AlertCircle className="w-3.5 h-3.5" />,
    error: <ShieldAlert className="w-3.5 h-3.5" />,
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <Terminal className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No log entries found</h3>
        <p className="text-xs text-slate-500 mt-1">Try modifying your query options or time parameters.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 tracking-wider">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4 w-28">Timestamp</th>
              <th className="py-3 px-4 w-24">Severity</th>
              <th className="py-3 px-4 w-24">Category</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 w-40">Operator</th>
              <th className="py-3 px-4 w-32 text-right">Origin IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {logs
              .filter((log) => typeof log.id === 'number')
              .map((log) => {
                const isExpanded = !!expandedRows[log.id as number];
                const hasContext = log.context_data && Object.keys(log.context_data).length > 0;

                return (
                  <React.Fragment key={log.id}>
                  <tr
                    onClick={() => hasContext && log.id !== undefined && toggleRow(log.id)}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition cursor-pointer ${
                      isExpanded ? 'bg-indigo-50/20 dark:bg-indigo-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      {hasContext && (
                        isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {log.date_created}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${levelStyles[log.log_level as logLevels] || ''}`}>
                        {levelIcons[log.log_level as logLevels]}
                        {log.log_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium max-w-md wrap-break-word">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.name ? (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 capitalize">{log.name}</div>
                          <div className="text-xs text-slate-400 lowercase">{log.role_name || 'user'}</div>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">System Pipeline</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Globe className="w-3 h-3 text-slate-300" />
                        <span>{log.ip_address}</span>
                      </div>
                    </td>
                  </tr>

                  {hasContext && isExpanded && (
                    <tr>
                      <td colSpan={7} className="bg-slate-50/50 dark:bg-slate-900/50 p-4 border-t border-b border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-900 dark:bg-black text-slate-200 rounded-xl p-4 shadow-inner font-mono text-xs border border-slate-800 max-w-5xl mx-auto">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-slate-400 text-[11px]">
                            <span>REQUEST PATH: <span className="text-amber-400">{log.request_uri}</span></span>
                            <span>LOG ID: #{log.id}</span>
                          </div>
                          {/* Operational Description Segment Block */}
                          <div className="mb-4 bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">
                            <h4 className="text-slate-400 font-semibold mb-1 text-[11px] tracking-wider uppercase">Event Details</h4>
                            <p className="text-slate-300 font-sans text-xs leading-relaxed">
                                {log.description}
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <h4 className="text-indigo-400 font-semibold mb-1 text-[11px] tracking-wider uppercase">Context Snapshot</h4>
                            <pre className="whitespace-pre-wrap text-emerald-400 selection:bg-indigo-500">
                              {JSON.stringify(log.context_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        total_pages={paginationMeta?.total_pages ?? 1}
        current_page={paginationMeta?.current_page ?? 1}
        total_records={paginationMeta?.total_records ?? 0}
        limit={paginationMeta?.limit ?? 10}
        onPageChange={paginationMeta?.onPageChange}
      />
    </div>
  );
}
