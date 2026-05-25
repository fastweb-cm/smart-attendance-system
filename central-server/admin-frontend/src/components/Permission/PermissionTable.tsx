"use client";

import React from 'react';
import { ShieldAlert, Calendar, Edit2, CheckSquare, Trash2, FileText, ShieldCheck } from 'lucide-react';
import { PermissionTableProps } from '@/types';
import Pagination from '../ui/pagination';

type PermissionRowType = NonNullable<PermissionTableProps["data"]>[number];

export default function PermissionTable({
  data = [],
  onEdit,
  onReview,
  onDelete,
  paginationMeta
}: PermissionTableProps) {

  const statusStyles = {
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

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
      
      {/* Table title and descriptive operational action header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-medium text-sm tracking-wide flex items-center justify-between">
        <div>
          <h2 className="font-extrabold tracking-wider text-slate-900 dark:text-slate-100 uppercase text-xs">Employee Permission Registry Ledger</h2>
          <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-normal">Evaluate workflow requests, manage execution parameters, or apply administrative audit reviews.</p>
        </div>
        <div className="flex items-center gap-2 hidden sm:flex">
          <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 text-[10px] px-2 py-1 rounded font-mono flex items-center gap-1.5 font-semibold uppercase">
            <ShieldCheck className="w-3 h-3" /> Secure Access Pipeline
          </span>
        </div>
      </div>

      {/* Main grid table container viewport */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              <th className="py-3.5 px-6">Employee Name</th>
              <th className="py-3 px-4">Permission Type</th>
              <th className="py-3 px-4">Duration Period</th>
              <th className="py-3 px-4">Stated Reason</th>
              <th className="py-3 px-4 text-center w-28">Status</th>
              <th className="py-3 px-6 text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {data
              .filter((row) => typeof row.id === 'number')
              .map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition text-slate-700 dark:text-slate-300"
                >
                  {/* Employee Name */}
                  <td className="py-3.5 px-6 font-medium text-slate-900 dark:text-slate-100">
                    {row.employee_name || `Staff ID #${row.user_id}`}
                  </td>

                  {/* Permission Type Name */}
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {row.permission_type_name}
                    </span>
                  </td>

                  {/* Duration Dates */}
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{row.start_date}</span>
                      <span className="text-slate-300 dark:text-slate-700">→</span>
                      <span>{row.end_date}</span>
                    </div>
                  </td>

                  {/* Reason Text */}
                  <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                    <span title={row.reason || ""}>{row.reason || "—"}</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyles[row.status as 'pending' | 'approved' | 'rejected'] || ''}`}>
                      {row.status}
                    </span>
                  </td>

                  {/* Custom Action Controls Row */}
                  <td className="py-3 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Action 1: Review Status */}
                      <button
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition shadow-sm"
                        onClick={() => onReview(row)}
                        title="Review Status Decision"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>

                      {/* Action 2: Edit (Disabled if reviewed) */}
                      <button
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => onEdit(row)}
                        disabled={row.status !== 'pending'}
                        title="Edit Request Parameters"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Action 3: Cancel / Delete (Disabled if reviewed) */}
                      <button
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => onDelete(row)}
                        disabled={row.status !== 'pending'}
                        title="Delete Pending Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
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
