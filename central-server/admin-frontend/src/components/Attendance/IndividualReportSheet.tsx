"use client";

import { useUserAttendanceAnalytics } from '@/hooks/useAttendance';
import { AttendanceQueryParams, IndividualReportSheetProps } from '@/types'
import { AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import React, { useState } from 'react'
import ZoneAMetrics from './ZoneAMetrics';
import ZoneBAuditLedger from './ZoneBAuditLedger';
import { getPreviousDay } from '@/lib/utils';
import { ZoneCRawTrail } from './ZoneCRawTrails';


export default function IndividualReportSheet({
    isOpen,
    onClose,
    filteredEmployee,
    queryParams
}: IndividualReportSheetProps) {
  
  // Synchronized state tracking bounds matching your exact backend payload keys
  const [filters, setFilters] = useState<AttendanceQueryParams>({
    //   status: "",
    context: queryParams.context,
    start_date: "",
    end_date: "",
    page: 1,
    limit: 10
  });

  //zone c selected audit date
  const [selectedAuditDate, setSelectedAuditDate] = useState(getPreviousDay);

  // Prepare optimized params payload object for your hook query request
  const params: AttendanceQueryParams = {
    context: filters.context,
    //   status: filters.status === '' ? undefined : filters.status,
    start_date: filters.start_date,
    end_date: filters.end_date,
    page: filters.page,
    limit: filters.limit
  };

  //tanstack query
  const { data, isLoading, isError, error, isFetching, refetch } = useUserAttendanceAnalytics(filteredEmployee.id ?? 0, params)

  const handleZoneBRowClick = (date: string) => {
    setSelectedAuditDate(date);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
        {/* Drawer backdrop animation overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white border-l border-slate-800 shadow-2xl flex flex-col h-full transform transition-transform duration-300 translate-x-0">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${filteredEmployee?.avatarColor} flex items-center justify-center text-white font-black text-sm border border-white/10 shadow`}>
                    {filteredEmployee?.name?.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                    <h3 className="text-sm font-extrabold text-text tracking-wider flex items-center gap-2 font-mono">
                    {filteredEmployee?.name}
                    </h3>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">{filteredEmployee?.regno} • {filteredEmployee?.role}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md cursor-pointer hover:bg-red-600 text-slate-400 hover:text-slate-100 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* dense vertical scroll panels containing zones */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            { isLoading ? (
                <div className="flex flex-col justify-center items-center text-center p-8">
                    <Loader2  className="w-9 h-9 text-blue-600 animate-spin mb-3"/>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">Loading {filteredEmployee.name} attendance session data </p>
                </div>
            ): isError ? (
                <div className='w-full border border-rose-200 bg-rose-50/40 rounded-xl flex flex-col items-center justify-center p-12 text-center shadow-inner'>
                    <div className="p-3 bg-rose-100 rounded-full text-rose-600 mb-4 border border-rose-200 shadow-sm">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">Data Pipeline Interrupted</h3>
                    <p className="text-xs text-rose-700/80 mt-1 max-w-md font-medium">
                        {error instanceof Error ? error.message : `An unexpected error occurred while fetch ${filteredEmployee.name} attendance session data.`}
                    </p>
                    <button 
                        onClick={() => refetch()} 
                        className="mt-5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm text-xs transition flex items-center gap-2 cursor-pointer"
                        >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-establish Server Connection
                    </button>
                </div>
            ): (
                /* Smooth Background Query Sync Progress Indicator Overlays */
                <div className="transition-all duration-200">
                    {isFetching && (
                        <div className="absolute top-4 right-6 z-40 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-slate-500 font-medium font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm animate-fade-in">
                        <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                            Loading data...
                        </div>
                    )}

                    <div className={isFetching ? "opacity-75 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
                        <ZoneAMetrics
                            expected_days={data?.metrics.expected_days}
                            present_days={data?.metrics.present_days}
                            late_arrivals={data?.metrics.late_arrivals}
                            absent_days={data?.metrics.absent_days}
                            permission_days={data?.metrics.permission_days}
                            queryParams={queryParams}
                            user={filteredEmployee.name ?? ""}
                        />

                        <ZoneBAuditLedger 
                            userId={filteredEmployee.id ?? 0}
                            queryParams={queryParams}
                            onRowClick={handleZoneBRowClick}
                        />

                        <ZoneCRawTrail
                            userId={filteredEmployee.id ?? 0}
                            queryParams={queryParams}
                            selectedAuditDate={selectedAuditDate}
                        />
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  )
}
