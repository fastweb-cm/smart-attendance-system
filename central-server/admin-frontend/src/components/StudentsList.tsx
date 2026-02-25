"use client";

import { StudentsTable } from "@/app/(protected)/admin/users/students/students-table"
import { useUsers } from "@/hooks/useUsers"
import { zUserResponse } from "@/client/zod.gen";

export default function StudentsList() {
    const { data = [] , isLoading } = useUsers();
  return (
    <>
        <StudentsTable data={data} />
    </>
  )
}
