"use client";

import { StudentsTable } from "@/app/(protected)/admin/users/students/students-table"
import { useUsers } from "@/hooks/useUsers"

export default function StudentsList() {
    const { data = [] , isLoading } = useUsers({ user_type: "student" });
    if(isLoading) return <div className="text-center">loading...</div>
  return (
    <>
        <StudentsTable data={data} />
    </>
  )
}
