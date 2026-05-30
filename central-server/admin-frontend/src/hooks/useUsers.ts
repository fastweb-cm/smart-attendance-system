"use client";

import { listUsersQueryKey } from "@/client/@tanstack/react-query.gen";
import { queryClient } from "@/lib/queryClient";
import { userMutation, sycUsersMutation } from "@/services/users/mutations";
import { getUsersQuery, ListusersFilters, userQueryKey } from "@/services/users/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

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
        onSuccess: () =>
            toast.success("User registered successfully"),
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
