import { getAllPermissionsOptions, getAllPermissionsQueryKey } from "@/client/@tanstack/react-query.gen";
import { PermissionQueryParams } from "@/types";

export const getAllPermissions = (filters?: PermissionQueryParams) => 
  getAllPermissionsOptions({
    query: {
      search: filters?.search,
      status: filters?.status,
      page: filters?.page,
      limit: filters?.limit,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    },
  });

export const getAllPermissionsKey = (filters?: PermissionQueryParams) => 
  getAllPermissionsQueryKey({
    query: {
      search: filters?.search,
      status: filters?.status,
      page: filters?.page,
      limit: filters?.limit,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    },
  });
