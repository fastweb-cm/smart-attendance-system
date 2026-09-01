"use client";

import React, { useState } from "react";
import {
  useGroups,
  useAddGroupMember,
  useRemoveGroupMember,
} from "@/hooks/useGroups";
import { GroupItem } from "@/client";
import GroupsTable from "./GroupsTable";
import { GroupMembersSheet } from "./GroupMembersSheet";

export default function GroupsContainer() {
  const [page, setPage] = useState<number>(1);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  const activeGroupId = selectedGroup?.id ?? 0;

  const { data, isLoading } = useGroups({ page, limit: 10 });
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

  return (
    <div className="space-y-4">
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
      />

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
