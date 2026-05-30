
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axiosClient";
import { GroupWithSubgroupsLookup, Lookup, LookupBranch, LookupClass } from "@/types";
import { User } from "@/client";

export const useClasses = (initialData?: LookupClass[]) => {
    return useQuery<LookupClass[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await apiClient.get('/api/v1/lookup/classes');
            return response.data;
        },
        // Only applies if you explicitly pass data from a server component
        initialData: initialData, 
        staleTime: 1000 * 60 * 5, // 5 minutes cache freshness
    })
}

export const useBranches = (initialData: LookupBranch[] = []) => {
    return useQuery<LookupBranch[]> ({
        queryKey: ['branches'],
        queryFn: async () => {
            const response = await apiClient.get('/api/v1/lookup/branches');
            return response.data
        },
        initialData,
        staleTime: 1000 * 60 * 5,
        refetchOnMount: true, 
    })
}

export const useAuthTypes = (initialData: Lookup[] = []) => {
    return useQuery<Lookup[]>({
        queryKey: ['authTypes'],
        queryFn: async () => {
            const response = await apiClient.get('/api/v1/lookup/auth-types');
            return response.data;
        },
        initialData: initialData,
        staleTime: 1000 * 60 * 5,
    })
}

export const useAuthPolicies = (initialData: GroupWithSubgroupsLookup[] = []) => {
    return useQuery<GroupWithSubgroupsLookup[]>({
        queryKey: ['authPolicies'],
        queryFn: async () => {
            const response = await apiClient.get('/api/v1/lookup/auth-policies');
            return response.data;
        },
        initialData: initialData,
        staleTime: 1000 * 60 * 5,
    })
}

export const useUsers = (userType?: string) => {
    return useQuery<Lookup[]>({
        // Fallback placeholder string stabilizes cache tracking if userType is undefined
        queryKey: ['users', userType ?? 'all'],
        queryFn: async () => {
            const response = await apiClient.get(`/api/v1/lookup/users`, {
                params: {
                    // Force text formatting or pass undefined explicitly
                    userType: userType || undefined
                }
            });
            return response.data;
        },
        staleTime: 1000 * 60 * 5,
    });
};

export const usePermissionTypes = () => {
    return useQuery<Lookup[]>({
        queryKey: ['permission_types'],
        queryFn: async () => {
            const res = await apiClient.get("/api/v1/lookup/permissions/types");
            return res.data.data;
        }
    })
}

export const useEmployeeRoles = () => {
    return useQuery<Lookup[]>({
        queryKey: ['employee_roles'],
        queryFn: async () => {
            const res = await apiClient.get("/api/v1/lookup/roles");
            return res.data;
        }
    })
}

export const useEmployee = (id?: number) => {
    return useQuery<User>({
        queryKey: ['employee', id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/v1/users/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};



