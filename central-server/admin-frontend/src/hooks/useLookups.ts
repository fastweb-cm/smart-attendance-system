
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axiosClient";
import { LookupClass } from "@/types";

export const useClasses = (initialData: LookupClass[] = []) => {
    return useQuery<LookupClass[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await apiClient.get('/lookup/classes');
            return response.data;
        },
        initialData: initialData, // Uses the server-fetched data immediately
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    })
}
