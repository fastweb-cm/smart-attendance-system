import {
  listGroupsOptions,
  listGroupsQueryKey,
  getGroupMembersOptions,
  getGroupMembersQueryKey,
} from "@/client/@tanstack/react-query.gen";
import { ListGroupsQueryParams } from "@/types";

const buildListGroupsQuery = (filters?: ListGroupsQueryParams) => ({
  page: filters?.page ?? 1,
  limit: filters?.limit ?? 10,
});

/**
 * List Groups Query Options & Key
 */
export const getListGroupsQuery = (filters?: ListGroupsQueryParams) =>
  listGroupsOptions({ query: buildListGroupsQuery(filters) });

export const listGroupsQueryKeyCustom = (filters?: ListGroupsQueryParams) =>
  listGroupsQueryKey({ query: buildListGroupsQuery(filters) });

/**
 * Get Group Members Query Options & Key
 */
export const getGroupMembersQuery = (groupId: number) =>
  getGroupMembersOptions({
    path: { id: groupId },
  });

export const groupMembersQueryKeyCustom = (groupId: number) =>
  getGroupMembersQueryKey({
    path: { id: groupId },
  });
