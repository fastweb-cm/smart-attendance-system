import { PermissionQueryParams } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getAllPermissions, getAllPermissionsKey } from "@/services/permissions/queries";

// get all permissions
export const useAllPermissions = (
    filters?: PermissionQueryParams
) => useQuery({
    ...getAllPermissions(filters),
    queryKey: getAllPermissionsKey(filters),
    select: (res) => {
        return {
            data: res.data,
            meta: res.meta
        }
    }
});
