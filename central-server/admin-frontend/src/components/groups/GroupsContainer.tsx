"use client";

import React, { useState } from "react";
import {
  useGroups,
  useGroupMembers,
  useAddGroupMember,
  useRemoveGroupMember,
} from "@/hooks/useGroups";
import { GroupItem } from "@/client";
import { GroupCreateFormValues } from "@/schema/group.schema";
import GroupsTable from "./GroupsTable";
import { GroupMembersSheet } from "./GroupMembersSheet";
import { GroupWizard } from "./groupWizard";

export default function GroupsContainer() {
  const [page, setPage] = useState<number>(1);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  // Editing state
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const activeGroupId = selectedGroup?.id ?? 0;
  const editingGroupId = editingGroup?.id ?? 0;

  const { data, isLoading } = useGroups({ page, limit: 10 });

  // Fetch full supervisor and member lists for the group being edited
  const { data: editGroupMembersData, isLoading: isLoadingEditMembers } =
    useGroupMembers(editingGroupId, isEditing);

  const addGroupMemberMutation = useAddGroupMember(activeGroupId);
  const removeGroupMemberMutation = useRemoveGroupMember(activeGroupId);

  const handleManageMembers = (group: GroupItem) => {
    setSelectedGroup(group);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedGroup(null);
  };

  const handleStartEdit = (group: GroupItem) => {
    setEditingGroup(group);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setIsEditing(false);
  };

  const handleAddUser = async (userId: number, role: "member" | "supervisor") => {
    if (!activeGroupId) return;
    await addGroupMemberMutation.mutateAsync({
      path: { id: activeGroupId },
      body: { user_id: userId, role },
    });
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!activeGroupId) return;
    await removeGroupMemberMutation.mutateAsync({
      path: { id: activeGroupId, userId: memberId },
      query: { role: "member" },
    });
  };

  const handleRemoveSupervisor = async (supervisorId: number) => {
    if (!activeGroupId) return;
    await removeGroupMemberMutation.mutateAsync({
      path: { id: activeGroupId, userId: supervisorId },
      query: { role: "supervisor" },
    });
  };

  // Build prepopulated GroupCreateFormValues once member data is ready
  const initialEditData: GroupCreateFormValues | undefined = editingGroup
    ? {
        groupDetails: {
          id: editingGroup.id,
          name: editingGroup.name,
          branch_id: editingGroup.branch_id ?? 1,
          grouptype_id: editingGroup.grouptype_id ?? 1,
          expected_weekly_hours: editingGroup.expected_weekly_hours ?? 40,
          absence_threshold: editingGroup.absence_threshold ?? 3,
        },
        member_ids: editGroupMembersData?.members.map((m) => m.id) || [],
        supervisor_ids: editGroupMembersData?.supervisors.map((s) => s.id) || [],
      }
    : undefined;

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">
                Editing Group: {editingGroup?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Modify group settings, member assignments, or supervisors.
              </p>
            </div>
            <button
              onClick={handleCancelEdit}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          </div>

          {isLoadingEditMembers ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
              Loading existing group members and supervisors...
            </div>
          ) : (
            <GroupWizard
              initialData={initialEditData}
              onSuccess={() => {
                handleCancelEdit();
              }}
            />
          )}
        </div>
      ) : (
        <GroupsTable
          groups={data?.groups || []}
          isLoading={isLoading}
          paginationMeta={{
            current_page: data?.meta?.current_page || page,
            total_pages: data?.meta?.total_pages || 1,
            total_records: data?.meta?.total_records || 0,
            limit: data?.meta?.limit || 10,
            onPageChange: (newPage) => setPage(newPage),
          }}
          onManageMembers={handleManageMembers}
          onEditGroup={handleStartEdit}
        />
      )}

      <GroupMembersSheet
        groupId={selectedGroup?.id ?? null}
        groupName={selectedGroup?.name}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        onAddUser={handleAddUser}
        onRemoveMember={handleRemoveMember}
        onRemoveSupervisor={handleRemoveSupervisor}
      />
    </div>
  );
}
