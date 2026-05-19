"use client";

import ExceptionsTable from "@/app/admin/exceptions/exceptions-table";
import { AttendanceException } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalDeleteModal } from "./modals/GlobalDeleteModal";
import { useDeleteException, useExceptions } from "@/hooks/useExceptions";


export default function ExceptionList() {
    const [selected, setSelected] = useState<AttendanceException | null>(null)
    
    const [openDelete, setOpenDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const { data: exceptions = [], isLoading } = useExceptions();
    const deleteExceptionMutation = useDeleteException();

    const handleDeleteTrigger = (e: AttendanceException) => {
        setSelected(e);
        setOpenDelete(true);
    }

    const handleEdit = (e: AttendanceException) => {
        console.log(e)
    }

    const onConfirmDelete = async () => {
        if (!selected || !selected.id) return;
        setIsDeleting(true)
        try {
            await deleteExceptionMutation.mutateAsync({ path: { id: selected.id } });
            setOpenDelete(false);
    
        } catch (error) {
            console.error(error);
        }finally{
            setIsDeleting(false)
        }
    }
    if (isLoading) return <div className="text-center">loading...</div>
  return (
    <>
        <ExceptionsTable data={exceptions} onEdit={handleEdit} onDelete={handleDeleteTrigger} />

        <GlobalDeleteModal
            open={openDelete}
            onOpenChange={setOpenDelete}
            onConfirm={onConfirmDelete}
            loading={isDeleting}
            title={`Delete Exception "${selected?.title}"`}
         />
    </>
  )
}
