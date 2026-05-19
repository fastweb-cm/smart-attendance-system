"use client";

import ExceptionsTable from "@/app/admin/exceptions/exceptions-table";
import { AttendanceException } from "@/types";
import { INITIAL_EXCEPTIONS } from "@/lib/data";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalDeleteModal } from "./modals/GlobalDeleteModal";


export default function ExceptionList() {

    const [selected, setSelected] = useState<AttendanceException | null>(null)
    
    const [openDelete, setOpenDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDeleteTrigger = (e: AttendanceException) => {
        setSelected(e);
        setOpenDelete(true);
    }

    const handleEdit = (e: AttendanceException) => {
        console.log(e)
    }

    const onConfirmDelete = async () => {
        if (!selected) return;
        setIsDeleting(true)
        console.log("deleted")

        setIsDeleting(false)
    }
  return (
    <>
        <ExceptionsTable data={INITIAL_EXCEPTIONS} onEdit={handleEdit} onDelete={handleDeleteTrigger} />

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
