"use client";

import React, { useState } from 'react';
import { SessionsFilterBar } from './SessionsFilterBar';
import SessionsHeader from './SessionsHeader';
import SessionsTable from './SessionsTable';
import { AttendanceSessionQueryParams, PaginationMetaProps } from '@/types';
import { useAttendanceSessions } from '@/hooks/useAttendance';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AttendanceSessions() {
  const [filters, setFilters] = useState<AttendanceSessionQueryParams>({
    from_date: todayStr(),
    to_date: todayStr(),
    context: "all",
    page: 1,
    limit: 25,
  });

  // "Live" only makes sense when the range actually includes today —
  // don't poll a historical query on a timer.
  const isLive = filters.to_date === todayStr();

  const { data, isLoading, isError, error, isFetching, refetch } = useAttendanceSessions(filters, { live: isLive });

  const sessions = data?.sessions ?? [];
  const metrics = data?.metrics ?? {};

  const handleFilterChange = (key: keyof AttendanceSessionQueryParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? (value as number) : 1 }));
  };

  const handleReset = () => {
    setFilters({ from_date: todayStr(), to_date: todayStr(), context: "all", page: 1, limit: 25 });
  };

  const paginationMeta: PaginationMetaProps = {
    total_records: data?.meta?.total_records ?? 0,
    current_page: data?.meta?.current_page ?? 1,
    total_pages: data?.meta?.total_pages ?? 1,
    limit: filters.limit ?? 25,
    onPageChange: (newPage) => handleFilterChange("page", newPage),
  };

  return (
    <div className="space-y-8 w-full">
      <SessionsHeader metrics={metrics} />

      <SessionsFilterBar filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />

      <div className="relative min-h-112.5">
        {isLoading ? (
          <div className="w-full h-112.5 border border-slate-200 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
            <h3 className="text-slate-800 font-bold text-sm uppercase">Loading Sessions...</h3>
          </div>
        ) : isError ? (
          <div className="w-full border border-rose-200 bg-rose-50/40 rounded-xl flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-6 h-6 text-rose-600 mb-3" />
            <p className="text-xs text-rose-700/80 font-medium">
              {error instanceof Error ? error.message : "Failed to load session data."}
            </p>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : (
          <SessionsTable sessions={sessions} paginationMeta={paginationMeta} isRefreshing={isFetching && isLive} />
        )}
      </div>
    </div>
  );
}
