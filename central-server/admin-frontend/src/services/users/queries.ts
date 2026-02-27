"use client";

import { UserStatus, UserType } from "@/client";
import { listUsersQueryKey, listUsersOptions } from "@/client/@tanstack/react-query.gen";

export type ListusersFilters = {
    user_type?: UserType,
    status?: UserStatus
}

export const getUsersQuery = (
    filters?: ListusersFilters
) => 
    listUsersOptions({
        query: {
            user_type: filters?.user_type,
            status: filters?.status
        }
    });

export const userQueryKey = (
    filters?: ListusersFilters
) => listUsersQueryKey({
    query: {
        user_type: filters?.user_type,
        status: filters?.status
    }
});
