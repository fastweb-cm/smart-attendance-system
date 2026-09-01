"use client";

import { listUsersQueryKey, listUsersOptions } from "@/client/@tanstack/react-query.gen";

// Updated filters type matching your new OpenAPI spec
export type ListusersFilters = {
    user_type?: string; 
    role?: string;                          
    status?: string;
    search?: string;
    class_id?: number;
    page?: number;
    limit?: number;
};

export const getUsersQuery = (filters?: ListusersFilters) => 
    listUsersOptions({
        query: {
            user_type: filters?.user_type,
            role: filters?.role,
            status: filters?.status,
            search: filters?.search,
            class_id: filters?.class_id,
            page: filters?.page,
            limit: filters?.limit
        }
    });


export const userQueryKey = (filters?: ListusersFilters) => 
    listUsersQueryKey({
        query: {
            user_type: filters?.user_type,
            role: filters?.role,
            status: filters?.status,
            search: filters?.search,
            class_id: filters?.class_id,
            page: filters?.page,
            limit: filters?.limit
        }
    });


