"use client";

import React from "react";
import {
  Users,
  Clock,
  AlertCircle,
  Shield,
  Loader2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import Pagination from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupItem } from "@/client";

export interface PaginationMeta {
  total_records: number;
  current_page: number;
  total_pages: number;
  limit: number;
  onPageChange: (page: number) => void;
}

interface GroupsTableProps {
  groups: GroupItem[];
  paginationMeta: PaginationMeta;
  isLoading?: boolean;
  onManageMembers: (group: GroupItem) => void;
  onEditGroup?: (group: GroupItem) => void;
  onDeleteGroup?: (group: GroupItem) => void;
}

export default function GroupsTable({
  groups,
  paginationMeta,
  isLoading,
  onManageMembers,
  onEditGroup,
  onDeleteGroup,
}: GroupsTableProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[450px]">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold tracking-wider text-slate-900 text-sm">
            GROUPS MANAGEMENT
          </h2>
          <p className="text-xs mt-0.5 text-slate-500">
            Overview of user groupings.
          </p>
        </div>
        {isLoading && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold">Group Name</th>
              <th className="p-3 font-bold">Type</th>
              <th className="p-3 font-bold">Supervisor</th>
              <th className="p-3 font-bold text-center">Members</th>
              <th className="p-3 font-bold text-center">Weekly Hours</th>
              <th className="p-3 font-bold text-center">Absence Limit</th>
              <th className="p-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    No groups found.
                  </div>
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{group.name}</div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {group.group_type_name || "—"}
                    </span>
                  </td>
                  <td className="p-3">
                    {group.supervisor ? (
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-700 truncate max-w-[140px]">
                          {group.supervisor.name}
                        </span>
                        {(group.supervisor.sup_count ?? 0) > 0 && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-full">
                            +{group.supervisor.sup_count}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onManageMembers(group)}
                      title="Click to view and manage members"
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 px-2 py-0.5 rounded-full text-[11px] transition"
                    >
                      <Users className="w-3 h-3 text-slate-500" />
                      {group.members_count}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-slate-600 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {group.expected_weekly_hours ?? 0} hrs
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {group.absence_threshold} sessions
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => onManageMembers(group)}
                          className="gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditGroup?.(group)}
                          className="gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* <DropdownMenuItem
                          onClick={() => onDeleteGroup?.(group)}
                          className="gap-2 text-xs font-medium text-rose-600 focus:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Group
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        total_pages={paginationMeta.total_pages}
        current_page={paginationMeta.current_page}
        total_records={paginationMeta.total_records}
        limit={paginationMeta.limit}
        onPageChange={paginationMeta.onPageChange}
      />
    </section>
  );
}
