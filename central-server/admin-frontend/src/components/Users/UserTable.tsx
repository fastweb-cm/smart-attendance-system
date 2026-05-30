"use client";

import React from 'react';
import { ChevronRight, Database, ShieldAlert, Eye, Edit2, Trash2 } from 'lucide-react';
import Pagination from '../ui/pagination';
import { UserTableProps } from '@/types';

// 5 deep background tokens that loop cleanly based on database indices
const avatarColors = ['bg-emerald-500','bg-indigo-500','bg-amber-500','bg-rose-500'];

export default function UserTable({
  users,
  paginationMeta,
  onView,
  onEdit,
  onDelete
}: UserTableProps) {
  
  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-112.5 w-full">
        
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 text-slate-800 font-medium text-sm tracking-wide flex items-center justify-between">
            <div>
                <h2 className="font-extrabold tracking-wider text-slate-900 uppercase">
                  UNIFIED TENANT MATRIX REGISTRY
                </h2>
                <p className="text-xs mt-1 text-slate-500">
                  Cross-institution ledger layout mapping active profiles, biometric synchronization logs, and platform status.
                </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-1 rounded font-mono flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                  <Database className="w-3 h-3" /> Omnis-Ledger Pipeline
              </span>
            </div>
        </div>

        <div className="flex-1 w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-auto">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide border-b border-slate-200 font-mono text-[11px]">
                    <tr>
                        <th className="p-4 border-r border-b border-slate-200 bg-slate-50 font-bold text-slate-700 pl-6">
                          Identity Credentials
                        </th>
                        <th className="p-3 border-r border-b border-slate-200 text-slate-700 font-bold">
                          Registration ID
                        </th>
                        <th className="p-3 border-r border-b border-slate-200 text-slate-700 font-bold">
                          Corporate Email Address
                        </th>
                        <th className="p-3 border-r border-b border-slate-200 text-center text-slate-700 font-bold w-32">
                          Biometrics
                        </th>
                        <th className="p-3 border-r border-b border-slate-200 text-center text-slate-700 font-bold w-32">
                          Account Status
                        </th>
                        <th className="p-3 text-center bg-slate-100/80 border-b border-slate-200 w-32 font-bold text-slate-700">
                          Action
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400 text-sm bg-white">
                                <div className="flex flex-col items-center gap-3">
                                    <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
                                    <span className='text-rose-500 font-medium'>
                                      No operational identity records captured within this tenant block configuration.
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                      users.map((u, index) => {
                        if (u.id === undefined) return null;

                        // 1. Assign automated sequential looped backgrounds
                        const colorTheme = avatarColors[index % avatarColors.length];

                        // 2. Compute adaptive layout labels gracefully
                        const isStudent = u.username?.toLowerCase().includes('student') || (u as { user_type: string }).user_type === 'student';
                        
                        // Smart positioning: display context classifications without leaving empty dashes
                        const subContextLabel = isStudent
                          ? `${u.gender} • Student ${u.class ? `• Class ${u.class}` : ''}`
                          : `${u.gender} • Employee ${u.role ? `• ${u.role}` : ''}`;

                        const isBiometricDone = u.biometric_enrollment_status === 'completed';
                        const bioBadgeStyle = isBiometricDone 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200';

                        let statusBadgeStyle = "bg-slate-100 text-slate-600 border border-slate-200";
                        if (u.status === "active") statusBadgeStyle = "bg-blue-50 text-blue-700 border border-blue-200";
                        if (u.status === "dismissed") statusBadgeStyle = "bg-rose-50 text-rose-700 border border-rose-200";

                        return (
                            <tr key={u.id} className='hover:bg-slate-50/60 transition group cursor-pointer text-xs' onClick={() => onView(u.id!)}>
                                
                                {/* Identity Credentials Cell */}
                                <td className="bg-white group-hover:bg-slate-50 transition p-3 pl-6 border-r border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-lg ${colorTheme} flex items-center justify-center font-black shadow-sm font-mono text-xs border shrink-0 uppercase`}>
                                          {u.name?.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="truncate">
                                          <span className="font-bold text-slate-800 group-hover:text-blue-600 transition truncate block text-xs">
                                              {u.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono truncate block mt-0.5">
                                              {subContextLabel}
                                          </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition ml-2" />
                                </td>

                                {/* Registration ID Cell */}
                                <td className="p-3 border-r border-slate-200 font-bold text-slate-700">
                                    {u.regno || "—"}
                                </td>

                                {/* Corporate Email Address Cell */}
                                <td className="p-3 border-r border-slate-200 text-slate-600 font-medium truncate max-w-[200px]">
                                    {u.email || "—"}
                                </td>

                                {/* Biometric Tracker Badge */}
                                <td className="p-3 border-r border-slate-200 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${bioBadgeStyle}`}>
                                        {u.biometric_enrollment_status || "pending"}
                                    </span>
                                </td>

                                {/* Account Status State */}
                                <td className="p-3 border-r border-slate-200 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight w-full max-w-22.5 text-center ${statusBadgeStyle}`}>
                                        {u.status}
                                    </span>
                                </td>

                                {/* Action Suite Trigger Rows */}
                                <td className="p-3 text-center bg-slate-50/20" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <button onClick={() => onView(u.id!)} className="p-1.5 bg-white border border-slate-200 cursor-pointer rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition shadow-sm">
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => onEdit(u.id!)} className="p-1.5 bg-white border border-slate-200 cursor-pointer rounded-lg text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition shadow-sm">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button title={`Delete employee ${u.name}`} onClick={() => onDelete(u)} className="p-1.5 bg-white border border-slate-200 cursor-pointer rounded-lg text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition shadow-sm">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>

                            </tr>
                        )
                      })
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
