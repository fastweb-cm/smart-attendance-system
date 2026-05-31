"use client";

import React, { useState, useCallback } from "react";
import { useDeleteEmployee, useUsers } from "@/hooks/useUsers";
import { ListusersFilters } from "@/services/users/queries";
import { UserQueryFilterBar } from "./UserQueryFilterBar";
import UserTable from "./UserTable";
import { GlobalDeleteModal } from "../modals/GlobalDeleteModal";
import { UserResponse } from "@/client";
import EmployeeForm from "../forms/EmployeeForm";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../ui/button";

type ViewMode = "table" | "form";

export default function UsersDirectoryView() {
  // Navigation & Form State Hooks
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [formUserType, setFormUserType] = useState<"student" | "staff">("student");
  const [selectedEmployee, setSelectedEmployee] = useState<UserResponse | undefined>(undefined);

  const [filters, setFilters] = useState<ListusersFilters>({
    user_type: undefined,
    role: undefined,
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
  });

  // delete modal states 
  const deleteEmployeeMut = useDeleteEmployee();
  const [selected, setSelected] =
      useState<UserResponse | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: responseMatrix } = useUsers(filters);

  const handleFilterChange = useCallback((key: keyof ListusersFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      user_type: undefined,
      role: undefined,
      page: 1,
      limit: 10,
      search: undefined,
      status: undefined,
    });
  }, []);

  const handlePageChange = useCallback((targetPage: number) => {
    setFilters((prev) => ({ ...prev, page: targetPage }));
  }, []);

  const handleDeleteTrigger = (user: UserResponse) => {
      setSelected(user);
      setOpenDelete(true);
    }
  const onConfirmDelete = async () => {
    if (!selected || selected.id === undefined) return;
    setIsDeleting(true);
    try {

      await deleteEmployeeMut.mutateAsync({ path:{ id: selected.id } });
      setOpenDelete(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = (type: "student" | "staff") => {
    setSelectedEmployee(undefined);
    setFormUserType(type);
    setViewMode("form");
  };

  const handleOpenEdit = (user: UserResponse) => {
    if (user.id === undefined) return;
    setSelectedEmployee(user);
    // Dynamically match user type coming out of row mapping
    setFormUserType(user.user_type === "staff" ? "staff" : "student");
    setViewMode("form");
  };

  const handleCloseForm = () => {
    setSelectedEmployee(undefined);
    setViewMode("table");
  };

  if (viewMode === "form") {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleCloseForm}
            className="flex items-center gap-2 text-xs font-bold font-mono tracking-wide text-slate-500 hover:text-slate-800 transition bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Directory List
          </button>
        </div>

        <EmployeeForm 
          initialData={selectedEmployee}
          fallbackUserType={formUserType} 
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* Dynamic Creation Trigger Header Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Overview
          </span>
          <span className="text-sm font-bold text-slate-700">
            All Accounts & Registration
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleOpenCreate("student")}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold rounded-lg shadow-sm gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Onboard Student
          </Button>
          <Button 
            onClick={() => handleOpenCreate("staff")}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg shadow-sm gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Onboard Employee
          </Button>
        </div>
      </div>
      <UserQueryFilterBar filters={filters} onFilterChange={handleFilterChange} onReset={handleResetFilters} />
      <UserTable
        users={responseMatrix?.data ?? []}
        onView={(id) => console.log('View: ', id)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTrigger}
        paginationMeta={{
          total_records: responseMatrix?.meta?.total_records ?? 0,
          current_page: responseMatrix?.meta?.current_page ?? 1,
          total_pages: responseMatrix?.meta?.total_pages ?? 1,
          limit: filters.limit ?? 10,
          onPageChange: handlePageChange,
        }}
      />

       <GlobalDeleteModal 
          open={openDelete}
          onOpenChange={setOpenDelete}
          onConfirm={onConfirmDelete}
          loading={isDeleting}
          title={`Delete Employee "${selected?.name}"?`}
        />
    </div>
  );
}
