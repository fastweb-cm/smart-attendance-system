
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axiosClient";
import { GroupWithSubgroupsLookup, Lookup, LookupBranch, LookupClass } from "@/types";

export const useClasses = (initialData: LookupClass[] = []) => {
    return useQuery<LookupClass[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await apiClient.get('/api/v1/lookup/classes');
            return response.data;
        },
        initialData: initialData, // Uses the server-fetched data immediately
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
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
