"use client";

import React, { useState, useEffect } from 'react';
import { PermissionQueryParams, PaginationMetaProps, PermissionRowType } from '@/types';
import { AlertCircle, Loader2, RefreshCw, Plus } from 'lucide-react';
import PermissionTable from './PermissionTable';
import { PermissionFilter } from './PermissionFilter';
import PermissionForm from '../forms/PermissionForm';
import PermissionReviewForm from '../forms/PermissionReviewForm'; // Import review form
import { GlobalDeleteModal } from '../modals/GlobalDeleteModal';
import { useAllPermissions, useDeletePermission } from '@/hooks/usePermissions';


// Manage form view routing modes cleanly
type ViewState = 'list' | 'create_edit' | 'review';

export default function Permission() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // View switcher tracking state matrix
  const [viewMode, setViewMode] = useState<ViewState>('list');
  const [selectedPermission, setSelectedPermission] = useState<PermissionRowType | null>(null);
  
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [filters, setFilters] = useState<PermissionQueryParams>({
    search: undefined,
    status: undefined,
    start_date: "",
    end_date: "",
    page: 1,
    limit: 10,
  });

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

  const { data, isLoading, isError, error, isFetching, refetch } = useAllPermissions(filters);
  const deletePermissionMutation = useDeletePermission();
  const permissionsList = data?.data || [];

  const handleFilterChange = (key: keyof PermissionQueryParams, value: string | undefined) => {
    if (key === "search") {
      setSearchTerm(value || "");
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value === "" ? undefined : value, page: key === 'page' ? Number(value) : 1 }));
  };

  const paginationMeta: PaginationMetaProps = {
    total_records: data?.meta?.total_records ?? 0,
    current_page: data?.meta?.current_page ?? 1,
    total_pages: data?.meta?.total_pages ?? 1,
    limit: filters.limit || 10,
    onPageChange: (newPage) => handleFilterChange('page', newPage.toString()),
  };

  const handleEditPermission = (permission: PermissionRowType) => {
    setSelectedPermission(permission);
    setViewMode('create_edit');
  };

  // WIRE POINT: Triggers the alternative flat layout review screen panel context
  const handleReviewPermission = (permission: PermissionRowType) => {
    setSelectedPermission(permission);
    setViewMode('review');
  };

  const resetToDefaultList = () => {
    setViewMode('list');
    setSelectedPermission(null);
  };

  const onConfirmDelete = async () => {
    if (!selectedPermission || !selectedPermission.id) return;
    setIsDeleting(true);
    try {
      await deletePermissionMutation.mutateAsync({ path: { id: selectedPermission.id } });
      setOpenDelete(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full relative min-h-[calc(100vh-8rem)]">
      
      {/* View Matrix Route Switcher Rendering */}
      {viewMode === 'create_edit' && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
          <PermissionForm 
            initialData={selectedPermission}
            onCancel={resetToDefaultList}
          />
        </div>
      )}

      {viewMode === 'review' && selectedPermission && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
          <PermissionReviewForm 
            permissionData={selectedPermission}
            onCancel={resetToDefaultList}
          />
        </div>
      )}

      {viewMode === 'list' && (
        <>
          <PermissionFilter
            filters={{ ...filters, search: searchTerm }}
            onFilterChange={handleFilterChange}
            onReset={() => {
              setSearchTerm("");
              setFilters({ search: undefined, status: undefined, start_date: "", end_date: "", page: 1, limit: 10 });
            }}
          />

          <div className="relative min-h-75">
            {isLoading ? (
              <div className="w-full h-80 border border-slate-200 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
                <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Loading Permissions...</h3>
              </div>
            ) : isError ? (
              <div className="w-full border border-rose-200 bg-rose-50/40 rounded-xl flex flex-col items-center justify-center p-12 text-center shadow-inner">
                <h3 className="text-slate-900 font-extrabold text-sm tracking-wide uppercase">Data Sync Failed</h3>
                <button onClick={() => refetch()} className="mt-5 px-4 py-2 bg-white text-slate-700 font-semibold border border-slate-200 rounded-lg text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Re-sync Stream
                </button>
              </div>
            ) : (
              <div className="transition-all duration-200">
                {isFetching && (
                  <div className="absolute top-4 right-6 z-40 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-wider">
                    <Loader2 className="w-3 h-3 text-blue-600 animate-spin" /> Refreshing Ledger...
                  </div>
                )}
                <PermissionTable 
                  data={permissionsList} 
                  paginationMeta={paginationMeta} 
                  onEdit={handleEditPermission} 
                  onReview={handleReviewPermission} // Correctly wired up
                  onDelete={(p) => { setSelectedPermission(p); setOpenDelete(true); }} 
                />
              </div>
            )}
          </div>

          {/* Floating action button creation request trigger node link */}
          <button
            onClick={() => {
              setSelectedPermission(null);
              setViewMode('create_edit');
            }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xl hover:shadow-2xl font-bold text-xs tracking-wider uppercase px-5 py-3.5 rounded-full hover:scale-105 transition active:scale-95 group border border-slate-800 dark:border-slate-200 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-500 group-hover:rotate-90 transition-transform duration-200 stroke-[3]" />
            <span>Create Request</span>
          </button>
        </>
      )}

      <GlobalDeleteModal open={openDelete} onOpenChange={setOpenDelete} onConfirm={onConfirmDelete} loading={isDeleting} title={`Delete Permission Request for "${selectedPermission?.employee_name || `Staff #${selectedPermission?.user_id}`}"?`} description={`Are you sure you want to drop this leave duration instance (${selectedPermission?.start_date} to ${selectedPermission?.end_date})? This operation cannot be undone.`} />
    </div>
  );
}
