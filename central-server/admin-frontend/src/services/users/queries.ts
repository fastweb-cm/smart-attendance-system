"use client";

import { listUsersQueryKey, listUsersOptions } from "@/client/@tanstack/react-query.gen";

// Updated filters type matching your new OpenAPI spec
export type ListusersFilters = {
    user_type?: string; 
    role?: string;                          
    status?: string;
    search?: string;
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
            page: filters?.page,
            limit: filters?.limit
        }
    });


