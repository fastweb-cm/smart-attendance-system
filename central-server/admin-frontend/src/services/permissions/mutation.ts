
import { deletePermissionMutation, reviewPermissionMutation, upsertPermissionMutation } from "@/client/@tanstack/react-query.gen";


export const deletePermissionMut = () => {
    return deletePermissionMutation();
}

export const upsertPermissionMut = () => upsertPermissionMutation()

export const permissionReviewMut = () => reviewPermissionMutation();
