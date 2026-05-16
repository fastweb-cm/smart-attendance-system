"use client";

import TerminalsTable from "@/app/admin/terminals/terminals-table";
import { TerminalFetchResponse } from "@/client";
import { useDeleteTerminal, useTerminals } from "@/hooks/useTerminals";
import { useState } from "react";
import { TerminalDetailsModal } from "./modals/TerminalDetailsModal";
import { GlobalDeleteModal } from "./modals/GlobalDeleteModal";
import { useRouter } from "next/navigation";

export default function TerminalList() {
  const { data = [], isLoading } = useTerminals();

  const [selected, setSelected] =
    useState<TerminalFetchResponse | null>(null);

  const [open, setOpen] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteTrigger = (terminal: TerminalFetchResponse) => {
    setSelected(terminal);
    setOpenDelete(true);
  }

  const deleteTerminalMutation = useDeleteTerminal();

  if (isLoading) return <div className="text-center">loading...</div>;

  const handleView = (terminal: TerminalFetchResponse) => {
    setSelected(terminal);
    setOpen(true);
  };

  const handleEdit = (terminal: TerminalFetchResponse) => {
    // navigate to terminal edit page
    router.push(`/admin/terminals/${terminal.slug}/edit`);
  };

  const onConfirmDelete = async () => {
    if (!selected) return;
    setIsDeleting(true);
    try {
      // await deleteTerminalApi(selected.id); 
      await deleteTerminalMutation.mutateAsync({ path:{ id: selected.id } });
      setOpenDelete(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TerminalsTable data={data} onEdit={handleEdit} onView={handleView} onDelete={handleDeleteTrigger} />

      <TerminalDetailsModal
        open={open}
        onOpenChange={setOpen}
        terminal={selected}
      />

      <GlobalDeleteModal 
        open={openDelete}
        onOpenChange={setOpenDelete}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
        title={`Delete Terminal "${selected?.name}"?`}
      />
    </>
  );
}
