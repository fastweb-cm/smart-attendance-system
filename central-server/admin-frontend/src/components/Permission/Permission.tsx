"use client";

import React, { useState, useEffect } from 'react';
import { PermissionQueryParams, PaginationMetaProps, PermissionRowType } from '@/types';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import PermissionTable from './PermissionTable';
import { useAllPermissions } from '@/hooks/usePermissions';
import { PermissionFilter } from './PermissionFilter';

export default function Permission() {
  // 1. Keep the local state for the responsive, immediate UI text input
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Core structured query parameters for TanStack query instances
  const [filters, setFilters] = useState<PermissionQueryParams>({
    search: undefined,
    status: undefined,
    start_date: "",
    end_date: "",
    page: 1,
    limit: 10,
  });

  // 2. Debounce Effect: Wait 400ms after typing stops before updating query filter parameters
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm === "" ? undefined : searchTerm,
        page: 1, // Reset page back to 1 on new filter evaluation
      }));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Fetch data map via TanStack React Query hook wrapper
  const { data, isLoading, isError, error, isFetching, refetch } = useAllPermissions(filters);

  const permissionsList = data?.data || [];

  // Unified parameter mutation engine
  const handleFilterChange = (key: keyof PermissionQueryParams, value: string | undefined) => {
    // Intercept search updates so they go through our local debouncer instead of breaking server queries
    if (key === "search") {
      setSearchTerm(value || "");
      return;
    }

    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
      page: key === 'page' ? Number(value) : 1,
    }));
  };

  // Build the complete pagination configuration payload for the child table
  const paginationMeta: PaginationMetaProps = {
    total_records: data?.meta?.total_records ?? 0,
    current_page: data?.meta?.current_page ?? 1,
    total_pages: data?.meta?.total_pages ?? 1,
    limit: filters.limit || 10,
    onPageChange: (newPage) => handleFilterChange('page', newPage.toString()),
  };

  const handleResetFilters = () => {
    setSearchTerm(""); // Clear text field immediately
    setFilters({
      search: undefined,
      status: undefined,
      start_date: "",
      end_date: "",
      page: 1,
      limit: 10,
    });
  };

  // Explicit Action Handlers matching Table Callback Typings
  const handleEditPermission = (permission: PermissionRowType) => {
    console.log("Trigger Edit Modal Context:", permission);
  };

  const handleReviewPermission = (permission: PermissionRowType) => {
    console.log("Trigger Review/Approval Dialog Vector:", permission);
  };

  const handleDeletePermission = (permission: PermissionRowType) => {
    console.log("Trigger Database Deletion Guard Pipeline:", permission.id);
  };

  return (
    <div className="space-y-6 w-full">
      {/* We overwrite filters.search on the fly for the input value binding */}
      <PermissionFilter
        filters={{ ...filters, search: searchTerm }}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <div className="relative min-h-75">
        {isLoading ? (
          <div className="w-full h-80 border border-slate-200 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
            <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Loading Permissions...</h3>
          </div>
        ) : isError ? (
          <div className="w-full border border-rose-200 bg-rose-50/40 rounded-xl flex flex-col items-center justify-center p-12 text-center shadow-inner">
            <div className="p-3 bg-rose-100 rounded-full text-rose-600 mb-4 border border-rose-200 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">Data Synchronization Failed</h3>
            <button onClick={() => refetch()} className="mt-5 px-4 py-2 bg-white text-slate-700 font-semibold border border-slate-200 rounded-lg text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Re-sync Permission Stream
            </button>
          </div>
        ) : (
          <div className="transition-all duration-200">
            {isFetching && (
              <div className="absolute top-4 right-6 z-40 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                Refreshing Ledger...
              </div>
            )}

            <div className={isFetching ? "opacity-75 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
              <PermissionTable 
                data={permissionsList} 
                paginationMeta={paginationMeta}
                onEdit={handleEditPermission}
                onReview={handleReviewPermission}
                onDelete={handleDeletePermission}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
