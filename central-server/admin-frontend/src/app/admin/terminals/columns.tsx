'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge"
import { Trash2, EyeIcon } from "lucide-react";
import { TerminalFetchResponse } from "@/client";

export const terminalColumns = (
  onView: (t: TerminalFetchResponse) => void
): ColumnDef<TerminalFetchResponse>[] => [
  {
    accessorKey: "name",
    header: () => <div className="text-left">Terminal Name</div>,
    cell: ({ row }) => <div className="text-left capitalize">{row.getValue("name")}</div>
  },
  {
    accessorKey: "branch",
    header: () => <div className="text-center">Location</div>,
    cell: ({ row }) => <div className="text-center capitalize">{row.getValue("branch")}</div>
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue("status") as string

      return (
        <div className="text-center">
          <Badge
            variant={
              status === "active"
                ? "active"
                : status === "pending"
                  ? "default"
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
    accessorKey: "ip_address",
    header: () => <div className="text-center">IP Address</div>,
    cell: ({ row }) => {
      const ip = row.getValue("ip_address") as string | null

      return (
        <div className="text-center">
          {ip || "N/A"}
        </div>
      )
    }
  },
  {
    accessorKey: "last_heartbeat",
    header: () => <div className="text-center">Last Heartbeat</div>,
    cell: ({ row }) => {
      const heartbeat = row.getValue("last_heartbeat") as string | null

      return (
        <div className="text-center">
          {heartbeat ? new Date(heartbeat).toLocaleString() : "N/A"}
        </div>
      )
    }
  },
  {
    accessorKey: "health_status",
    header: () => <div className="text-center">Health Status</div>,
    cell: ({ row }) => {
      const status = row.getValue("health_status") as string

      return (
        <div className="text-center">
          <Badge
            variant={
              status === "online"
                ? "active"
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
    cell: ({ row }) => <div className="flex items-center justify-center gap-2">
      <div title="View Details" onClick={() => onView(row.original)}>
        <EyeIcon size={16} className="text-primary cursor-pointer" />
      </div>
      <div title="Delete">
        <Trash2 size={16} className="text-destructive cursor-pointer" />
      </div>
    </div>
  }
]
