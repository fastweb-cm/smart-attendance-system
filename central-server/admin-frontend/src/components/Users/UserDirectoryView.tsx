"use client";

import React, { useState, useCallback } from "react";
import { useUsers } from "@/hooks/useUsers";
import { ListusersFilters } from "@/services/users/queries";
import { UserQueryFilterBar } from "./UserQueryFilterBar";
import UserTable from "./UserTable";
import { GlobalDeleteModal } from "../modals/GlobalDeleteModal";
import { UserResponse } from "@/client";

export default function UsersDirectoryView() {
  const [filters, setFilters] = useState<ListusersFilters>({
    user_type: undefined,
    role: undefined,
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
  });

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
    if (!selected) return;
    setIsDeleting(true);
    try {
      // await deleteTerminalApi(selected.id); 
      // await deleteTerminalMutation.mutateAsync({ path:{ id: selected.id } });
      console.log("deleted")
      setOpenDelete(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      <UserQueryFilterBar filters={filters} onFilterChange={handleFilterChange} onReset={handleResetFilters} />
      <UserTable
        users={responseMatrix?.data ?? []}
        onView={(id) => console.log('View: ', id)}
        onEdit={(id) => console.log('Edit: ', id)}
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
