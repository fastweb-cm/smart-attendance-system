"use client";

import React, { useState } from 'react';
import { useLogs } from '@/hooks/useLogs';
import { logsCategories, LogsQueryParams, PaginationMetaProps } from '@/types';
import { LogsFilter } from './LogsFilter';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import LogsTable from './LogsTable';

export default function Logs({ category, disabled }: { category: logsCategories, disabled: boolean }) {
  const [filters, setFilters] = useState<LogsQueryParams>({
    category: category,
    level: undefined,
    start_date: "",
    end_date: "",
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isError, error, isFetching, refetch } = useLogs(filters);

  const logs = data?.data || [];

  const handleFilterChange = (key: keyof LogsQueryParams, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
      // Reset page back to 1 if any alternate query filter parameter mutates
      page: key === 'page' ? Number(value) : 1,
    }));
  };

  const paginationMeta: PaginationMetaProps = {
    total_records: data?.meta?.total_records ?? 0,
    current_page: data?.meta?.current_page ?? 1,
    total_pages: data?.meta?.total_pages ?? 1,
    limit: filters.limit || 10,
    onPageChange: (newPage) => handleFilterChange('page', newPage.toString()),
  };

  const handleResetFilters = () => {
    setFilters({
      category: category,
      level: undefined,
      start_date: "",
      end_date: "",
      page: 1,
      limit: 10,
    });
  };

  return (
    <div className="space-y-6 w-full">
      <LogsFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        disabled={disabled}
      />

      <div className="relative min-h-75">
        {isLoading ? (
          /* Initial Component Loading State */
          <div className="w-full h-80 border border-slate-200 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mb-3" />
            <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Fetching Audit Logs...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Querying system runtime data, decoding event payloads, and structure-mapping log history pipelines.</p>
          </div>
        ) : isError ? (
          /* API Communication Failure UI Boundary */
          <div className="w-full border border-rose-200 bg-rose-50/40 rounded-xl flex flex-col items-center justify-center p-12 text-center shadow-inner">
            <div className="p-3 bg-rose-100 rounded-full text-rose-600 mb-4 border border-rose-200 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">Log Pipeline Disconnected</h3>
            <p className="text-xs text-rose-700/80 mt-1 max-w-md font-medium">
              {error instanceof Error ? error.message : "An unexpected communication error occurred while pulling system audit records."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-sync Event Database
            </button>
          </div>
        ) : (
          /* Background Active Sync Processing Overlays */
          <div className="transition-all duration-200">
            {isFetching && (
              <div className="absolute top-4 right-6 z-40 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-slate-500 font-medium font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm">
                <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                Refreshing Streams...
              </div>
            )}

            <div className={isFetching ? "opacity-75 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
              <LogsTable logs={logs} paginationMeta={paginationMeta} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
