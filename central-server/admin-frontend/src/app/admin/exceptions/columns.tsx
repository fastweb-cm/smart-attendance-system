"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge"
import { AttendanceException } from "@/types";
import { formatDateFriendly, getDaysDifference } from "@/lib/utils";
import { Edit3, Trash2 } from "lucide-react";

export function exceptionColumns(
    onEdit: (e: AttendanceException) => void,
    onDelete: (e: AttendanceException) => void
): ColumnDef<AttendanceException>[] {
    return [
        {
            accessorKey: "title",
            header: () => <div className="text-left">Title</div>,
            cell: ({ row }: { row: Row<AttendanceException> }) => <div className="text-left">
                <div className="font-semibold text-sm">{row.getValue("title")}</div>
            <div className="text-xs text-muted mt-1 max-w-sm line-clamp-1">{row.getValue("description") || 'No description provided'}</div>
        </div>
    },
    {
        accessorKey: "exception_type",
        header: () => <div className="text-center">Exception Type</div>,
        cell: ({ row }: { row: Row<AttendanceException> }) => {
            const type = row.getValue("exception_type") as string;

            return (
                <div className="text-center">
                    <TypeBadge type={type} />
                </div>
            )
        }
    },
    {
        id: "time_range",
        header: () => <div className="text-center">Time Range</div>,
        cell: ({ row }: { row: Row<AttendanceException> }) => {
            const { start_date, end_date } = row.original;

            return (
                <div className="text-center">
                    <div className="text-sm font-medium">{formatDateFriendly(start_date)} <span className="text-primary">→</span> {formatDateFriendly(end_date)}</div>
                </div>
            )
        }
    },
    {
        id: "excluded_days",
        header: () => <div className="text-center">Excluded Days</div>,
        cell: ({ row }: { row: Row<AttendanceException> }) => {
            const { start_date, end_date } = row.original;

            const daysCount = getDaysDifference(start_date, end_date);

            return (
                <div className="text-center">
                    <div className="text-sm font-medium">{daysCount} {daysCount === 1 ? 'Day' : 'Days'}</div>
                </div>
            )
        }
    },
    {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => <div className="flex items-center justify-center gap-2">
            <div title="Edit" >
                <Edit3 size={16} onClick={() => onEdit(row.original)} className="text-primary cursor-pointer" />
            </div>
            <div title="Delete">
                <Trash2 size={16} onClick={() => onDelete(row.original)} className="text-destructive cursor-pointer" />
            </div>
        </div>
    }
]
}

export const TypeBadge = ({ type }: { type: string }) => {
  const badgeMap: Record<string, { label: string; classes: string }> = {
    public_holiday: {
      label: "Public Holiday",
      classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    company_event: {
      label: "Company Event",
      classes: "bg-sky-500/10 text-sky-400 border-sky-500/20"
    },
    system_maintenance: {
      label: "System Maintenance",
      classes: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    emergency_closure: {
      label: "Emergency Closure",
      classes: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    },
    other: {
      label: "Other Exemption",
      classes: "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  };

  const current = badgeMap[type] || badgeMap.other;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${current.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
      {current.label}
    </span>
  );
};
