"use client";

import React, { useState } from 'react';
import { ShieldAlert, Calendar, Edit2, CheckSquare, Trash2, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { PermissionTableProps } from '@/types';
import Pagination from '../ui/pagination';
import { cn } from '@/lib/utils';

type PermissionRowType = NonNullable<PermissionTableProps["data"]>[number] & {
  history_remarks?: string;
  history_approvers?: string;
  history_dates?: string;
};

export default function PermissionTable({
  data = [],
  onEdit,
  onReview,
  onDelete,
  paginationMeta
}: PermissionTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No permission records found</h3>
        <p className="text-xs text-slate-500 mt-1">Try modifying your query options or filtering criteria.</p>
      </div>
    );
  }

  // Get current date footprint matched to standard DB YYYY-MM-DD structures
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
      
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-medium text-sm tracking-wide flex items-center justify-between">
        <div>
          <h2 className="font-extrabold tracking-wider text-slate-900 dark:text-slate-100 uppercase text-xs">Employee Permission Registry Ledger</h2>
          <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-normal">Track ongoing requests, monitor administrative revision logs, and execute review audits.</p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              <th className="py-3.5 px-6">Employee Name</th>
              <th className="py-3 px-4">Permission Type</th>
              <th className="py-3 px-4">Duration Period</th>
              <th className="py-3 px-4">Stated Justification</th>
              <th className="py-3 px-4 text-center w-28">Current Status</th>
              <th className="py-3 px-6 text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {data
              .filter((row) => typeof row.id === 'number')
              .map((row: PermissionRowType) => {
                const remarks = row.history_remarks ? row.history_remarks.split('||') : [];
                const approvers = row.history_approvers ? row.history_approvers.split('||') : [];
                const dates = row.history_dates ? row.history_dates.split('||') : [];
                const hasHistory = remarks.length > 0 && approvers[0] !== "";

                const isExpanded = !!expandedRows[row.id ?? 0];

                // Check if the validation timeline for this record has fully closed out
                const isPastPermission = row.end_date ? row.end_date < todayStr : false;

                // Action conditions matrix
                const isApproved = row.status === 'approved';
                const isReviewDisabled = isApproved || isPastPermission;
                const isEditOrDeleteDisabled = row.status !== 'pending' || isPastPermission;

                return (
                  <React.Fragment key={row.id}>
                    <tr className={cn(
                      "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition text-slate-700 dark:text-slate-300 align-top",
                      isExpanded && "bg-slate-50/30 dark:bg-slate-800/10"
                    )}>
                      {/* Employee Name */}
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-100">
                        <div>
                          <span>{row.employee_name || `Staff ID #${row.user_id}`}</span>
                          {hasHistory && (
                            <button 
                              onClick={() => toggleRow(row.id!)}
                              className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              <span>Audit History ({remarks.length})</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {row.permission_type_name}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        <div className={cn("flex items-center gap-1.5", isPastPermission && "text-slate-400 dark:text-slate-600 line-through")}>
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{row.start_date}</span>
                          <span className="text-slate-300 dark:text-slate-700">→</span>
                          <span>{row.end_date}</span>
                        </div>
                      </td>

                      {/* Justification Reason */}
                      <td className="py-4 px-4 max-w-xs text-slate-600 dark:text-slate-400">
                        <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2" title={row.reason || ""}>
                          {row.reason || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize",
                          statusStyles[row.status || 'pending']
                        )}>
                          {row.status}
                        </span>
                      </td>

                      {/* Actions Grid Pipeline */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Action 1: Review Status (Disabled if approved OR date has passed) */}
                          <button
                            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => onReview(row)}
                            disabled={isReviewDisabled}
                            title={
                              isApproved 
                                ? "Approved requests cannot be re-reviewed" 
                                : isPastPermission 
                                ? "Cannot review an expired timeline window" 
                                : "Review Status Decision"
                            }
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>

                          {/* Action 2: Edit (Disabled if not pending OR date has passed) */}
                          <button
                            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => onEdit(row)}
                            disabled={isEditOrDeleteDisabled}
                            title={
                              isPastPermission 
                                ? "Cannot edit a historic record whose date has passed" 
                                : row.status !== 'pending' 
                                ? "Can only alter records that are currently pending" 
                                : "Edit Parameters"
                            }
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Action 3: Cancel / Delete (Disabled if not pending OR date has passed) */}
                          <button
                            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => onDelete(row)}
                            disabled={isEditOrDeleteDisabled}
                            title={
                              isPastPermission 
                                ? "Cannot prune historic logging documentation" 
                                : row.status !== 'pending' 
                                ? "Can only delete pending request documentation" 
                                : "Delete Request"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* REVISION CHRONOLOGY EXPANSION TIMELINE DRAWER */}
                    {isExpanded && hasHistory && (
                      <tr className="bg-slate-50/50 dark:bg-slate-900/60 border-l-2 border-blue-500">
                        <td colSpan={6} className="py-4 px-8 bg-slate-50/30 dark:bg-slate-950/40">
                          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                            <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2 pl-6"> Administrative Decision Logs Matrix</h4>
                            
                            {remarks.map((remark, index) => (
                              <div key={index} className="flex gap-4 items-start relative pl-6">
                                <div className="absolute left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 ring-4 ring-blue-500/10" />
                                
                                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 shadow-sm max-w-2xl">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800 pb-1.5 mb-1.5">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                      Action Record #{index + 1} — By {approvers[index] || "Unknown Admin"}
                                    </span>
                                    {dates[index] && (
                                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> {dates[index]}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 italic flex items-start gap-1">
                                    <MessageSquare className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                                    <span>{remark || "No explanatory notes provided for this action cycle."}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
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
