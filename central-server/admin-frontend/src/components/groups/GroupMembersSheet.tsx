"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroupMembers } from "@/hooks/useGroups";
import { useUsersLookup } from "@/hooks/useLookups";
import {
  Users,
  Shield,
  Mail,
  Hash,
  Loader2,
  AlertCircle,
  UserPlus,
  Trash2,
  Search,
  Check,
} from "lucide-react";

interface GroupMembersSheetProps {
  groupId: number | null;
  groupName?: string;
  isOpen: boolean;
  onClose: () => void;
  onRemoveMember?: (memberId: number) => void;
  onRemoveSupervisor?: (supervisorId: number) => void;
  onAddUser?: (userId: number, role: "member" | "supervisor") => void;
}

export function GroupMembersSheet({
  groupId,
  groupName,
  isOpen,
  onClose,
  onRemoveMember,
  onRemoveSupervisor,
  onAddUser,
}: GroupMembersSheetProps) {
  const { data, isLoading, isError } = useGroupMembers(
    groupId ?? 0,
    isOpen && Boolean(groupId)
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addMode, setAddMode] = useState<"member" | "supervisor">("member");
  const [addingUserId, setAddingUserId] = useState<number | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch candidate users from lookup hook when input is active
  const { data: userSearchResults, isLoading: isSearching } = useUsersLookup(
    debouncedSearch.length > 0
      ? {
          search: debouncedSearch,
          limit: 6,
        }
      : undefined
  );

  const handleAddCandidate = async (userId: number) => {
    if (!onAddUser) return;
    setAddingUserId(userId);
    try {
      await onAddUser(userId, addMode);
      setSearchQuery("");
      setDebouncedSearch("");
    } finally {
      setAddingUserId(null);
    }
  };

  // Check if candidate user is already assigned
  const existingMemberIds = new Set(data?.members.map((m) => m.id) || []);
  const existingSupervisorIds = new Set(data?.supervisors.map((s) => s.id) || []);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-white p-0 flex flex-col h-full border-l border-slate-200">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
          <SheetTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            {groupName ? `${groupName} Members` : "Group Members"}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            Manage assigned supervisors and group members.
          </SheetDescription>
        </SheetHeader>

        {/* Quick Add Bar with Real-time Lookup Results */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3 relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Type name or email to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 animate-spin" />
              )}
            </div>
            <div className="flex rounded-md bg-slate-200/60 p-0.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setAddMode("member")}
                className={`px-2 py-1 rounded transition ${
                  addMode === "member"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => setAddMode("supervisor")}
                className={`px-2 py-1 rounded transition ${
                  addMode === "supervisor"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Supervisor
              </button>
            </div>
          </div>

          {/* Search Dropdown Overlay */}
          {debouncedSearch.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 shadow-lg rounded-b-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
              {userSearchResults && userSearchResults.length > 0 ? (
                userSearchResults.map((user) => {
                  const isAssigned =
                    addMode === "member"
                      ? existingMemberIds.has(user.id!)
                      : existingSupervisorIds.has(user.id!);

                  return (
                    <div
                      key={user.id}
                      className="p-3 hover:bg-slate-50 flex items-center justify-between transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {user.fname} {user.lname}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {user.email || user.regno || "No details"}
                        </div>
                      </div>

                      {isAssigned ? (
                        <span className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Added
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={addingUserId === user.id}
                          onClick={() => handleAddCandidate(user.id!)}
                          className="h-7 text-[11px] gap-1 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        >
                          {addingUserId === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                          Add as {addMode === "member" ? "Member" : "Supervisor"}
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {`No users found matching "${debouncedSearch}"`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Members & Supervisors Lists */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              <span className="text-xs">Loading group assignments...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-rose-500 gap-2 text-center">
              <AlertCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Failed to load group data.</span>
            </div>
          ) : (
            <>
              {/* Supervisors Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Supervisors ({data?.supervisors.length || 0})
                  </div>
                </div>

                {data?.supervisors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No supervisors assigned.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data?.supervisors.map((sup) => (
                      <div
                        key={sup.id}
                        className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {sup.name}
                          </div>
                          {sup.email && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-2.5 h-2.5" />
                              {sup.email}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {sup.regno && (
                            <span className="text-[10px] font-mono font-medium text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                              {sup.regno}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveSupervisor?.(sup.id)}
                            className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Remove supervisor"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Members Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    Group Members ({data?.members.length || 0})
                  </div>
                </div>

                {data?.members.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No members added to this group yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                    {data?.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 hover:bg-slate-50 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {member.name}
                          </div>
                          {member.email && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-2.5 h-2.5" />
                              {member.email}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {member.regno && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <Hash className="w-2.5 h-2.5 text-slate-400" />
                              {member.regno}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveMember?.(member.id)}
                            className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Remove member"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
