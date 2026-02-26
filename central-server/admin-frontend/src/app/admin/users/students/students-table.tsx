import { studentColumns } from "./columns";
import { DataTable } from "@/components/data-table";
import { UserResponseType } from "@/schema/user.schema";


export function StudentsTable({data}: {data: UserResponseType[]}) {
    return <DataTable columns={studentColumns} data={data} label="All Students" emptyText="No Student Found"/>
}
