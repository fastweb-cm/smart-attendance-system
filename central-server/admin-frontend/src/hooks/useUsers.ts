"use client";

import { getUserByIdQueryKey, listUsersQueryKey } from "@/client/@tanstack/react-query.gen";
import { queryClient } from "@/lib/queryClient";
import { userMutation, sycUsersMutation, deleteUserMut, updateUserMut } from "@/services/users/mutations";
import { getUsersQuery, ListusersFilters, userQueryKey } from "@/services/users/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

const queryKey = userQueryKey();

// Get all users with paginated matrix and search queries
export const useUsers = (filters?: ListusersFilters) => 
    useQuery({
        ...getUsersQuery(filters),
        // Keeps old page data on screen while loading the next page
        placeholderData: (previousData) => previousData, 
    });

// Create user hook
export const useCreateUser = () =>
    useMutation({
        ...userMutation(),
        onSuccess: (res) =>
            toast.success(res.message || "Employee registered successfully"),
        onError: (error) =>
            console.log(error.response?.status),
        onSettled: async (_, __, variables) => {
            const user_type = variables?.body?.user_type;
            
            // Invalidate any user list query belonging to this user type,
            // regardless of the current page, limit, or search filters.
            await queryClient.invalidateQueries({
                queryKey: listUsersQueryKey({
                    query: { user_type }
                }),
                exact: false // Crucial: targets all pages and filters across this entity type
            });
        }
    });

// update empl hook
export const useUpdateEmployee = () => {
    return useMutation({
        ...updateUserMut(),
        onSuccess: (res) => {
            toast.success(res.message || "Update operation was sucessful")
        },
        onError: (error) => {
            toast.error(error.message || "An unexpected error occurred while updating user profile")
        },
        onSettled: async (_, __, variables) => {
            const userId = (variables)?.path?.id;
            const userType = (variables)?.body?.user_type;

            // Flush individual user caches using the generated hook target index
            if (userId) {
                await queryClient.invalidateQueries({
                    queryKey: getUserByIdQueryKey({ path: { id: userId } })
                });
            }

            // Invalidate user listings filtered matching the current user's profile group
            await queryClient.invalidateQueries({
                queryKey: listUsersQueryKey({
                    query: { user_type: userType }
                }),
                exact: false // Targets all filter variants and pagination indices
            });
        }
    })
}

// delete employee mutation hook
export const useDeleteEmployee = () => {
    return useMutation({
        ...deleteUserMut(),
        onSuccess: (res) => {
            toast.success (res.message || "Employee deleted successfully")
        },
        onSettled: async () => {
            // invalidate the list of employees after the delete
            await queryClient.invalidateQueries({ queryKey })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete employee")
        }
    })
}

//sync users hook
export const useSyncUsers = () =>
    useMutation({
        ...sycUsersMutation(),
        onSettled: async () => {
            await queryClient.invalidateQueries({
                queryKey: listUsersQueryKey()
            })
        }
    })
