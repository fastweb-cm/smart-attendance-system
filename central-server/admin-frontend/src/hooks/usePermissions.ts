import { PermissionQueryParams } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllPermissions, getAllPermissionsKey } from "@/services/permissions/queries";
import { deletePermissionMut } from "@/services/permissions/mutation";
import { queryClient } from "@/lib/queryClient";
import { toast } from "react-toastify";

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

// delete permissio hook
export const useDeletePermission = () => {
    return useMutation({
        ...deletePermissionMut(),
        onSuccess: async (res) => {
            toast.success(res.message || "Permission deleted successfully")
            // invalidate the list query so the ui table automaically re-sync
            await queryClient.invalidateQueries()
        }, 
        onError: (err) => {
            toast.error(err.message || "Failed to delete permission, an unexpected error occured")
        }
    })
}
