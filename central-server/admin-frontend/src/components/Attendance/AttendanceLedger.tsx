"use client";

import React, { useEffect, useState } from 'react';
import { AttendanceFilterBar } from './AttendanceFilterBar';
import { AttendanceQueryParams, PaginationMetaProps } from '@/types';
import { useAttendanceLedger } from '@/hooks/useAttendance';
import AttendanceHeader from './AttendanceHeader';
import AttendanceTable from './AttendanceTable';
import IndividualReportSheet from './IndividualReportSheet';
import { AttendanceLedgerData } from '@/client';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { getStartDate } from '@/lib/utils';

export default function AttendanceLedger() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AttendanceLedgerData['users'][number]>({
    id: undefined,
    name: "",
    role: "",
    regno: "",
    avatarColor: ""
  })

  // Synchronized state tracking bounds matching your exact backend payload keys
  const [filters, setFilters] = useState<AttendanceQueryParams & { search?: string }>({
    search: "",
    status: "",
    context: "daily", // Explicitly starting with your preferred default context configuration
    start_date: getStartDate(),
    end_date: new Date().toISOString().split('T')[0],
    page: 1,
    limit: 10
  });

  // Local state to manage smooth search debounce throttling
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400); // 400ms delay window

    return () => clearTimeout(handler);
  }, [filters.search]);

  // Prepare optimized params payload object for your hook query request
  const queryParams: AttendanceQueryParams = {
    context: filters.context,
    // Safely normalize "all" dropdown options to undefined so your API doesn't treat "all" as a literal string status flag
    status: filters.status === '' ? undefined : filters.status,
    start_date: filters.start_date,
    end_date: filters.end_date,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    page: filters.page,
    limit: filters.limit
  };

  // Consume the TanStack Query hook using current state values
  const { data, isLoading, isError, error, isFetching, refetch } = useAttendanceLedger(queryParams);

  // Safely extract responses from the query result with fallback defaults to prevent runtime errors during loading states
  const metrics = data?.metrics || {};
  const calendarDates = data?.calendarDates || [];
  const users = data?.users || [];
  const exceptions = data?.exceptions || [];
  const attendanceSummary = data?.attendanceSummary || [];

  // 3. Type-safe configuration change link handler
  const handleFilterChange = (key: keyof AttendanceQueryParams | 'search', value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value 
    }));
  };

  // prepare the pagination meta props
  const paginationMeta: PaginationMetaProps = {
    total_records: (data?.users ?? []).length > 0 ? (data?.meta?.total_records ?? 0) : 0,
    current_page: (data?.users ?? []).length > 0 ? (data?.meta?.current_page ?? 1) : 1,
    total_pages: (data?.users ?? []).length > 0 ? (data?.meta?.total_pages ?? 1) : 1,
    limit: filters.limit || 10,
    onPageChange: (newPage) => handleFilterChange('page', newPage.toString())
  }

  // 4. Complete filter state reset anchor
  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      context: "daily",
      start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      page: 1,
      limit: 10
    });
  };

  const handleRowClick = (id: number) => {
    // find the user object by id from the active list
    const selected = users.find(u => u.id === id);
    
    if (selected) {
      setSelectedUser(selected);
      setIsSheetOpen(true)
    }
  }

  return (
    <div className="space-y-8 w-full">
      {/* Sticky Header Container */}
      <AttendanceHeader globalMetrics={metrics} />

      {/* Filter Bar */}
      <AttendanceFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <div className="relative min-h-112.5">
        {isLoading ? (
          /* Hard Initial Mounting Skeleton Screen Loader */
          <div className="w-full h-112.5 border border-slate-200 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
            <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Constructing Ledger Matrix...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Fetching records, computing holiday rules, and formatting cell indices.</p>
          </div>
        ) : isError ? (
          /* Central API Failure / Error Message Boundary */
          <div className="w-full border border-rose-200 bg-rose-50/40 rounded-xl flex flex-col items-center justify-center p-12 text-center shadow-inner">
            <div className="p-3 bg-rose-100 rounded-full text-rose-600 mb-4 border border-rose-200 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">Data Pipeline Interrupted</h3>
            <p className="text-xs text-rose-700/80 mt-1 max-w-md font-medium">
              {error instanceof Error ? error.message : "An unexpected error occurred while processing matrix ledger streams."}
            </p>
            <button 
              onClick={() => refetch()} 
              className="mt-5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-establish Server Connection
            </button>
          </div>
        ) : (
          /* Smooth Background Query Sync Progress Indicator Overlays */
          <div className="transition-all duration-200">
            {isFetching && (
              <div className="absolute top-4 right-6 z-40 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-slate-500 font-medium font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm animate-fade-in">
                <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                Syncing Matrix...
              </div>
            )}
            
            <div className={isFetching ? "opacity-75 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
              <AttendanceTable 
                calendarDates={calendarDates} 
                users={users} 
                exceptions={exceptions} 
                attendanceSummary={attendanceSummary} 
                context={filters.context || "daily"} 
                paginationMeta={paginationMeta} 
                onRowClick={handleRowClick}
              />
            </div>
          </div>
        )}
      </div>

      {/* individual attendance sheet */}
      <IndividualReportSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        filteredEmployee={selectedUser}
        queryParams={queryParams}
      />
    </div>
  );
}
