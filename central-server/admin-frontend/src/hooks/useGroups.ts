import {
  listGroupsQueryKey,
  getGroupMembersQueryKey,
} from "@/client/@tanstack/react-query.gen";
import { queryClient } from "@/lib/queryClient";
import {
  createGroupMut,
  updateGroupMut,
  addGroupMemberMut,
  removeGroupMemberMut,
} from "@/services/groups/mutation";
import {
  getListGroupsQuery,
  listGroupsQueryKeyCustom,
  getGroupMembersQuery,
  groupMembersQueryKeyCustom,
} from "@/services/groups/queries";
import { ListGroupsQueryParams } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

/**
 * Fetch paginated list of groups
 */
export const useGroups = (filters?: ListGroupsQueryParams) =>
  useQuery({
    ...getListGroupsQuery(filters),
    queryKey: listGroupsQueryKeyCustom(filters),
    select: (response) => ({
      groups: response.data || [],
      meta: response.meta,
    }),
  });

/**
 * Fetch supervisors and members for a specific group
 */
export const useGroupMembers = (groupId: number, enabled: boolean = true) =>
  useQuery({
    ...getGroupMembersQuery(groupId),
    queryKey: groupMembersQueryKeyCustom(groupId),
    enabled: enabled && groupId > 0,
    select: (response) => ({
      groupId: response.data?.group_id,
      supervisors: response.data?.supervisors || [],
      members: response.data?.members || [],
    }),
  });

/**
 * Create new group
 */
export const useCreateGroup = () => {
  return useMutation({
    ...createGroupMut(),
    // eslint-disable-next-line
    onSuccess: (res: any) => {
      toast.success(res?.message || "Group created successfully");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: listGroupsQueryKey(),
      });
    },
    // eslint-disable-next-line
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create group");
    },
  });
};

/**
 * Update existing group
 */
export const useUpdateGroup = () => {
  return useMutation({
    ...updateGroupMut(),
    // eslint-disable-next-line
    onSuccess: (res: any) => {
      toast.success(res?.message || "Group updated successfully");
    },
    onSettled: async (_, __, variables) => {
      await queryClient.invalidateQueries({
        queryKey: listGroupsQueryKey(),
      });
      if (variables?.path?.id) {
        await queryClient.invalidateQueries({
          queryKey: groupMembersQueryKeyCustom(variables.path.id),
        });
      }
    },
    // eslint-disable-next-line
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update group");
    },
  });
};

/**
 * Add member or supervisor to group
 */
export const useAddGroupMember = (groupId: number) => {
  return useMutation({
    ...addGroupMemberMut(),
    // eslint-disable-next-line
    onSuccess: (res: any) => {
      toast.success(res?.message || "User assigned successfully");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: groupMembersQueryKeyCustom(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: listGroupsQueryKey(),
      });
    },
    // eslint-disable-next-line
    onError: (error: any) => {
      toast.error(error?.message || "Failed to assign user");
    },
  });
};

/**
 * Remove member or supervisor from group
 */
export const useRemoveGroupMember = (groupId: number) => {
  return useMutation({
    ...removeGroupMemberMut(),
    // eslint-disable-next-line
    onSuccess: (res: any) => {
      toast.success(res?.message || "User removed successfully");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: groupMembersQueryKeyCustom(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: listGroupsQueryKey(),
      });
    },
    // eslint-disable-next-line
    onError: (error: any) => {
      toast.error(error?.message || "Failed to remove user");
    },
  });
};
