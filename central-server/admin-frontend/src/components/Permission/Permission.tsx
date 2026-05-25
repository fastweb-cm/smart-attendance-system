"use client";

import React, { useState, useEffect } from 'react';
import { PermissionQueryParams, PaginationMetaProps, PermissionRowType } from '@/types';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import PermissionTable from './PermissionTable';
import { PermissionFilter } from './PermissionFilter';
import { useAllPermissions, useDeletePermission } from '@/hooks/usePermissions';
import { GlobalDeleteModal } from '../modals/GlobalDeleteModal';



export default function Permission() {
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 1. Modal Operational States
  const [selectedPermission, setSelectedPermission] = useState<PermissionRowType | null>(null);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Core structured query parameters
  const [filters, setFilters] = useState<PermissionQueryParams>({
    search: undefined,
    status: undefined,
    start_date: "",
    end_date: "",
    page: 1,
    limit: 10,
  });

  // Debounce Effect for the user search input stream
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm === "" ? undefined : searchTerm,
        page: 1,
      }));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Data Query and Mutation Hooks
  const { data, isLoading, isError, error, isFetching, refetch } = useAllPermissions(filters);
  const deletePermissionMutation = useDeletePermission();

  const permissionsList = data?.data || [];

  // Unified parameter mutation engine
  const handleFilterChange = (key: keyof PermissionQueryParams, value: string | undefined) => {
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

  const paginationMeta: PaginationMetaProps = {
    total_records: data?.meta?.total_records ?? 0,
    current_page: data?.meta?.current_page ?? 1,
    total_pages: data?.meta?.total_pages ?? 1,
    limit: filters.limit || 10,
    onPageChange: (newPage) => handleFilterChange('page', newPage.toString()),
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilters({
      search: undefined,
      status: undefined,
      start_date: "",
      end_date: "",
      page: 1,
      limit: 10,
    });
  };

  // 2. Intercept table actions to activate deletion flow context
  const handleDeleteTrigger = (permission: PermissionRowType) => {
    setSelectedPermission(permission);
    setOpenDelete(true);
  };

  const handleEditPermission = (permission: PermissionRowType) => {
    console.log("Trigger Edit Modal Context:", permission);
  };

  const handleReviewPermission = (permission: PermissionRowType) => {
    console.log("Trigger Review/Approval Dialog Vector:", permission);
  };

  // 3. Confirm Deletion Callback Pipeline Execution
  const onConfirmDelete = async () => {
    if (!selectedPermission || !selectedPermission.id) return;
    setIsDeleting(true);
    try {
      // Executes API path deletion mapping payload structure
      await deletePermissionMutation.mutateAsync({ path: { id: selectedPermission.id } });
      setOpenDelete(false);
    } catch (err) {
      console.error("Failed executing permission document deletion process:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <PermissionFilter
        filters={{ ...filters, search: searchTerm }}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <div className="relative min-h-75">
        {isLoading ? (
          <div className="w-full h-80 border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm tracking-wide uppercase">Loading Permissions...</h3>
          </div>
        ) : isError ? (
          <div className="w-full border border-rose-200 bg-rose-50/40 dark:bg-rose-950/10 dark:border-rose-900/50 rounded-xl flex flex-col items-center justify-center p-12 text-center shadow-inner">
            <div className="p-3 bg-rose-100 dark:bg-rose-950 rounded-full text-rose-600 dark:text-rose-400 mb-4 border border-rose-200 dark:border-rose-800 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-sm tracking-wide uppercase">Data Synchronization Failed</h3>
            <button onClick={() => refetch()} className="mt-5 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Re-sync Permission Stream
            </button>
          </div>
        ) : (
          <div className="transition-all duration-200">
            {isFetching && (
              <div className="absolute top-4 right-6 z-40 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
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
                onDelete={handleDeleteTrigger} // Mapped to trigger open state
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Global Confirmation Vector Portal Overlay */}
      <GlobalDeleteModal 
        open={openDelete}
        onOpenChange={setOpenDelete}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
        title={`Delete Permission Request for "${selectedPermission?.employee_name || `Staff #${selectedPermission?.user_id}`}"?`}
        description={`Are you sure you want to drop this ${selectedPermission?.permission_type_name || 'request'} duration instance (${selectedPermission?.start_date} to ${selectedPermission?.end_date})? This operation cannot be undone.`}
      />
    </div>
  );
}
