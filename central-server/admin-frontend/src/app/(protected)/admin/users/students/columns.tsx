"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge"
import { ChevronsUpDown, Trash2, SquarePen } from "lucide-react"
import type { UserResponseType } from "@/schema/user.schema";

export const studentColumns: ColumnDef <UserResponseType>[] = [
    {
        accessorKey: "RegNumber",
        header: () => <div className="flex flex-start">Registration Number</div>,
        cell: ( { row } ) => <div className="text-center capitalize">{row.getValue("regno")}</div>
    },
    {
        accessorKey: "name",
        header: () => <div className="text-center">Name</div>,
        cell: ( { row } ) => <div className="text-center capitalize">{row.getValue("name")}</div>
    },
    {
        accessorKey: "gender",
        header: () => <div className="text-center">Gender</div>,
        cell: ({row}) => <div className="text-center capitalize">{row.getValue("gender")}</div>
    },
    {
        accessorKey: "studentClass",
        header: () => <div className="text-center">Student Class</div>,
        cell: ({row}) => <div className="text-center text-capitalize">{row.getValue("class")}</div>
    },
    {
        accessorKey: "biometricStatus",
        header: () => <div className="text-center">Biometric Status</div>,
        cell: ({row}) => {
            const status = row.getValue("biometric_enrollment_status") as string

            return (
                <div className="text-center">
                    <Badge
                        variant={
                            status === "active"
                            ? "default"
                            : status === "inactive"
                            ? "secondary"
                            : "destructive"
                        }
                    >
                    {status}
                    </Badge>
                </div>
            )
        }
    },
    {
        accessorKey: "action",
        header: () => <div className="text-center">Action</div>,
        cell: () => <div className="flex items-center justify-center gap-2">
            <Trash2 size={16} className="text-destructive cursor-pointer" />
            <SquarePen size={16} className="text-primary cursor-pointer" />
        </div>
    }
]
